import { getById } from './utils.js';

const paperSizeEl = getById('paper-size');
const orientationEl = getById('orientation');
const targetTypeEl = getById('target-type');
const bullseyeOptionsEl = getById('bullseye-options');
const gridOptionsEl = getById('grid-options');
const bullseyeRingsEl = getById('bullseye-rings');
const bullseyeColorEl = getById('bullseye-color');
const gridSpacingEl = getById('grid-spacing');
const gridColorEl = getById('grid-color');
const printTargetBtnEl = getById('print-target-btn');
const targetCanvasEl = getById('target-canvas');

const ctx = targetCanvasEl.getContext('2d');

function drawTarget() {
    const paperSize = paperSizeEl.value;
    const orientation = orientationEl.value;
    const targetType = targetTypeEl.value;

    let width, height;
    if (paperSize === 'letter') {
        width = orientation === 'portrait' ? 8.5 : 11;
        height = orientation === 'portrait' ? 11 : 8.5;
    } else { // A4
        width = orientation === 'portrait' ? 210 / 25.4 : 297 / 25.4;
        height = orientation === 'portrait' ? 297 / 25.4 : 210 / 25.4;
    }

    const dpi = 300;
    targetCanvasEl.width = width * dpi;
    targetCanvasEl.height = height * dpi;

    ctx.clearRect(0, 0, targetCanvasEl.width, targetCanvasEl.height);

    if (targetType === 'bullseye') {
        drawBullseye(width * dpi, height * dpi);
    } else { // grid
        drawGrid(width * dpi, height * dpi);
    }
}

function drawBullseye(width, height) {
    const rings = bullseyeRingsEl.value;
    const color = bullseyeColorEl.value;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 * 0.9;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    for (let i = 1; i <= rings; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * (i / rings), 0, 2 * Math.PI);
        ctx.stroke();
    }
}

function drawGrid(width, height) {
    const spacing = gridSpacingEl.value * 300; // dpi
    const color = gridColorEl.value;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (let x = spacing; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

function handleTargetTypeChange() {
    if (targetTypeEl.value === 'bullseye') {
        bullseyeOptionsEl.style.display = 'block';
        gridOptionsEl.style.display = 'none';
    } else {
        bullseyeOptionsEl.style.display = 'none';
        gridOptionsEl.style.display = 'block';
    }
    drawTarget();
}

function printTarget() {
    const dataUrl = targetCanvasEl.toDataURL();
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<img src="${dataUrl}" style="width: 100%;">`);
    printWindow.print();
}

[paperSizeEl, orientationEl, bullseyeRingsEl, bullseyeColorEl, gridSpacingEl, gridColorEl].forEach(el => {
    el.addEventListener('change', drawTarget);
});

targetTypeEl.addEventListener('change', handleTargetTypeChange);
printTargetBtnEl.addEventListener('click', printTarget);

// Initial setup
handleTargetTypeChange();
drawTarget();
