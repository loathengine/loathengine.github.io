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
	"burn_exponent",
	"bore_friction_pressure_pa",
	"engraving_decay_length_m",
	"initial_burn_fraction",
	"barrel_heat_loss_coefficient",
	"gas_covolume_m3_per_kg",
	"neck_tension_pressure_pa",
	"freebore_jump_threshold_m",
	"reference_bearing_length_m",
	"reference_bearing_caliber_m",
	"reference_bearing_caliber_exponent",
	"tip_base_insert_mm",
	"boat_tail_frustum_void_fraction",
	"ogive_void_fraction",
	"bore_friction_multiplier_min",
	"bore_friction_multiplier_max",
	"freebore_jump_m",
	"bore_friction_bearing_exponent",
	"bore_friction_ref_velocity_mps",
	"bore_friction_velocity_floor_mps",
	"bore_friction_velocity_exponent",
	"bore_friction_velocity_scale_min",
	"bore_friction_velocity_scale_max",
	"heat_loss_ref_velocity_mps",
	"heat_loss_velocity_exponent",
	"pressure_damping_floor_pa",
	"pressure_damping_ref_pa",
	"pressure_damping_slope",
	"pressure_damping_min",
	"pressure_damping_max",
	"impetus_fill_delta_min",
	"impetus_fill_slope",
	"impetus_fill_scale_min",
	"impetus_fill_scale_max",
	"progressivity_offset_extruded",
	"progressivity_offset_ball",
	"progressivity_offset_multi_perf",
	"sliver_tail_exponent_extruded",
	"sliver_tail_exponent_ball",
	"sliver_tail_exponent_multi_perf",
	"progressivity_sd_scale",
	"reference_areal_density_kg_per_m2",
	"areal_density_ratio_min",
	"areal_density_ratio_max",
	"progressivity_fill_slope",
	"progressivity_shift_min",
	"progressivity_shift_max",
	"initial_surface_min",
	"initial_surface_prog_scale",
	"peak_surface_min",
	"peak_surface_prog_scale",
	"ignition_deficit_ball",
	"ignition_deficit_multi_perf",
	"ignition_deficit_multi_perf_offset",
	"ignition_deficit_extruded",
	"ignition_deficit_fill_threshold",
	"ignition_deficit_scale",
	"ignition_factor_min",
	"time_step_s",
	"max_simulation_time_s",
	"overpressure_limit_pa",
	"trace_sample_stride",
	"reference_loading_density",
	"pair_charge_slope_extra",
	"reference_bore_diameter_mm",
	"burn_rate_adjustment_min",
	"burn_rate_adjustment_max",
	"calibrated_fill_min",
	"calibrated_fill_max",
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
var CalibrationVersionError = class extends Error {
	newer;
	constructor(message, newer) {
		super(message);
		this.name = "CalibrationVersionError";
		this.newer = newer;
	}
};
var POSITIVE_MODEL_KEYS = [
	"reference_pressure_pa",
	"burn_exponent",
	"engraving_decay_length_m",
	"reference_bearing_length_m",
	"reference_bearing_caliber_m",
	"bore_friction_multiplier_min",
	"bore_friction_multiplier_max",
	"bore_friction_ref_velocity_mps",
	"bore_friction_velocity_floor_mps",
	"bore_friction_velocity_scale_min",
	"bore_friction_velocity_scale_max",
	"heat_loss_ref_velocity_mps",
	"pressure_damping_floor_pa",
	"pressure_damping_ref_pa",
	"pressure_damping_min",
	"pressure_damping_max",
	"impetus_fill_scale_min",
	"impetus_fill_scale_max",
	"sliver_tail_exponent_extruded",
	"sliver_tail_exponent_ball",
	"sliver_tail_exponent_multi_perf",
	"reference_areal_density_kg_per_m2",
	"areal_density_ratio_min",
	"areal_density_ratio_max",
	"initial_surface_min",
	"peak_surface_min",
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
	"default_engraving_pressure_pa",
	"default_bearing_surface_fraction",
	"surface_peak_burn_fraction_min",
	"surface_peak_burn_fraction_max",
	"sliver_start_burn_fraction_min",
	"sliver_start_burn_fraction_max",
	"chamber_volume_min_m3",
	"bullet_travel_min_m",
	"ensemble_runs",
	"ensemble_runs_min",
	"ensemble_surviving_fraction_min"
];
var NON_NEGATIVE_MODEL_KEYS = [
	"bore_friction_pressure_pa",
	"initial_burn_fraction",
	"barrel_heat_loss_coefficient",
	"gas_covolume_m3_per_kg",
	"neck_tension_pressure_pa",
	"freebore_jump_threshold_m",
	"freebore_jump_m",
	"ensemble_case_capacity_sigma",
	"ensemble_charge_sigma_g",
	"ensemble_impetus_sigma_scale"
];
var ORDERED_MODEL_BOUNDS = [
	["bore_friction_multiplier_min", "bore_friction_multiplier_max"],
	["bore_friction_velocity_scale_min", "bore_friction_velocity_scale_max"],
	["pressure_damping_min", "pressure_damping_max"],
	["impetus_fill_scale_min", "impetus_fill_scale_max"],
	["areal_density_ratio_min", "areal_density_ratio_max"],
	["progressivity_shift_min", "progressivity_shift_max"],
	["burn_rate_adjustment_min", "burn_rate_adjustment_max"],
	["surface_peak_burn_fraction_min", "surface_peak_burn_fraction_max"],
	["sliver_start_burn_fraction_min", "sliver_start_burn_fraction_max"]
];
function assertModelConstants(model) {
	if (model == null || typeof model !== "object") throw new CalibrationVersionError("The calibration data is out of date: it has no model constants.", false);
	const record = model;
	for (const key of MODEL_CONSTANT_KEYS) if (typeof record[key] !== "number" || !Number.isFinite(record[key])) throw new CalibrationVersionError(`The calibration data is out of date: model constant ${key} is missing or not a number. It is older than this version of the app; reload the page to fetch the matching one.`, false);
	const known = new Set(MODEL_CONSTANT_KEYS);
	const unknown = Object.keys(record).filter((key) => !known.has(key));
	if (unknown.length > 0) throw new CalibrationVersionError(`The calibration data carries model constants this engine does not know: ${unknown.join(", ")}. It is newer than this version of the app; reload the page to update the app.`, true);
	const m = model;
	for (const key of POSITIVE_MODEL_KEYS) if (m[key] <= 0) throw new Error(`Invalid model constant ${key}: expected > 0, got ${m[key]}.`);
	for (const key of NON_NEGATIVE_MODEL_KEYS) if (m[key] < 0) throw new Error(`Invalid model constant ${key}: expected >= 0, got ${m[key]}.`);
	for (const [loKey, hiKey] of ORDERED_MODEL_BOUNDS) if (m[loKey] > m[hiKey]) throw new Error(`Invalid model constants: ${loKey} (${m[loKey]}) exceeds ${hiKey} (${m[hiKey]}).`);
	if (m.specific_heat_ratio <= 1) throw new Error(`Invalid model constant specific_heat_ratio: expected > 1, got ${m.specific_heat_ratio}.`);
	if (m.initial_burn_fraction >= 1) throw new Error(`Invalid model constant initial_burn_fraction: expected in [0, 1), got ${m.initial_burn_fraction}.`);
	if (m.ignition_factor_min > 1) throw new Error(`Invalid model constant ignition_factor_min: expected in (0, 1], got ${m.ignition_factor_min}.`);
	if (!Number.isInteger(m.trace_sample_stride)) throw new Error(`Invalid model constant trace_sample_stride: expected a positive integer, got ${m.trace_sample_stride}.`);
	if (m.calibrated_fill_min >= m.calibrated_fill_max) throw new Error(`Invalid model constants: calibrated_fill_min (${m.calibrated_fill_min}) must be below calibrated_fill_max (${m.calibrated_fill_max}).`);
	if (m.surface_peak_burn_fraction_max >= 1) throw new Error(`Invalid model constant surface_peak_burn_fraction_max: expected < 1, got ${m.surface_peak_burn_fraction_max}.`);
	if (m.sliver_start_burn_fraction_max > 1) throw new Error(`Invalid model constant sliver_start_burn_fraction_max: expected <= 1, got ${m.sliver_start_burn_fraction_max}.`);
	if (m.ensemble_runs < 1 || m.ensemble_runs_min < 1) throw new Error(`Invalid model constants: ensemble_runs (${m.ensemble_runs}) and ensemble_runs_min (${m.ensemble_runs_min}) must be >= 1.`);
	if (m.ensemble_surviving_fraction_min > 1) throw new Error(`Invalid model constant ensemble_surviving_fraction_min: expected in (0, 1], got ${m.ensemble_surviving_fraction_min}.`);
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
var isPositiveFinite = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
function resolveDiameters(cartridge, diameters) {
	const calibre = cartridge.diameterId ? diameters?.get(cartridge.diameterId) : void 0;
	return {
		bulletDiameterMm: calibre?.bulletDiameterMm,
		boreDiameterMm: calibre?.boreDiameterMm
	};
}
function recordBurnSurfaceProfile(powder, model) {
	const peak = typeof powder.burnFractionAtSurfacePeak === "number" && Number.isFinite(powder.burnFractionAtSurfacePeak) ? powder.burnFractionAtSurfacePeak : model.default_burn_fraction_at_surface_peak;
	const gain = typeof powder.burnSurfacePeakGain === "number" && Number.isFinite(powder.burnSurfacePeakGain) ? powder.burnSurfacePeakGain : model.default_burn_surface_peak_gain;
	const sliver = typeof powder.burnFractionAtSliverStart === "number" && Number.isFinite(powder.burnFractionAtSliverStart) ? powder.burnFractionAtSliverStart : model.default_burn_fraction_at_sliver_start;
	return {
		burnFractionAtSurfacePeak: clamp(peak, model.surface_peak_burn_fraction_min, model.surface_peak_burn_fraction_max),
		surfacePeakGain: Math.max(gain, model.surface_peak_gain_min),
		burnFractionAtSliverStart: clamp(sliver, model.sliver_start_burn_fraction_min, model.sliver_start_burn_fraction_max)
	};
}
function seatingCaseLengthMm(cartridge) {
	if (isPositiveFinite(cartridge.maxCaseLengthMm)) return cartridge.maxCaseLengthMm;
	if (isPositiveFinite(cartridge.trimLengthMm)) return cartridge.trimLengthMm;
}
function seatedCoalMm(coalMm, cartridgeOalMm, model) {
	return isPositiveFinite(coalMm) && coalMm > model.coal_absent_at_or_below_mm ? coalMm : cartridgeOalMm;
}
function bulletSeatingDepthMm(bulletOverallLengthMm, coalMm, caseLengthMm) {
	return clamp(bulletOverallLengthMm - (coalMm - caseLengthMm), 0, bulletOverallLengthMm);
}
function cylindricalNeckGripMm(seatingDepthMm, boatTailLengthMm, bearingSurfaceMm) {
	const bt = isPositiveFinite(boatTailLengthMm) ? boatTailLengthMm : 0;
	const raw = Math.max(0, seatingDepthMm - bt);
	return isPositiveFinite(bearingSurfaceMm) ? Math.min(raw, bearingSurfaceMm) : raw;
}
function oneCaliberGripCoalMm(args) {
	const { caseLengthMm, bulletOverallLengthMm, bulletDiameterMm, boatTailLengthMm, bearingSurfaceMm } = args;
	if (!isPositiveFinite(caseLengthMm) || !isPositiveFinite(bulletOverallLengthMm) || !isPositiveFinite(bulletDiameterMm)) return null;
	const bt = isPositiveFinite(boatTailLengthMm) ? boatTailLengthMm : 0;
	const targetGrip = isPositiveFinite(bearingSurfaceMm) ? Math.min(bulletDiameterMm, bearingSurfaceMm) : bulletDiameterMm;
	const idealSeatingDepth = Math.min(bulletOverallLengthMm, bt + targetGrip);
	return caseLengthMm + bulletOverallLengthMm - idealSeatingDepth;
}
function sameCaliberDerivedFrom(cartridge, cartridgesById) {
	if (!cartridge.derivedFrom) return void 0;
	const parent = cartridgesById?.get(cartridge.derivedFrom);
	if (parent && parent.diameterId && cartridge.diameterId && parent.diameterId !== cartridge.diameterId) return;
	return cartridge.derivedFrom;
}
function parentCartridgeIdOf(cartridge) {
	return cartridge?.parentCartridgeId || cartridge?.derivedFrom;
}
function estimateNeckedWaterCapacityGrams(parentCapacityH2oGrams, parentBulletDiameterMm, newBulletDiameterMm) {
	const neckLengthMm = 1.1 * parentBulletDiameterMm;
	const deltaWaterGrams = QUARTER_PI * (newBulletDiameterMm * newBulletDiameterMm - parentBulletDiameterMm * parentBulletDiameterMm) * neckLengthMm * 1e-9 / WATER_GRAMS_TO_M3;
	return Math.max(.1, parentCapacityH2oGrams + deltaWaterGrams);
}
function prepFailure(code, message) {
	return {
		ok: false,
		code,
		message
	};
}
function boreFrictionMultiplier(bearingSurfaceMm, overallLengthMm, boreDiameterM, model, tipLengthMm) {
	let resolvedBearingMm = isPositiveFinite(bearingSurfaceMm) ? bearingSurfaceMm : null;
	if (resolvedBearingMm == null) {
		const tipDeductionMm = isPositiveFinite(tipLengthMm) ? Math.max(0, tipLengthMm - model.tip_base_insert_mm) : 0;
		const effectiveLengthMm = Math.max(overallLengthMm - tipDeductionMm, .5 * overallLengthMm);
		resolvedBearingMm = model.default_bearing_surface_fraction * effectiveLengthMm;
	}
	const bearingRatio = resolvedBearingMm * MM_TO_M / (model.reference_bearing_length_m * Math.pow(boreDiameterM / model.reference_bearing_caliber_m, model.reference_bearing_caliber_exponent));
	const effectiveBearingExponent = model.bore_friction_bearing_exponent;
	return clamp(effectiveBearingExponent === 1 ? bearingRatio : Math.pow(bearingRatio, effectiveBearingExponent), model.bore_friction_multiplier_min, model.bore_friction_multiplier_max);
}
function usableCaseVolumeM3(capacityWaterGrams, seatingDepthMm, grooveDiameterM, model, boatTailLengthMm, bearingSurfaceMm) {
	let effectiveSeatedLengthMm = seatingDepthMm;
	if (seatingDepthMm > 0) {
		const btMm = isPositiveFinite(boatTailLengthMm) ? boatTailLengthMm : 0;
		effectiveSeatedLengthMm -= model.boat_tail_frustum_void_fraction * Math.min(seatingDepthMm, btMm);
		if (isPositiveFinite(bearingSurfaceMm)) {
			const bodyEndMm = btMm + bearingSurfaceMm;
			if (seatingDepthMm > bodyEndMm) effectiveSeatedLengthMm -= model.ogive_void_fraction * (seatingDepthMm - bodyEndMm);
		}
	}
	const seatedBulletVolumeM3 = effectiveSeatedLengthMm * MM_TO_M * QUARTER_PI * grooveDiameterM * grooveDiameterM;
	return capacityWaterGrams * WATER_GRAMS_TO_M3 - seatedBulletVolumeM3;
}
function buildSimInput(args, model) {
	const { cartridge, powder, bullet } = args;
	const cartridgeName = cartridge.name || cartridge.id;
	const bulletName = bullet.name || bullet.id;
	const powderName = powder.name || powder.id;
	const capacityWaterGrams = args.caseCapacityH2oGrams || cartridge.baseCapacityH2oGrams;
	if (!isPositiveFinite(capacityWaterGrams)) return prepFailure("missingCapacity", `Cartridge '${cartridgeName}' has no case capacity (baseCapacityH2oGrams).`);
	if (!isPositiveFinite(cartridge.bulletDiameterMm)) return prepFailure("missingBulletDiameter", `Cartridge '${cartridgeName}' has no bulletDiameterMm.`);
	if (!isPositiveFinite(cartridge.boreDiameterMm)) return prepFailure("missingBoreDiameter", `Cartridge '${cartridgeName}' has no boreDiameterMm.`);
	const caseLengthMm = seatingCaseLengthMm(cartridge);
	if (!isPositiveFinite(caseLengthMm)) return prepFailure("missingCaseLength", `Cartridge '${cartridgeName}' has neither maxCaseLengthMm nor trimLengthMm.`);
	if (!isPositiveFinite(bullet.weightGrams)) return prepFailure("missingBulletWeight", `Bullet '${bulletName}' has no weightGrams.`);
	const bulletOverallLengthMm = bullet.overallLengthMm;
	if (!isPositiveFinite(bulletOverallLengthMm)) return prepFailure("missingBulletLength", `Bullet '${bulletName}' has no overallLengthMm.`);
	if (!isPositiveFinite(powder.propellantDensityKgM3)) return prepFailure("missingPowderDensity", `Powder '${powderName}' has no propellantDensityKgM3.`);
	if (!isPositiveFinite(powder.bulkDensityKgM3)) return prepFailure("missingPowderBulkDensity", `Powder '${powderName}' has no bulkDensityKgM3.`);
	if (!isPositiveFinite(powder.heatOfExplosionKjKg)) return prepFailure("missingPowderEnergy", `Powder '${powderName}' has no heatOfExplosionKjKg.`);
	if (!isPositiveFinite(args.barrelLengthMm)) return prepFailure("missingBarrelLength", "No barrel length supplied.");
	const coalMm = seatedCoalMm(args.coalMm, cartridge.oalMm, model);
	if (!isPositiveFinite(coalMm)) return prepFailure("missingCoal", `No cartridge overall length for '${cartridgeName}' (load coalMm or cartridge oalMm).`);
	const grooveDiameterM = cartridge.bulletDiameterMm * MM_TO_M;
	const boreDiameterM = cartridge.boreDiameterMm * MM_TO_M;
	const boreAreaM2 = QUARTER_PI * .5 * (grooveDiameterM * grooveDiameterM + boreDiameterM * boreDiameterM);
	const seatingDepthMm = bulletSeatingDepthMm(bulletOverallLengthMm, coalMm, caseLengthMm);
	const chamberVolumeM3 = usableCaseVolumeM3(capacityWaterGrams, seatingDepthMm, grooveDiameterM, model, bullet.boatTailLengthMm, bullet.bearingSurfaceMm);
	if (!Number.isFinite(chamberVolumeM3) || chamberVolumeM3 <= model.chamber_volume_min_m3) return prepFailure("noChamberVolume", `Bullet '${bulletName}' seated to ${coalMm.toFixed(2)} mm leaves no usable case volume in '${cartridgeName}'.`);
	const bulletTravelM = (args.barrelLengthMm - coalMm + bulletOverallLengthMm) * MM_TO_M;
	if (!Number.isFinite(bulletTravelM) || bulletTravelM < model.bullet_travel_min_m) return prepFailure("noTravel", `Barrel length ${args.barrelLengthMm} mm leaves under ${model.bullet_travel_min_m * 1e3} mm of bullet travel for '${cartridgeName}'.`);
	const chargeMassKg = args.chargeGrams * .001;
	if (!isPositiveFinite(args.chargeGrams) || !(chargeMassKg > 0)) return prepFailure("noCharge", "Powder charge must be greater than zero.");
	if (chargeMassKg / powder.propellantDensityKgM3 > chamberVolumeM3) return prepFailure("chargeExceedsCase", `A ${args.chargeGrams.toFixed(2)} g charge of '${powderName}' cannot fit in '${cartridgeName}' even at solid density.`);
	const burnSurfaceProfile = recordBurnSurfaceProfile(powder, model);
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
			burnSurfaceProfile,
			engravingPressurePa: isPositiveFinite(bullet.engravingPressurePa) ? bullet.engravingPressurePa : model.default_engraving_pressure_pa,
			boreFrictionMultiplier: boreFrictionMultiplier(bullet.bearingSurfaceMm, bulletOverallLengthMm, boreDiameterM, model, bullet.tipLengthMm),
			freeboreJumpM,
			propellantBulkDensityKgPerM3: powder.bulkDensityKgM3,
			kernelShape: powder.grainType,
			ignitionDeficitCoefficient: ignitionDeficitFor(powder.grainType, model),
			burnRateCoefficient: 0
		},
		derived: {
			fillFraction: loadingDensity(chargeMassKg, chamberVolumeM3, powder.bulkDensityKgM3),
			bulletBaseOffsetMm: coalMm - bulletOverallLengthMm,
			caseCapacityH2oGrams: capacityWaterGrams,
			caseLengthMm,
			coalMm,
			seatingDepthMm,
			usableCapacityH2oGrams: chamberVolumeM3 / WATER_GRAMS_TO_M3,
			bulletTravelMm: args.barrelLengthMm - coalMm + bulletOverallLengthMm
		}
	};
}

