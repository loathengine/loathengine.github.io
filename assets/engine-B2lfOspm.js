function clamp(value, lower, upper) {
	return Math.min(Math.max(value, lower), upper);
}
function loadingDensity(chargeMassKg, usableVolumeM3, bulkDensityKgPerM3) {
	return chargeMassKg / Math.max(usableVolumeM3 * bulkDensityKgPerM3, 1e-12);
}
function chargeKgAtLoadingDensity(loadingDensityFraction, usableVolumeM3, bulkDensityKgPerM3) {
	return loadingDensityFraction * usableVolumeM3 * bulkDensityKgPerM3;
}
var MODEL_CONSTANT_KEYS = [
	"specific_heat_ratio",
	"reference_pressure_pa",
	"bore_friction_pressure_pa",
	"engraving_decay_length_m",
	"initial_burn_fraction",
	"barrel_heat_loss_coefficient",
	"gas_covolume_m3_per_kg",
	"neck_tension_pressure_pa",
	"freebore_jump_threshold_m",
	"reference_bearing_length_m",
	"bore_friction_multiplier_min",
	"bore_friction_multiplier_max",
	"freebore_jump_m",
	"ignition_deficit_ball",
	"ignition_deficit_multi_perf",
	"ignition_deficit_extruded",
	"ignition_factor_min",
	"time_step_s",
	"max_simulation_time_s",
	"overpressure_limit_pa",
	"trace_sample_stride",
	"reference_loading_density",
	"reference_bore_diameter_mm",
	"burn_rate_adjustment_min",
	"burn_rate_adjustment_max",
	"calibrated_fill_min",
	"calibrated_fill_max",
	"default_burn_exponent",
	"default_burn_fraction_at_surface_peak",
	"default_burn_surface_peak_gain",
	"default_burn_fraction_at_sliver_start",
	"default_engraving_pressure_pa",
	"default_bearing_surface_fraction",
	"surface_peak_burn_fraction_min",
	"surface_peak_burn_fraction_max",
	"surface_peak_gain_min",
	"sliver_start_burn_fraction_min",
	"sliver_start_burn_fraction_max",
	"coal_absent_at_or_below_mm",
	"chamber_volume_min_m3",
	"bullet_travel_min_m",
	"ensemble_runs",
	"ensemble_runs_min",
	"ensemble_seed",
	"ensemble_case_capacity_sigma",
	"ensemble_charge_sigma_g",
	"ensemble_impetus_sigma_scale",
	"ensemble_surviving_fraction_min"
];
function assertModelConstants(model) {
	if (model == null || typeof model !== "object") throw new Error("The calibration data is out of date: it has no model constants.");
	const record = model;
	for (const key of MODEL_CONSTANT_KEYS) if (typeof record[key] !== "number" || !Number.isFinite(record[key])) throw new Error(`The calibration data is out of date: model constant ${key} is missing or not a number.`);
	const known = new Set(MODEL_CONSTANT_KEYS);
	const unknown = Object.keys(record).filter((key) => !known.has(key));
	if (unknown.length > 0) throw new Error(`The calibration data carries model constants this engine does not know: ${unknown.join(", ")}.`);
}
function ignitionDeficitFor(kernelShape, model) {
	switch (kernelShape) {
		case "ball": return model.ignition_deficit_ball;
		case "extrudedMultiPerf": return model.ignition_deficit_multi_perf;
		default: return model.ignition_deficit_extruded;
	}
}

