import { generateUniqueId } from '../db.js';

export const state = {
    targets: [], // Array of { id, targetImageId, img, scale, transform }
    groups: [], // Global array of { id, targetId, pois, poa, color, stats }
    activeTargetIndex: -1,
    
    // Global session properties
    sessionID: null,
    
    // Canvas interaction properties
    settingState: null,
    mousePos: { x: 0, y: 0 },
    animationFrameId: null,
    ctx: null,
    canvas: null,
    
    // Properties that alias the active target for easier refactoring
    get img() { return this.activeTargetIndex >= 0 ? this.targets[this.activeTargetIndex].img : null; },
    get scale() { return this.activeTargetIndex >= 0 ? this.targets[this.activeTargetIndex].scale : null; },
    get transform() { return this.activeTargetIndex >= 0 ? this.targets[this.activeTargetIndex].transform : null; },
    get currentTargetId() { return this.activeTargetIndex >= 0 ? this.targets[this.activeTargetIndex].targetImageId : null; },
    
    currentGroupIndex: -1
};

export function resetState() {
    state.targets = [];
    state.groups = [];
    state.activeTargetIndex = -1;
    state.currentGroupIndex = -1;
    state.settingState = null;
    state.sessionID = generateUniqueId();
}

export function addTargetToSession(targetImageId, newImg) {
    state.targets.push({
        id: generateUniqueId(),
        targetImageId: targetImageId,
        img: newImg,
        scale: { p1: null, p2: null, distance: null, units: 'in', pixelsPerUnit: null },
        transform: { scale: 1 }
    });
    state.activeTargetIndex = state.targets.length - 1;
    state.currentGroupIndex = -1;
}

export function setActiveTarget(index) {
    if (index >= 0 && index < state.targets.length) {
        state.activeTargetIndex = index;
        state.currentGroupIndex = -1;
        state.settingState = null;
        return true;
    }
    return false;
}

export function removeTargetFromSession(index) {
    if (index >= 0 && index < state.targets.length) {
        state.targets.splice(index, 1);
        if (state.activeTargetIndex >= state.targets.length) {
            state.activeTargetIndex = state.targets.length - 1;
        }
        state.currentGroupIndex = -1;
        state.settingState = null;
    }
}

export function setImg(newImg) {
    state.img = newImg;
}

export function setCanvas(canvas) {
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');
}
