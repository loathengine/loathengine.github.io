import { generateUniqueId } from '../db.js';

export const state = {
    img: null,
    scale: { p1: null, p2: null, distance: null, units: 'in', pixelsPerUnit: null },
    groups: [],
    currentGroupIndex: -1,
    settingState: null,
    sessionID: null,
    currentTargetId: null,
    transform: { scale: 1 },
    mousePos: { x: 0, y: 0 },
    animationFrameId: null,
    ctx: null,
    canvas: null
};

export function resetState() {
    state.transform = { scale: 1 };
    state.scale = { p1: null, p2: null, distance: null, units: 'in', pixelsPerUnit: null };
    state.groups = [];
    state.currentGroupIndex = -1;
    state.settingState = null;
    state.sessionID = generateUniqueId();
}

export function setImg(newImg) {
    state.img = newImg;
}

export function setCanvas(canvas) {
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');
}