var WATER_GRAMS_TO_M3 = 1e-6 / .9982;
var MM_TO_M = .001;
var QUARTER_PI = Math.PI / 4;
function resolveDiameters(cartridge, diameters) {
	const calibre = cartridge.diameterId ? diameters?.get(cartridge.diameterId) : void 0;
	return {
		bulletDiameterMm: calibre?.bulletDiameterMm,
		boreDiameterMm: calibre?.boreDiameterMm
	};
}
function prepFailure(code, message) {
	return {
		ok: false,
		code,
		message
	};
}
function boreFrictionMultiplier(bearingSurfaceMm, overallLengthMm, model) {
	const bearingLengthM = (bearingSurfaceMm ?? model.default_bearing_surface_fraction * overallLengthMm) * MM_TO_M;
	return clamp(bearingLengthM / model.reference_bearing_length_m, model.bore_friction_multiplier_min, model.bore_friction_multiplier_max);
}
function usableCaseVolumeM3(capacityWaterGrams, seatingDepthMm, grooveDiameterM) {
	const seatedBulletVolumeM3 = seatingDepthMm * MM_TO_M * QUARTER_PI * grooveDiameterM * grooveDiameterM;
	return capacityWaterGrams * WATER_GRAMS_TO_M3 - seatedBulletVolumeM3;
}
function buildSimInput(args, model) {
	const { cartridge, powder, bullet } = args;
	const cartridgeName = cartridge.name || cartridge.id;
	const bulletName = bullet.name || bullet.id;
	const powderName = powder.name || powder.id;
	const capacityWaterGrams = args.caseCapacityH2oGrams || cartridge.baseCapacityH2oGrams;
	if (!capacityWaterGrams || capacityWaterGrams <= 0) return prepFailure("missingCapacity", `Cartridge '${cartridgeName}' has no case capacity (baseCapacityH2oGrams).`);
	if (!cartridge.bulletDiameterMm || cartridge.bulletDiameterMm <= 0) return prepFailure("missingBulletDiameter", `Cartridge '${cartridgeName}' has no bulletDiameterMm.`);
	if (!cartridge.boreDiameterMm || cartridge.boreDiameterMm <= 0) return prepFailure("missingBoreDiameter", `Cartridge '${cartridgeName}' has no boreDiameterMm.`);
	const caseLengthMm = cartridge.maxCaseLengthMm || cartridge.trimLengthMm;
	if (!caseLengthMm || caseLengthMm <= 0) return prepFailure("missingCaseLength", `Cartridge '${cartridgeName}' has neither maxCaseLengthMm nor trimLengthMm.`);
	if (!bullet.weightGrams || bullet.weightGrams <= 0) return prepFailure("missingBulletWeight", `Bullet '${bulletName}' has no weightGrams.`);
	const bulletOverallLengthMm = bullet.overallLengthMm;
	if (!bulletOverallLengthMm || bulletOverallLengthMm <= 0) return prepFailure("missingBulletLength", `Bullet '${bulletName}' has no overallLengthMm.`);
	if (!powder.propellantDensityKgM3 || powder.propellantDensityKgM3 <= 0) return prepFailure("missingPowderDensity", `Powder '${powderName}' has no propellantDensityKgM3.`);
	if (!powder.bulkDensityKgM3 || powder.bulkDensityKgM3 <= 0) return prepFailure("missingPowderBulkDensity", `Powder '${powderName}' has no bulkDensityKgM3.`);
	if (!powder.heatOfExplosionKjKg || powder.heatOfExplosionKjKg <= 0) return prepFailure("missingPowderEnergy", `Powder '${powderName}' has no heatOfExplosionKjKg.`);
	if (!args.barrelLengthMm || args.barrelLengthMm <= 0) return prepFailure("missingBarrelLength", "No barrel length supplied.");
	const coalMm = args.coalMm && args.coalMm > model.coal_absent_at_or_below_mm ? args.coalMm : cartridge.oalMm;
	if (!coalMm || coalMm <= 0) return prepFailure("missingCoal", `No cartridge overall length for '${cartridgeName}' (load coalMm or cartridge oalMm).`);
	const grooveDiameterM = cartridge.bulletDiameterMm * MM_TO_M;
	const boreDiameterM = cartridge.boreDiameterMm * MM_TO_M;
	const boreAreaM2 = QUARTER_PI * .5 * (grooveDiameterM * grooveDiameterM + boreDiameterM * boreDiameterM);
	const chamberVolumeM3 = usableCaseVolumeM3(capacityWaterGrams, clamp(bulletOverallLengthMm - (coalMm - caseLengthMm), 0, bulletOverallLengthMm), grooveDiameterM);
	if (chamberVolumeM3 <= model.chamber_volume_min_m3) return prepFailure("noChamberVolume", `Bullet '${bulletName}' seated to ${coalMm.toFixed(2)} mm leaves no usable case volume in '${cartridgeName}'.`);
	const bulletTravelM = (args.barrelLengthMm - coalMm + bulletOverallLengthMm) * MM_TO_M;
	if (bulletTravelM < model.bullet_travel_min_m) return prepFailure("noTravel", `Barrel length ${args.barrelLengthMm} mm leaves under ${model.bullet_travel_min_m * 1e3} mm of bullet travel for '${cartridgeName}'.`);
	const chargeMassKg = args.chargeGrams * .001;
	if (!(chargeMassKg > 0)) return prepFailure("noCharge", "Powder charge must be greater than zero.");
	if (chargeMassKg / powder.propellantDensityKgM3 > chamberVolumeM3) return prepFailure("chargeExceedsCase", `A ${args.chargeGrams.toFixed(2)} g charge of '${powderName}' cannot fit in '${cartridgeName}' even at solid density.`);
	const burnSurfaceProfile = {
		burnFractionAtSurfacePeak: clamp(powder.burnFractionAtSurfacePeak ?? model.default_burn_fraction_at_surface_peak, model.surface_peak_burn_fraction_min, model.surface_peak_burn_fraction_max),
		surfacePeakGain: Math.max(powder.burnSurfacePeakGain ?? model.default_burn_surface_peak_gain, model.surface_peak_gain_min),
		burnFractionAtSliverStart: clamp(powder.burnFractionAtSliverStart ?? model.default_burn_fraction_at_sliver_start, model.sliver_start_burn_fraction_min, model.sliver_start_burn_fraction_max)
	};
	const freeboreJumpM = model.freebore_jump_m;
	return {
		ok: true,
		input: {
			boreAreaM2,
			chamberVolumeM3,
			bulletTravelM,
			boreDiameterM,
			chargeMassKg,
			bulletMassKg: bullet.weightGrams * .001,
			propellantSolidDensityKgPerM3: powder.propellantDensityKgM3,
			propellantImpetusJPerKg: (model.specific_heat_ratio - 1) * powder.heatOfExplosionKjKg * 1e3,
			burnRateExponent: powder.burnExponent ?? model.default_burn_exponent,
			burnSurfaceProfile,
			engravingPressurePa: bullet.engravingPressurePa != null && bullet.engravingPressurePa > 0 ? bullet.engravingPressurePa : model.default_engraving_pressure_pa,
			boreFrictionMultiplier: boreFrictionMultiplier(bullet.bearingSurfaceMm, bulletOverallLengthMm, model),
			freeboreJumpM,
			propellantBulkDensityKgPerM3: powder.bulkDensityKgM3,
			ignitionDeficitCoefficient: ignitionDeficitFor(powder.grainType, model),
			burnRateCoefficient: 0
		},
		derived: {
			fillFraction: loadingDensity(chargeMassKg, chamberVolumeM3, powder.bulkDensityKgM3),
			bulletBaseOffsetMm: coalMm - bulletOverallLengthMm
		}
	};
}