function sliverStartBurnFraction(profile) {
	return Math.max(profile.burnFractionAtSliverStart, profile.burnFractionAtSurfacePeak);
}
function simulationFailure(reason, model) {
	return {
		ok: false,
		reason,
		message: reason === "squib" ? "Squib: the charge burned out before the bullet started moving." : reason === "overpressure" ? `Overpressure: peak pressure exceeded ${model.overpressure_limit_pa / 1e9} GPa, so the inputs are unphysical.` : `The bullet had not left the barrel after ${model.max_simulation_time_s * 1e3} ms.`
	};
}
function meanPressurePa(input, model, effectiveImpetusJPerKg, burnFractionRaw, travelM, velocityMps, energyLostJ) {
	const burnFraction = Math.min(burnFractionRaw, 1);
	const v2 = velocityMps * velocityMps;
	const fullBurnEnergyJ = effectiveImpetusJPerKg * input.chargeMassKg;
	const fullBurnCovolumeM3 = input.chargeMassKg * model.gas_covolume_m3_per_kg;
	const invSolidDensity = 1 / input.propellantSolidDensityKgPerM3;
	const chargeOverSix = input.chargeMassKg / 6;
	const gasEnergyJ = (burnFraction === 1 ? fullBurnEnergyJ : fullBurnEnergyJ * burnFraction) - (model.specific_heat_ratio - 1) * (.5 * input.bulletMassKg * v2 + chargeOverSix * v2 + energyLostJ);
	const gasVolumeM3 = burnFraction === 1 ? input.chamberVolumeM3 + input.boreAreaM2 * travelM - fullBurnCovolumeM3 : input.chamberVolumeM3 + input.boreAreaM2 * travelM - (1 - burnFraction) * input.chargeMassKg * invSolidDensity - burnFraction * fullBurnCovolumeM3;
	return Math.max(gasEnergyJ / Math.max(gasVolumeM3, 1e-9), 0);
}
var EMPTY_TRACE = Object.freeze([]);
function runSimulation(input, model, options = {}) {
	const { chargeMassKg, bulletMassKg, boreAreaM2, chamberVolumeM3, propellantSolidDensityKgPerM3, bulletTravelM, boreDiameterM, freeboreJumpM, engravingPressurePa, propellantImpetusJPerKg } = input;
	const { reference_pressure_pa: referencePressurePa, burn_exponent: burnRateExponent, engraving_decay_length_m: engravingDecayLengthM, barrel_heat_loss_coefficient: barrelHeatLossCoefficient, gas_covolume_m3_per_kg: gasCovolumeM3PerKg, time_step_s: timeStepS, max_simulation_time_s: maxSimulationTimeS, overpressure_limit_pa: overpressureLimitPa, trace_sample_stride: traceSampleStride, bore_friction_ref_velocity_mps: boreFrictionRefVelocityMps, bore_friction_velocity_floor_mps: boreFrictionVelocityFloorMps, bore_friction_velocity_exponent: boreFrictionVelocityExponent, bore_friction_velocity_scale_min: boreFrictionVelocityScaleMin, bore_friction_velocity_scale_max: boreFrictionVelocityScaleMax, heat_loss_ref_velocity_mps: heatLossRefVelocityMps, heat_loss_velocity_exponent: heatLossVelocityExponent, pressure_damping_floor_pa: pressureDampingFloorPa, pressure_damping_ref_pa: pressureDampingRefPa, pressure_damping_slope: pressureDampingSlope, pressure_damping_min: pressureDampingMin, pressure_damping_max: pressureDampingMax } = model;
	const specificHeatRatioMinusOne = model.specific_heat_ratio - 1;
	const lagrangeDivisor = 1 + chargeMassKg / (3 * bulletMassKg);
	const breechToMeanPressureRatio = (1 + chargeMassKg / (2 * bulletMassKg)) / lagrangeDivisor;
	const boreFrictionPa = model.bore_friction_pressure_pa * input.boreFrictionMultiplier;
	const boreCircumferenceM = Math.PI * boreDiameterM;
	const freeboreResistancePa = Math.max(model.neck_tension_pressure_pa, model.bore_friction_pressure_pa);
	const shotStartGatePa = freeboreJumpM > model.freebore_jump_threshold_m ? freeboreResistancePa : engravingPressurePa;
	const loadingDensityFraction = loadingDensity(chargeMassKg, chamberVolumeM3, input.propellantBulkDensityKgPerM3);
	const fillDelta = loadingDensityFraction - model.reference_loading_density;
	const effFillDeltaForEnergy = Math.max(fillDelta, model.impetus_fill_delta_min);
	const effectiveImpetusJPerKg = propellantImpetusJPerKg * clamp(1 + model.impetus_fill_slope * effFillDeltaForEnergy, model.impetus_fill_scale_min, model.impetus_fill_scale_max);
	let baseProgOffset = model.progressivity_offset_extruded;
	let tailExp = model.sliver_tail_exponent_extruded;
	let rawDeficitCoeff = input.ignitionDeficitCoefficient;
	if (input.kernelShape !== void 0) {
		if (input.kernelShape === "ball") {
			baseProgOffset = model.progressivity_offset_ball;
			tailExp = model.sliver_tail_exponent_ball;
		} else if (input.kernelShape === "extrudedMultiPerf") {
			baseProgOffset = model.progressivity_offset_multi_perf;
			tailExp = model.sliver_tail_exponent_multi_perf;
			rawDeficitCoeff -= model.ignition_deficit_multi_perf_offset;
		}
	} else if (rawDeficitCoeff >= model.ignition_deficit_ball) {
		baseProgOffset = model.progressivity_offset_ball;
		tailExp = model.sliver_tail_exponent_ball;
	} else if (rawDeficitCoeff >= model.ignition_deficit_multi_perf) {
		baseProgOffset = model.progressivity_offset_multi_perf;
		tailExp = model.sliver_tail_exponent_multi_perf;
		rawDeficitCoeff -= model.ignition_deficit_multi_perf_offset;
	}
	const arealDensityKgM2 = bulletMassKg / boreAreaM2;
	const sdProgShift = model.progressivity_sd_scale * Math.log(clamp(arealDensityKgM2 / model.reference_areal_density_kg_per_m2, model.areal_density_ratio_min, model.areal_density_ratio_max));
	const profilePeakBurnFraction = input.burnSurfaceProfile.burnFractionAtSurfacePeak;
	const profileGain = input.burnSurfaceProfile.surfacePeakGain;
	const profileSliverBurnFraction = sliverStartBurnFraction(input.burnSurfaceProfile);
	const progressivityShift = clamp(baseProgOffset + model.progressivity_fill_slope * fillDelta + sdProgShift, model.progressivity_shift_min, model.progressivity_shift_max);
	const initialSurface = Math.max(model.initial_surface_min, 1 - model.initial_surface_prog_scale * progressivityShift);
	const profilePeakSurface = Math.max(model.peak_surface_min, 1 + profileGain + model.peak_surface_prog_scale * progressivityShift);
	const surfaceRise = profilePeakSurface - initialSurface;
	const profileSliverSpan = Math.max(1 - profileSliverBurnFraction, 1e-6);
	let ignitionFactor = 1;
	if (rawDeficitCoeff > 0) {
		const fillDeficit = Math.max(model.ignition_deficit_fill_threshold - loadingDensityFraction, 0);
		ignitionFactor = clamp(1 - model.ignition_deficit_scale * rawDeficitCoeff * fillDeficit * fillDeficit, model.ignition_factor_min, 1);
	}
	const ignitionAdjustedBurnRateCoefficient = input.burnRateCoefficient * ignitionFactor;
	const halfStepS = .5 * timeStepS;
	const sixthStepS = timeStepS / 6;
	const halfBulletMassKg = .5 * bulletMassKg;
	const chargeOverSix = chargeMassKg / 6;
	const invSolidDensity = 1 / propellantSolidDensityKgPerM3;
	const engravingDeltaPa = engravingPressurePa - boreFrictionPa;
	const engravingCutoffDistM = 37 * engravingDecayLengthM;
	const fullBurnEnergyJ = effectiveImpetusJPerKg * chargeMassKg;
	const fullBurnCovolumeM3 = chargeMassKg * gasCovolumeM3PerKg;
	const hasPressureDamping = pressureDampingSlope !== 0;
	const flatPressureDamping = clamp(1, pressureDampingMin, pressureDampingMax);
	const floorBoreFrictionPa = boreFrictionPa * clamp(Math.pow(boreFrictionRefVelocityMps / boreFrictionVelocityFloorMps, boreFrictionVelocityExponent), boreFrictionVelocityScaleMin, boreFrictionVelocityScaleMax);
	const heatLossQuarterPower = heatLossVelocityExponent === .25;
	let burnFraction = model.initial_burn_fraction;
	let travelM = 0;
	let velocityMps = 0;
	let energyLostJ = 0;
	const travelSampleSpacingM = options.travelSampleSpacingM ?? 0;
	const travelSampleOffsetM = options.travelSampleOffsetM ?? 0;
	const trace = options.trace === true ? [] : null;
	const travelSamples = travelSampleSpacingM > 0 ? [] : null;
	let nextTravelSampleM = travelSampleSpacingM > 0 ? (Math.floor(travelSampleOffsetM / travelSampleSpacingM) + 1) * travelSampleSpacingM - travelSampleOffsetM : 0;
	let timeS = 0;
	let peakMeanPressurePa = 0;
	let bulletMoving = false;
	let stepIndex = 0;
	while (timeS < maxSimulationTimeS) {
		const gasBurnFraction = Math.min(burnFraction, 1);
		const v2 = velocityMps * velocityMps;
		const gasEnergyJ = (gasBurnFraction === 1 ? fullBurnEnergyJ : fullBurnEnergyJ * gasBurnFraction) - specificHeatRatioMinusOne * (halfBulletMassKg * v2 + chargeOverSix * v2 + energyLostJ);
		const gasVolumeM3 = gasBurnFraction === 1 ? chamberVolumeM3 + boreAreaM2 * travelM - fullBurnCovolumeM3 : chamberVolumeM3 + boreAreaM2 * travelM - (1 - gasBurnFraction) * chargeMassKg * invSolidDensity - gasBurnFraction * fullBurnCovolumeM3;
		const pressurePa = Math.max(gasEnergyJ / Math.max(gasVolumeM3, 1e-9), 0);
		if (pressurePa > peakMeanPressurePa) {
			peakMeanPressurePa = pressurePa;
			if (peakMeanPressurePa > overpressureLimitPa) return simulationFailure("overpressure", model);
		}
		if (trace !== null && stepIndex % traceSampleStride === 0) trace.push({
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
		const previousBurnFraction = burnFraction;
		const previousEnergyLostJ = energyLostJ;
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
			if (stageBurnFraction < 1 && stagePressurePa > 0) {
				let relativeBurnSurface;
				if (stageBurnFraction < profilePeakBurnFraction) relativeBurnSurface = initialSurface + surfaceRise * (stageBurnFraction / profilePeakBurnFraction);
				else if (stageBurnFraction < profileSliverBurnFraction) relativeBurnSurface = profilePeakSurface;
				else {
					const sliverRatio = Math.max((1 - stageBurnFraction) / profileSliverSpan, 0);
					relativeBurnSurface = profilePeakSurface * Math.pow(sliverRatio, tailExp);
				}
				let pressureDamping = flatPressureDamping;
				if (hasPressureDamping) {
					const logP = Math.log(Math.max(stagePressurePa, pressureDampingFloorPa) / pressureDampingRefPa);
					pressureDamping = clamp(1 - pressureDampingSlope * logP, pressureDampingMin, pressureDampingMax);
				}
				burnFractionRate = ignitionAdjustedBurnRateCoefficient * relativeBurnSurface * Math.pow(stagePressurePa / referencePressurePa, burnRateExponent) * pressureDamping;
			}
			let travelRateMps = 0;
			let accelerationMps2 = 0;
			let energyLossRateW = 0;
			if (bulletMoving) {
				let resistancePressurePa;
				if (stageTravelM < freeboreJumpM) resistancePressurePa = freeboreResistancePa;
				else {
					const postJumpM = stageTravelM - freeboreJumpM;
					const effBoreFrictionPa = stageVelocityMps <= boreFrictionVelocityFloorMps ? floorBoreFrictionPa : boreFrictionPa * clamp(Math.pow(boreFrictionRefVelocityMps / stageVelocityMps, boreFrictionVelocityExponent), boreFrictionVelocityScaleMin, boreFrictionVelocityScaleMax);
					resistancePressurePa = postJumpM > engravingCutoffDistM ? effBoreFrictionPa : effBoreFrictionPa + engravingDeltaPa * Math.exp(-postJumpM / engravingDecayLengthM);
				}
				travelRateMps = stageVelocityMps;
				accelerationMps2 = Math.max(boreAreaM2 * (stagePressurePa / lagrangeDivisor - resistancePressurePa) / bulletMassKg, 0);
				const heatVelRatio = (stageVelocityMps > 1 ? stageVelocityMps : 1) / heatLossRefVelocityMps;
				const effectiveHeatVelocityMps = heatLossRefVelocityMps * (heatLossQuarterPower ? Math.sqrt(Math.sqrt(heatVelRatio)) : Math.pow(heatVelRatio, heatLossVelocityExponent));
				energyLossRateW = boreAreaM2 * resistancePressurePa * stageVelocityMps + barrelHeatLossCoefficient * (boreCircumferenceM * stageTravelM) * Math.sqrt(stagePressurePa) * effectiveHeatVelocityMps;
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
				if (bulletMoving) {
					stageTravelM = travelM + stageStepS * travelRateMps;
					stageVelocityMps = velocityMps + stageStepS * accelerationMps2;
					const stageEnergyLostJ = energyLostJ + stageStepS * energyLossRateW;
					const stageGasBurnFraction = Math.min(stageBurnFraction, 1);
					const stageV2 = stageVelocityMps * stageVelocityMps;
					const stageGasEnergyJ = (stageGasBurnFraction === 1 ? fullBurnEnergyJ : fullBurnEnergyJ * stageGasBurnFraction) - specificHeatRatioMinusOne * (halfBulletMassKg * stageV2 + chargeOverSix * stageV2 + stageEnergyLostJ);
					const stageGasVolumeM3 = stageGasBurnFraction === 1 ? chamberVolumeM3 + boreAreaM2 * stageTravelM - fullBurnCovolumeM3 : chamberVolumeM3 + boreAreaM2 * stageTravelM - (1 - stageGasBurnFraction) * chargeMassKg * invSolidDensity - stageGasBurnFraction * fullBurnCovolumeM3;
					stagePressurePa = Math.max(stageGasEnergyJ / Math.max(stageGasVolumeM3, 1e-9), 0);
				} else {
					const stageGasBurnFraction = Math.min(stageBurnFraction, 1);
					const stageGasEnergyJ = fullBurnEnergyJ * stageGasBurnFraction;
					const stageGasVolumeM3 = chamberVolumeM3 - (1 - stageGasBurnFraction) * chargeMassKg * invSolidDensity - stageGasBurnFraction * fullBurnCovolumeM3;
					stagePressurePa = Math.max(stageGasEnergyJ / Math.max(stageGasVolumeM3, 1e-9), 0);
				}
			}
		}
		burnFraction = Math.min(burnFraction + sixthStepS * burnFractionRateSum, 1);
		travelM += sixthStepS * travelRateSumMps;
		velocityMps += sixthStepS * accelerationSumMps2;
		energyLostJ += sixthStepS * energyLossRateSumW;
		timeS += timeStepS;
		stepIndex += 1;
		while (travelSamples !== null && travelM >= nextTravelSampleM && nextTravelSampleM <= bulletTravelM) {
			const crossingFraction = travelM > previousTravelM ? (nextTravelSampleM - previousTravelM) / (travelM - previousTravelM) : 1;
			const velocityAtSampleMps = previousVelocityMps + (velocityMps - previousVelocityMps) * crossingFraction;
			const burnFractionAtSample = previousBurnFraction + (burnFraction - previousBurnFraction) * crossingFraction;
			const energyLostAtSampleJ = previousEnergyLostJ + (energyLostJ - previousEnergyLostJ) * crossingFraction;
			travelSamples.push({
				timeS: previousTimeS + (timeS - previousTimeS) * crossingFraction,
				travelM: nextTravelSampleM,
				velocityMps: velocityAtSampleMps,
				meanPressurePa: meanPressurePa(input, model, effectiveImpetusJPerKg, burnFractionAtSample, nextTravelSampleM, velocityAtSampleMps, energyLostAtSampleJ),
				burnFraction: burnFractionAtSample
			});
			nextTravelSampleM += travelSampleSpacingM;
		}
		if (travelM >= bulletTravelM) {
			const crossingFraction = travelM > previousTravelM ? (bulletTravelM - previousTravelM) / (travelM - previousTravelM) : 1;
			const exitVelocityMps = previousVelocityMps + (velocityMps - previousVelocityMps) * crossingFraction;
			const exitTimeS = previousTimeS + (timeS - previousTimeS) * crossingFraction;
			const exitBurnFraction = previousBurnFraction + (burnFraction - previousBurnFraction) * crossingFraction;
			const exitEnergyLostJ = previousEnergyLostJ + (energyLostJ - previousEnergyLostJ) * crossingFraction;
			if (trace !== null || travelSamples !== null) {
				const exitPoint = {
					timeS: exitTimeS,
					travelM: bulletTravelM,
					velocityMps: exitVelocityMps,
					meanPressurePa: meanPressurePa(input, model, effectiveImpetusJPerKg, exitBurnFraction, bulletTravelM, exitVelocityMps, exitEnergyLostJ),
					burnFraction: exitBurnFraction
				};
				if (trace !== null) trace.push(exitPoint);
				if (travelSamples !== null) {
					const lastSample = travelSamples[travelSamples.length - 1];
					if (!lastSample || bulletTravelM - lastSample.travelM > 1e-6) travelSamples.push(exitPoint);
					else travelSamples[travelSamples.length - 1] = exitPoint;
				}
			}
			return {
				ok: true,
				muzzleVelocityMps: exitVelocityMps,
				peakPressurePa: peakMeanPressurePa * breechToMeanPressureRatio,
				burnFractionAtExit: exitBurnFraction,
				exitTimeS,
				trace: trace ?? EMPTY_TRACE,
				travelSamples: travelSamples ?? EMPTY_TRACE
			};
		}
	}
	return simulationFailure("noExit", model);
}

function calibrationUrl() {
	return `/tuning-db.json`;
}
var cachedCalibration = null;
function loadCalibration(expectedEngineFingerprint) {
	if (!cachedCalibration) {
		const url = calibrationUrl();
		cachedCalibration = fetch(url).then((response) => {
			if (!response.ok) throw new Error(`Failed to load the calibration data from ${url} (HTTP ${response.status}).`);
			return response.json();
		}).then((calibration) => {
			assertModelConstants(calibration.model);
			assertUnfittedCartridgeSpread(calibration.unfitted_cartridge_spread);
			return calibration;
		}).catch((error) => {
			cachedCalibration = null;
			throw error;
		});
	}
	if (!expectedEngineFingerprint) return cachedCalibration;
	const pending = cachedCalibration;
	return pending.then((calibration) => {
		if (calibration.engine_fingerprint !== expectedEngineFingerprint) {
			if (cachedCalibration === pending) cachedCalibration = null;
			assertEngineFingerprint(calibration.engine_fingerprint, expectedEngineFingerprint);
		}
		return calibration;
	});
}
function assertEngineFingerprint(fitFingerprint, expectedEngineFingerprint) {
	if (typeof fitFingerprint !== "string" || fitFingerprint.length === 0) throw new CalibrationVersionError(`The calibration data has no engine fingerprint (this engine is ${expectedEngineFingerprint}). It is older than this version of the app; reload the page to fetch the matching one.`, false);
	if (fitFingerprint !== expectedEngineFingerprint) throw new CalibrationVersionError(`The calibration data was fitted on engine ${fitFingerprint}, but this app is running engine ${expectedEngineFingerprint}. Reload the page to fetch the matching app and calibration.`, true);
}
function assertUnfittedCartridgeSpread(spread) {
	const s = spread;
	const finite = (x) => typeof x === "number" && Number.isFinite(x) && x >= 0;
	if (!s || !finite(s.velocity) || !finite(s.pressure)) throw new CalibrationVersionError("The calibration data is out of date: it has no unfitted-cartridge spread. It is older than this version of the app; reload the page to fetch the matching one.", false);
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
	let powder = calibrated;
	if (baseBurnRateCoefficientOverride !== void 0) {
		if (!Number.isFinite(baseBurnRateCoefficientOverride) || baseBurnRateCoefficientOverride <= 0) throw new RangeError(`Invalid baseBurnRateCoefficientOverride for powder ${powderId}: expected a positive finite number, got ${baseBurnRateCoefficientOverride}.`);
		powder = {
			...calibrated,
			burn_coeff: baseBurnRateCoefficientOverride
		};
	}
	return {
		...input,
		burnRateCoefficient: effectiveBurnRateCoefficient(powder, inputLoadingDensity(input), input.boreDiameterM * 1e3, calibration.model),
		propellantImpetusJPerKg: powder.impetus,
		burnSurfaceProfile: fittedBurnSurfaceProfile(input.burnSurfaceProfile, powder)
	};
}
function fittedBurnSurfaceProfile(fromRecord, powder) {
	const fitted = {
		...fromRecord,
		surfacePeakGain: powder.form_gain,
		burnFractionAtSurfacePeak: powder.form_zpeak
	};
	return {
		...fitted,
		burnFractionAtSliverStart: sliverStartBurnFraction(fitted)
	};
}
function appliedChargeSlope(fittedSlope, model) {
	return fittedSlope === void 0 ? 0 : fittedSlope + model.pair_charge_slope_extra;
}
function hasEntries(record) {
	for (const key in record) if (Object.prototype.hasOwnProperty.call(record, key)) return true;
	return false;
}
function velocityFactor(calibration, ids, loadingDensityFraction) {
	let factor = (calibration.cartridges[ids.cartridgeId]?.v_factor ?? 1) * (calibration.bullets_v[ids.bulletId] ?? 1);
	const hasPairs = hasEntries(calibration.pairs);
	const hasPairSlopes = hasEntries(calibration.pair_slopes);
	if (hasPairs || hasPairSlopes) {
		const pairId = pairKey(ids.cartridgeId, ids.powderId);
		if (hasPairs) factor *= calibration.pairs[pairId] ?? 1;
		if (hasPairSlopes) {
			const chargeSlope = appliedChargeSlope(calibration.pair_slopes[pairId], calibration.model);
			if (chargeSlope !== 0) {
				const fillDelta = loadingDensityFraction - calibration.model.reference_loading_density;
				if (fillDelta !== 0) factor *= Math.exp(chargeSlope * fillDelta);
			}
		}
	}
	if (hasEntries(calibration.cart_bullet)) factor *= calibration.cart_bullet[pairKey(ids.cartridgeId, ids.bulletId)] ?? 1;
	return factor;
}
function pressureFactor(calibration, ids, loadingDensityFraction) {
	let factor = (calibration.cartridges[ids.cartridgeId]?.p_scale ?? 1) * (calibration.powder_press[ids.powderId] ?? 1) * (calibration.bullets[ids.bulletId] ?? 1);
	const hasPressPairs = hasEntries(calibration.press_pairs);
	const hasPressPairSlopes = hasEntries(calibration.press_pair_slopes);
	let pairSlope;
	if (hasPressPairs || hasPressPairSlopes) {
		const pairId = pairKey(ids.cartridgeId, ids.powderId);
		if (hasPressPairs) factor *= calibration.press_pairs[pairId] ?? 1;
		if (hasPressPairSlopes) pairSlope = calibration.press_pair_slopes[pairId];
	}
	if (hasEntries(calibration.press_cart_bullet)) factor *= calibration.press_cart_bullet[pairKey(ids.cartridgeId, ids.bulletId)] ?? 1;
	const slope = calibration.press_ramp + (pairSlope ?? calibration.press_powder_slopes[ids.powderId] ?? 0);
	if (slope !== 0) {
		const fillDelta = loadingDensityFraction - calibration.model.reference_loading_density;
		if (fillDelta !== 0) factor *= Math.exp(slope * fillDelta);
	}
	return factor;
}

function calibrationId(record) {
	return record.derivedFrom ?? record.id;
}
function burnSurfaceProfileInUse(calibration, powder) {
	const fitted = calibration.powders[calibrationId(powder)];
	return fitted ? fittedBurnSurfaceProfile(recordBurnSurfaceProfile(powder, calibration.model), fitted) : null;
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
	const missingCorrection = calibration.cartridges[ids.cartridgeId] ? null : calibration.unfitted_cartridge_spread;
	const caseCapacityWaterGrams = args.caseCapacityH2oGrams || args.cartridge.baseCapacityH2oGrams || 0;
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
		const loadingDensityFraction = prepared.derived.fillFraction;
		if (loadingDensityFraction < model.calibrated_fill_min || loadingDensityFraction > model.calibrated_fill_max) {
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
		const velocityDraw = missingCorrection ? Math.exp(missingCorrection.velocity * standardNormal(random)) : 1;
		const pressureDraw = missingCorrection ? Math.exp(missingCorrection.pressure * standardNormal(random)) : 1;
		velocitiesMps.push(simulation.muzzleVelocityMps * velocityFactor(calibration, ids, loadingDensityFraction) * velocityDraw);
		pressuresPa.push(simulation.peakPressurePa * pressureFactor(calibration, ids, loadingDensityFraction) * pressureDraw);
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

export { usableCaseVolumeM3 as _, loadCalibration as a, loadingDensity as b, bulletSeatingDepthMm as c, oneCaliberGripCoalMm as d, parentCartridgeIdOf as f, seatingCaseLengthMm as g, seatedCoalMm as h, simulateLoadWithCalibration as i, cylindricalNeckGripMm as l, sameCaliberDerivedFrom as m, calibrationId as n, WATER_GRAMS_TO_M3 as o, resolveDiameters as p, simulateLoadEnsemble as r, buildSimInput as s, burnSurfaceProfileInUse as t, estimateNeckedWaterCapacityGrams as u, CalibrationVersionError as v, chargeKgAtLoadingDensity as y };