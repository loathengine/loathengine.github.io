import { state } from './state.js';

export function updateCanvasSize() {
    if (!state.img || !state.img.baseWidth) return;
    state.canvas.width = Math.floor(state.img.baseWidth * state.transform.scale);
    state.canvas.height = Math.floor(state.img.baseHeight * state.transform.scale);
}

export function getCanvasCoords(e) {
    if (!state.img) return { x: 0, y: 0 };
    const rect = state.canvas.getBoundingClientRect();
    
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const scaleX = state.canvas.width / rect.width;
    const scaleY = state.canvas.height / rect.height;
    
    const trueCanvasX = canvasX * scaleX;
    const trueCanvasY = canvasY * scaleY;

    return { x: trueCanvasX / state.transform.scale, y: trueCanvasY / state.transform.scale };
}

function drawCircle(ctx, point, color) {
    const radius = 8 / state.transform.scale;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawPOA(ctx, point, color) {
    const size = 16 / state.transform.scale;
    ctx.beginPath();
    ctx.moveTo(point.x - size / 2, point.y);
    ctx.lineTo(point.x + size / 2, point.y);
    ctx.moveTo(point.x, point.y - size / 2);
    ctx.lineTo(point.x, point.y + size / 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / state.transform.scale;
    ctx.stroke();
}

function drawMPI(ctx, point, color) {
    const size = 16 / state.transform.scale;
    ctx.beginPath();
    ctx.rect(point.x - size / 2, point.y - size / 2, size, size);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / state.transform.scale;
    ctx.stroke();
}

export function draw() {
    if (!state.img || !state.ctx) {
         if(state.canvas) state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
         return; 
    }

    const ctx = state.ctx;
    ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    
    ctx.save();
    ctx.scale(state.transform.scale, state.transform.scale);
    ctx.drawImage(state.img, 0, 0, state.img.baseWidth, state.img.baseHeight);

    if (state.settingState === 'scale_p2' && state.scale.p1) {
        ctx.beginPath();
        ctx.moveTo(state.scale.p1.x, state.scale.p1.y);
        const currentMouse = getCanvasCoords({clientX: state.mousePos.x, clientY: state.mousePos.y});
        ctx.lineTo(currentMouse.x, currentMouse.y);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.lineWidth = 2 / state.transform.scale; 
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    if (state.scale.p1 && state.scale.p2) {
        ctx.beginPath();
        ctx.moveTo(state.scale.p1.x, state.scale.p1.y);
        ctx.lineTo(state.scale.p2.x, state.scale.p2.y);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2 / state.transform.scale;
        ctx.stroke();
    }

    state.groups.forEach((group) => {
        if (group.poa) { drawPOA(ctx, group.poa, group.color); }
        group.pois.forEach(poi => drawCircle(ctx, poi, group.color));
        if (group.stats && group.stats.mpi && group.pois.length > 0) {
            drawMPI(ctx, group.stats.mpi, group.color);
        }
    });

    ctx.restore();
}