function calibrationUrl() {
	return `/tuning-db.json`;
}
var cachedCalibration = null;
function loadCalibration() {
	if (cachedCalibration) return cachedCalibration;
	const url = calibrationUrl();
	cachedCalibration = fetch(url).then((response) => {
		if (!response.ok) throw new Error(`Failed to load the calibration data from ${url} (HTTP ${response.status}).`);
		return response.json();
	}).then((calibration) => {
		assertModelConstants(calibration.model);
		return calibration;
	}).catch((error) => {
		cachedCalibration = null;
		throw error;
	});
	return cachedCalibration;
}
function pairKey(firstId, secondId) {
	return `${firstId}|${secondId}`;
}
function inputLoadingDensity(input) {
	return loadingDensity(input.chargeMassKg, input.chamberVolumeM3, input.propellantBulkDensityKgPerM3);
}
function effectiveBurnRateCoefficient(powder, loadingDensityFraction, boreDiameterMm, model) {
	const adjustment = 1 + powder.fill_slope * (loadingDensityFraction - model.reference_loading_density) + powder.bore_slope * (boreDiameterMm - model.reference_bore_diameter_mm);
	return powder.burn_coeff * clamp(adjustment, model.burn_rate_adjustment_min, model.burn_rate_adjustment_max);
}
function applyPowderCalibration(calibration, input, powderId, baseBurnRateCoefficientOverride) {
	const calibrated = calibration.powders[powderId];
	if (!calibrated) return null;
	if (!Number.isFinite(calibrated.form_gain) || !Number.isFinite(calibrated.form_zpeak)) throw new Error(`The calibration data is out of date: powder ${powderId} has no burn-surface profile.`);
	if (!Number.isFinite(calibrated.burn_exp)) throw new Error(`The calibration data is out of date: powder ${powderId} has no burn-rate exponent.`);
	const powder = baseBurnRateCoefficientOverride != null && baseBurnRateCoefficientOverride > 0 ? {
		...calibrated,
		burn_coeff: baseBurnRateCoefficientOverride
	} : calibrated;
	return {
		...input,
		burnRateCoefficient: effectiveBurnRateCoefficient(powder, inputLoadingDensity(input), input.boreDiameterM * 1e3, calibration.model),
		propellantImpetusJPerKg: powder.impetus,
		burnRateExponent: powder.burn_exp,
		burnSurfaceProfile: {
			...input.burnSurfaceProfile,
			surfacePeakGain: powder.form_gain,
			burnFractionAtSurfacePeak: powder.form_zpeak
		}
	};
}
function velocityFactor(calibration, ids, loadingDensityFraction) {
	const pairId = pairKey(ids.cartridgeId, ids.powderId);
	const chargeSlope = calibration.pair_slopes[pairId] ?? 0;
	return (calibration.cartridges[ids.cartridgeId]?.v_factor ?? 1) * (calibration.pairs[pairId] ?? 1) * Math.exp(chargeSlope * (loadingDensityFraction - calibration.model.reference_loading_density)) * (calibration.bullets_v[ids.bulletId] ?? 1) * (calibration.cart_bullet[pairKey(ids.cartridgeId, ids.bulletId)] ?? 1);
}
function pressureFactor(calibration, ids, loadingDensityFraction) {
	const pairId = pairKey(ids.cartridgeId, ids.powderId);
	const cartridgeScale = calibration.cartridges[ids.cartridgeId]?.p_scale ?? 1;
	const powderFactor = calibration.powder_press[ids.powderId] ?? 1;
	const bulletFactor = calibration.bullets[ids.bulletId] ?? 1;
	const pairFactor = calibration.press_pairs[pairId] ?? 1;
	const cartridgeBulletFactor = calibration.press_cart_bullet[pairKey(ids.cartridgeId, ids.bulletId)] ?? 1;
	const pairSlope = calibration.press_pair_slopes[pairId] ?? calibration.press_powder_slopes[ids.powderId] ?? 0;
	return cartridgeScale * powderFactor * bulletFactor * pairFactor * cartridgeBulletFactor * Math.exp((calibration.press_ramp + pairSlope) * (loadingDensityFraction - calibration.model.reference_loading_density));
}

function simulationFailure(reason, model) {
	return {
		ok: false,
		reason,
		message: reason === "squib" ? "Squib: the charge burned out before the bullet started moving." : reason === "overpressure" ? `Overpressure: peak pressure exceeded ${model.overpressure_limit_pa / 1e9} GPa, so the inputs are unphysical.` : `The bullet had not left the barrel after ${model.max_simulation_time_s * 1e3} ms.`
	};
}
function meanPressurePa(input, model, burnFractionRaw, travelM, velocityMps, energyLostJ) {
	const burnFraction = Math.min(burnFractionRaw, 1);
	const gasEnergyJ = input.propellantImpetusJPerKg * burnFraction * input.chargeMassKg - (model.specific_heat_ratio - 1) * (.5 * input.bulletMassKg * velocityMps * velocityMps + input.chargeMassKg * velocityMps * velocityMps / 6 + energyLostJ);
	const gasVolumeM3 = input.chamberVolumeM3 + input.boreAreaM2 * travelM - (1 - burnFraction) * input.chargeMassKg / input.propellantSolidDensityKgPerM3 - burnFraction * input.chargeMassKg * model.gas_covolume_m3_per_kg;
	return Math.max(gasEnergyJ / Math.max(gasVolumeM3, 1e-9), 0);
}
function runSimulation(input, model, options = {}) {
	const wantTrace = options.trace === true;
	const { chargeMassKg, bulletMassKg, boreAreaM2, chamberVolumeM3, propellantSolidDensityKgPerM3, bulletTravelM, boreDiameterM, freeboreJumpM, engravingPressurePa, burnRateExponent, propellantImpetusJPerKg } = input;
	const { reference_pressure_pa: referencePressurePa, engraving_decay_length_m: engravingDecayLengthM, barrel_heat_loss_coefficient: barrelHeatLossCoefficient, gas_covolume_m3_per_kg: gasCovolumeM3PerKg, time_step_s: timeStepS, max_simulation_time_s: maxSimulationTimeS, overpressure_limit_pa: overpressureLimitPa, trace_sample_stride: traceSampleStride } = model;
	const specificHeatRatioMinusOne = model.specific_heat_ratio - 1;
	const lagrangeDivisor = 1 + chargeMassKg / (3 * bulletMassKg);
	const breechToMeanPressureRatio = (1 + chargeMassKg / (2 * bulletMassKg)) / lagrangeDivisor;
	const boreFrictionPa = model.bore_friction_pressure_pa * input.boreFrictionMultiplier;
	const boreCircumferenceM = Math.PI * boreDiameterM;
	const freeboreResistancePa = Math.max(model.neck_tension_pressure_pa, boreFrictionPa);
	const shotStartGatePa = freeboreJumpM > model.freebore_jump_threshold_m ? freeboreResistancePa : engravingPressurePa;
	const profilePeakBurnFraction = input.burnSurfaceProfile.burnFractionAtSurfacePeak;
	const profileGain = input.burnSurfaceProfile.surfacePeakGain;
	const profileSliverBurnFraction = input.burnSurfaceProfile.burnFractionAtSliverStart;
	const profilePeakSurface = 1 + profileGain;
	const profileSliverSpan = Math.max(1 - profileSliverBurnFraction, 1e-6);
	let ignitionFactor = 1;
	if (input.ignitionDeficitCoefficient > 0) {
		const loadingDensityFraction = loadingDensity(chargeMassKg, chamberVolumeM3, input.propellantBulkDensityKgPerM3);
		const fillDeficit = Math.max(1 - loadingDensityFraction, 0);
		ignitionFactor = clamp(1 - input.ignitionDeficitCoefficient * fillDeficit * fillDeficit, model.ignition_factor_min, 1);
	}
	const ignitionAdjustedBurnRateCoefficient = input.burnRateCoefficient * ignitionFactor;
	const halfStepS = .5 * timeStepS;
	const sixthStepS = timeStepS / 6;
	let burnFraction = model.initial_burn_fraction;
	let travelM = 0;
	let velocityMps = 0;
	let energyLostJ = 0;
	const trace = [];
	const travelSamples = [];
	const travelSampleSpacingM = options.travelSampleSpacingM ?? 0;
	const travelSampleOffsetM = options.travelSampleOffsetM ?? 0;
	let nextTravelSampleM = travelSampleSpacingM > 0 ? (Math.floor(travelSampleOffsetM / travelSampleSpacingM) + 1) * travelSampleSpacingM - travelSampleOffsetM : 0;
	let timeS = 0;
	let peakMeanPressurePa = 0;
	let bulletMoving = false;
	let stepIndex = 0;
	while (timeS < maxSimulationTimeS) {
		const gasBurnFraction = Math.min(burnFraction, 1);
		const gasEnergyJ = propellantImpetusJPerKg * gasBurnFraction * chargeMassKg - specificHeatRatioMinusOne * (.5 * bulletMassKg * velocityMps * velocityMps + chargeMassKg * velocityMps * velocityMps / 6 + energyLostJ);
		const gasVolumeM3 = chamberVolumeM3 + boreAreaM2 * travelM - (1 - gasBurnFraction) * chargeMassKg / propellantSolidDensityKgPerM3 - gasBurnFraction * chargeMassKg * gasCovolumeM3PerKg;
		const pressurePa = Math.max(gasEnergyJ / Math.max(gasVolumeM3, 1e-9), 0);
		if (pressurePa > peakMeanPressurePa) peakMeanPressurePa = pressurePa;
		if (wantTrace && stepIndex % traceSampleStride === 0) trace.push({
			timeS,
			travelM,
			velocityMps,
			meanPressurePa: pressurePa,
			burnFraction
		});
		if (!bulletMoving) {
			if (pressurePa / lagrangeDivisor >= shotStartGatePa) bulletMoving = true;
			else if (burnFraction >= 1) return simulationFailure("squib", model);
		}
		const previousTravelM = travelM;
		const previousVelocityMps = velocityMps;
		const previousTimeS = timeS;
		let stageBurnFraction = burnFraction;
		let stageTravelM = travelM;
		let stageVelocityMps = velocityMps;
		let stagePressurePa = pressurePa;
		let burnFractionRateSum = 0;
		let travelRateSumMps = 0;
		let accelerationSumMps2 = 0;
		let energyLossRateSumW = 0;
		for (let stage = 1; stage <= 4; stage += 1) {
			let burnFractionRate = 0;
			if (stageBurnFraction < 1) burnFractionRate = ignitionAdjustedBurnRateCoefficient * (stageBurnFraction < profilePeakBurnFraction ? 1 + profileGain * (stageBurnFraction / profilePeakBurnFraction) : stageBurnFraction < profileSliverBurnFraction ? profilePeakSurface : profilePeakSurface * (1 - stageBurnFraction) / profileSliverSpan) * Math.pow(stagePressurePa / referencePressurePa, burnRateExponent);
			let travelRateMps = 0;
			let accelerationMps2 = 0;
			let energyLossRateW = 0;
			if (bulletMoving) {
				const resistancePressurePa = stageTravelM < freeboreJumpM ? freeboreResistancePa : boreFrictionPa + (engravingPressurePa - boreFrictionPa) * Math.exp(-(stageTravelM - freeboreJumpM) / engravingDecayLengthM);
				travelRateMps = stageVelocityMps;
				accelerationMps2 = Math.max(boreAreaM2 * (stagePressurePa / lagrangeDivisor - resistancePressurePa) / bulletMassKg, 0);
				energyLossRateW = boreAreaM2 * resistancePressurePa * stageVelocityMps + barrelHeatLossCoefficient * (boreCircumferenceM * stageTravelM) * Math.sqrt(stagePressurePa) * stageVelocityMps;
			}
			if (stage === 1) {
				burnFractionRateSum = burnFractionRate;
				travelRateSumMps = travelRateMps;
				accelerationSumMps2 = accelerationMps2;
				energyLossRateSumW = energyLossRateW;
			} else if (stage < 4) {
				burnFractionRateSum += 2 * burnFractionRate;
				travelRateSumMps += 2 * travelRateMps;
				accelerationSumMps2 += 2 * accelerationMps2;
				energyLossRateSumW += 2 * energyLossRateW;
			} else {
				burnFractionRateSum += burnFractionRate;
				travelRateSumMps += travelRateMps;
				accelerationSumMps2 += accelerationMps2;
				energyLossRateSumW += energyLossRateW;
			}
			if (stage < 4) {
				const stageStepS = stage < 3 ? halfStepS : timeStepS;
				stageBurnFraction = burnFraction + stageStepS * burnFractionRate;
				stageTravelM = travelM + stageStepS * travelRateMps;
				stageVelocityMps = velocityMps + stageStepS * accelerationMps2;
				const stageEnergyLostJ = energyLostJ + stageStepS * energyLossRateW;
				const stageGasBurnFraction = Math.min(stageBurnFraction, 1);
				const stageGasEnergyJ = propellantImpetusJPerKg * stageGasBurnFraction * chargeMassKg - specificHeatRatioMinusOne * (.5 * bulletMassKg * stageVelocityMps * stageVelocityMps + chargeMassKg * stageVelocityMps * stageVelocityMps / 6 + stageEnergyLostJ);
				const stageGasVolumeM3 = chamberVolumeM3 + boreAreaM2 * stageTravelM - (1 - stageGasBurnFraction) * chargeMassKg / propellantSolidDensityKgPerM3 - stageGasBurnFraction * chargeMassKg * gasCovolumeM3PerKg;
				stagePressurePa = Math.max(stageGasEnergyJ / Math.max(stageGasVolumeM3, 1e-9), 0);
			}
		}
		burnFraction = Math.min(burnFraction + sixthStepS * burnFractionRateSum, 1);
		travelM += sixthStepS * travelRateSumMps;
		velocityMps += sixthStepS * accelerationSumMps2;
		energyLostJ += sixthStepS * energyLossRateSumW;
		timeS += timeStepS;
		stepIndex += 1;
		while (travelSampleSpacingM > 0 && travelM >= nextTravelSampleM && nextTravelSampleM <= bulletTravelM) {
			const crossingFraction = travelM > previousTravelM ? (nextTravelSampleM - previousTravelM) / (travelM - previousTravelM) : 1;
			const velocityAtSampleMps = previousVelocityMps + (velocityMps - previousVelocityMps) * crossingFraction;
			travelSamples.push({
				timeS: previousTimeS + (timeS - previousTimeS) * crossingFraction,
				travelM: nextTravelSampleM,
				velocityMps: velocityAtSampleMps,
				meanPressurePa: meanPressurePa(input, model, burnFraction, nextTravelSampleM, velocityAtSampleMps, energyLostJ),
				burnFraction
			});
			nextTravelSampleM += travelSampleSpacingM;
		}
		if (travelM >= bulletTravelM) {
			const crossingFraction = travelM > previousTravelM ? (bulletTravelM - previousTravelM) / (travelM - previousTravelM) : 1;
			const exitVelocityMps = previousVelocityMps + (velocityMps - previousVelocityMps) * crossingFraction;
			const exitTimeS = previousTimeS + (timeS - previousTimeS) * crossingFraction;
			const exitPoint = {
				timeS: exitTimeS,
				travelM: bulletTravelM,
				velocityMps: exitVelocityMps,
				meanPressurePa: meanPressurePa(input, model, burnFraction, bulletTravelM, exitVelocityMps, energyLostJ),
				burnFraction
			};
			if (wantTrace) trace.push(exitPoint);
			if (travelSampleSpacingM > 0) {
				const lastSample = travelSamples[travelSamples.length - 1];
				if (!lastSample || bulletTravelM - lastSample.travelM > 1e-6) travelSamples.push(exitPoint);
				else travelSamples[travelSamples.length - 1] = exitPoint;
			}
			return {
				ok: true,
				muzzleVelocityMps: exitVelocityMps,
				peakPressurePa: peakMeanPressurePa * breechToMeanPressureRatio,
				burnFractionAtExit: burnFraction,
				exitTimeS,
				trace,
				travelSamples
			};
		}
		if (peakMeanPressurePa > overpressureLimitPa) return simulationFailure("overpressure", model);
	}
	return simulationFailure("noExit", model);
}

function calibrationId(record) {
	return record.derivedFrom ?? record.id;
}
function loadIds(args) {
	return {
		cartridgeId: calibrationId(args.cartridge),
		powderId: calibrationId(args.powder),
		bulletId: calibrationId(args.bullet)
	};
}
function simulateLoadWithCalibration(calibration, args) {
	const ids = loadIds(args);
	const model = calibration.model;
	const prepared = buildSimInput(args, model);
	if (!prepared.ok) return {
		ok: false,
		stage: "prepare",
		code: prepared.code,
		message: prepared.message
	};
	if (prepared.derived.fillFraction < model.calibrated_fill_min) return {
		ok: false,
		stage: "regime",
		code: "outsideCalibratedRegime",
		message: `Loading density ${(prepared.derived.fillFraction * 100).toFixed(0)}% is below the ${(model.calibrated_fill_min * 100).toFixed(0)}% the model is calibrated down to. Reduced loads are outside the calibration and the correction is not valid there.`
	};
	if (prepared.derived.fillFraction > model.calibrated_fill_max) return {
		ok: false,
		stage: "regime",
		code: "outsideCalibratedRegime",
		message: `Loading density ${(prepared.derived.fillFraction * 100).toFixed(0)}% is above the ${(model.calibrated_fill_max * 100).toFixed(0)}% the model is calibrated up to. No powder compresses that far; check the case capacity, the seating depth and the charge.`
	};
	const calibrated = applyPowderCalibration(calibration, prepared.input, ids.powderId, args.burnRateCoefficientOverride);
	if (!calibrated) return {
		ok: false,
		stage: "tuning",
		code: "uncalibratedPowder",
		message: `Powder '${args.powder.name || ids.powderId}' has no calibration data, so no burn-rate coefficient exists for it.`
	};
	const simOptions = {
		trace: args.trace,
		travelSampleSpacingM: args.travelSampleSpacingM,
		travelSampleOffsetM: args.travelSamplesByBarrelPosition ? prepared.derived.bulletBaseOffsetMm * .001 : void 0
	};
	const simulation = runSimulation(calibrated, model, simOptions);
	if (!simulation.ok) return {
		ok: false,
		stage: "simulate",
		code: simulation.reason,
		message: simulation.message
	};
	const loadingDensityFraction = prepared.derived.fillFraction;
	const velocityCorrection = velocityFactor(calibration, ids, loadingDensityFraction);
	const pressureCorrection = pressureFactor(calibration, ids, loadingDensityFraction);
	return {
		ok: true,
		muzzleVelocityMps: simulation.muzzleVelocityMps * velocityCorrection,
		peakPressurePa: simulation.peakPressurePa * pressureCorrection,
		burnedPct: simulation.burnFractionAtExit * 100,
		timeToExitMs: simulation.exitTimeS * 1e3,
		curve: simulation.trace.map((point) => toCurvePoint(point, velocityCorrection, pressureCorrection)),
		travelSamples: simulation.travelSamples.map((point) => toCurvePoint(point, velocityCorrection, pressureCorrection)),
		derived: prepared.derived
	};
}
function toCurvePoint(point, velocityCorrection, pressureCorrection) {
	return {
		travelMm: point.travelM * 1e3,
		timeMs: point.timeS * 1e3,
		pressurePa: point.meanPressurePa * pressureCorrection,
		velocityMps: point.velocityMps * velocityCorrection,
		burnedPct: point.burnFraction * 100
	};
}
function simulateLoadEnsemble(calibration, args, opts = {}) {
	const model = calibration.model;
	const runs = Math.max(model.ensemble_runs_min, Math.floor(opts.runs ?? model.ensemble_runs));
	const random = mulberry32(opts.seed ?? model.ensemble_seed);
	const point = simulateLoadWithCalibration(calibration, {
		...args,
		trace: false,
		travelSampleSpacingM: void 0
	});
	if (!point.ok) return point;
	const ids = loadIds(args);
	const powderErrorScale = calibration.powders[ids.powderId].train_mape / 100;
	const caseCapacityWaterGrams = args.caseCapacityH2oGrams ?? args.cartridge.baseCapacityH2oGrams ?? 0;
	const velocitiesMps = [];
	const pressuresPa = [];
	let refused = 0;
	for (let memberIndex = 0; memberIndex < runs; memberIndex++) {
		const member = {
			...args,
			trace: false,
			travelSampleSpacingM: void 0,
			caseCapacityH2oGrams: caseCapacityWaterGrams > 0 ? caseCapacityWaterGrams * Math.exp(model.ensemble_case_capacity_sigma * standardNormal(random)) : args.caseCapacityH2oGrams,
			chargeGrams: Math.max(args.chargeGrams + model.ensemble_charge_sigma_g * standardNormal(random), 1e-6)
		};
		const prepared = buildSimInput(member, model);
		if (!prepared.ok) {
			refused++;
			continue;
		}
		const calibrated = applyPowderCalibration(calibration, prepared.input, ids.powderId, args.burnRateCoefficientOverride);
		if (!calibrated) {
			refused++;
			continue;
		}
		const perturbed = {
			...calibrated,
			propellantImpetusJPerKg: calibrated.propellantImpetusJPerKg * Math.exp(model.ensemble_impetus_sigma_scale * powderErrorScale * standardNormal(random)),
			burnRateCoefficient: calibrated.burnRateCoefficient * Math.exp(powderErrorScale * standardNormal(random))
		};
		const simulation = runSimulation(perturbed, model);
		if (!simulation.ok) {
			refused++;
			continue;
		}
		const loadingDensityFraction = prepared.derived.fillFraction;
		velocitiesMps.push(simulation.muzzleVelocityMps * velocityFactor(calibration, ids, loadingDensityFraction));
		pressuresPa.push(simulation.peakPressurePa * pressureFactor(calibration, ids, loadingDensityFraction));
	}
	if (velocitiesMps.length < runs * model.ensemble_surviving_fraction_min) return {
		ok: false,
		stage: "simulate",
		code: "ensembleUnstable",
		message: `Only ${velocitiesMps.length} of ${runs} ensemble members ran; the load does not survive small input changes.`
	};
	return {
		ok: true,
		point,
		muzzleVelocityMps: percentileBand(velocitiesMps),
		peakPressurePa: percentileBand(pressuresPa),
		runs: velocitiesMps.length,
		refused
	};
}
function percentileBand(values) {
	const sorted = [...values].sort((first, second) => first - second);
	const valueAt = (quantile) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(quantile * (sorted.length - 1))))];
	return {
		p10: valueAt(.1),
		p50: valueAt(.5),
		p90: valueAt(.9)
	};
}
function mulberry32(seed) {
	let state = seed >>> 0;
	return () => {
		state = state + 1831565813 >>> 0;
		let mixed = state;
		mixed = Math.imul(mixed ^ mixed >>> 15, mixed | 1);
		mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61);
		return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
	};
}
function standardNormal(random) {
	const uniformOne = Math.max(random(), 1e-12);
	const uniformTwo = random();
	return Math.sqrt(-2 * Math.log(uniformOne)) * Math.cos(2 * Math.PI * uniformTwo);
}

export { WATER_GRAMS_TO_M3 as a, chargeKgAtLoadingDensity as c, loadCalibration as i, loadingDensity as l, simulateLoadEnsemble as n, resolveDiameters as o, simulateLoadWithCalibration as r, usableCaseVolumeM3 as s, calibrationId as t };