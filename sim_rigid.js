// ==========================================
// MODUL SIMULASI 2: Rigid Rotor (2 Partikel)
// ==========================================

export function initRigidSim(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn("Canvas tidak ditemukan untuk Simulasi Rigid Rotor.");
        return;
    }

    // Cek apakah elemen kontrol untuk simulasi ini ada di HTML
    const sliderM1 = document.getElementById('slider-m1');
    if (!sliderM1) {
        console.warn("Elemen kontrol (slider-m1) tidak ditemukan. Pastikan HTML diset untuk Rigid Rotor.");
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // --- State & Params ---
    let params = {
        m1: 2.0, m2: 2.0, L: 150, f1: 0.0, f2: 0.0
    };

    let state = {
        pos: { x: 0, y: 0 },
        vel: { x: 0, y: 0 },
        angle: 0,
        angularVel: 0,
        lastTime: 0
    };

    let physics_output = { inertia: 0, torque: 0, f_net_mag: 0 };

    // --- DOM Elements ---
    const sliders = {
        m1: document.getElementById('slider-m1'),
        m2: document.getElementById('slider-m2'),
        len: document.getElementById('slider-len'),
        f1: document.getElementById('slider-f1'),
        f2: document.getElementById('slider-f2')
    };
    const displays = {
        m1: document.getElementById('val-m1'),
        m2: document.getElementById('val-m2'),
        len: document.getElementById('val-len'),
        f1: document.getElementById('val-f1'),
        f2: document.getElementById('val-f2'),
        inertia: document.getElementById('stat-inertia'),
        omega: document.getElementById('stat-omega'),
        v: document.getElementById('stat-v'),
        fnet: document.getElementById('stat-fnet'),
        torque: document.getElementById('stat-torque')
    };

    function updateParams() {
        if(!sliders.m1) return;
        params.m1 = parseFloat(sliders.m1.value);
        params.m2 = parseFloat(sliders.m2.value);
        params.L = parseFloat(sliders.len.value);
        params.f1 = parseFloat(sliders.f1.value);
        params.f2 = parseFloat(sliders.f2.value);

        if(displays.m1) {
            displays.m1.textContent = params.m1.toFixed(1) + " kg";
            displays.m2.textContent = params.m2.toFixed(1) + " kg";
            displays.len.textContent = params.L.toFixed(0) + " px";
            displays.f1.textContent = params.f1.toFixed(1) + " N";
            displays.f2.textContent = params.f2.toFixed(1) + " N";
        }
    }

    Object.values(sliders).forEach(s => { if(s) s.addEventListener('input', updateParams); });
    
    const btnReset = document.getElementById('btn-reset');
    if(btnReset) {
        btnReset.addEventListener('click', () => {
            state.pos = { x: 0, y: 0 };
            state.vel = { x: 0, y: 0 };
            state.angle = 0;
            state.angularVel = 0;
        });
    }

    // --- Physics Logic ---
    function updatePhysics(dt) {
        const M = params.m1 + params.m2;
        const r1 = (params.m2 / M) * params.L;
        const r2 = (params.m1 / M) * params.L;
        const I = params.m1 * r1 * r1 + params.m2 * r2 * r2;
        physics_output.inertia = I;

        const forceDir = state.angle - Math.PI / 2;
        const F1x = params.f1 * Math.cos(forceDir);
        const F1y = params.f1 * Math.sin(forceDir);
        const F2x = params.f2 * Math.cos(forceDir);
        const F2y = params.f2 * Math.sin(forceDir);

        const F_net_x = F1x + F2x;
        const F_net_y = F1y + F2y;
        physics_output.f_net_mag = Math.sqrt(F_net_x*F_net_x + F_net_y*F_net_y);

        const torque = (params.f2 * r2) - (params.f1 * r1);
        physics_output.torque = torque;

        const ax = F_net_x / M;
        const ay = F_net_y / M;
        const drag = 0.99;
        state.vel.x = (state.vel.x + ax * dt) * drag;
        state.vel.y = (state.vel.y + ay * dt) * drag;
        state.pos.x += state.vel.x * dt * 10;
        state.pos.y += state.vel.y * dt * 10;

        const alpha = torque / I * 500;
        const rotDrag = 0.98;
        state.angularVel = (state.angularVel + alpha * dt) * rotDrag;
        state.angle += state.angularVel * dt;

        // Boundary Bounce
        const w = canvas.width / 2;
        const h = canvas.height / 2;
        const margin = 50;
        if (state.pos.x > w - margin) { state.pos.x = w - margin; state.vel.x *= -0.8; }
        if (state.pos.x < -w + margin) { state.pos.x = -w + margin; state.vel.x *= -0.8; }
        if (state.pos.y > h - margin) { state.pos.y = h - margin; state.vel.y *= -0.8; }
        if (state.pos.y < -h + margin) { state.pos.y = -h + margin; state.vel.y *= -0.8; }
    }

    function drawArrow(ctx, startX, startY, angle, magnitude, color) {
        if (Math.abs(magnitude) < 0.1) return;
        const scale = 5; 
        const len = magnitude * scale;
        const endX = startX + Math.cos(angle) * len;
        const endY = startY + Math.sin(angle) * len;

        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();

        const arrowAngle = Math.atan2(endY - startY, endX - startX);
        const headLen = 8;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLen * Math.cos(arrowAngle - Math.PI/6), endY - headLen * Math.sin(arrowAngle - Math.PI/6));
        ctx.lineTo(endX - headLen * Math.cos(arrowAngle + Math.PI/6), endY - headLen * Math.sin(arrowAngle + Math.PI/6));
        ctx.fill();
    }

    function loop(timestamp) {
        if (!state.lastTime) state.lastTime = timestamp;
        const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
        state.lastTime = timestamp;

        updatePhysics(dt);

        if(displays.inertia) {
            displays.inertia.textContent = physics_output.inertia.toFixed(0);
            displays.omega.textContent = state.angularVel.toFixed(2);
            displays.v.textContent = (Math.sqrt(state.vel.x**2 + state.vel.y**2) * 10).toFixed(1);
            displays.fnet.textContent = physics_output.f_net_mag.toFixed(1);
            displays.torque.textContent = physics_output.torque.toFixed(1);
        }

        if(canvas.width === 0) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.save();
        ctx.translate(cx + state.pos.x, cy + state.pos.y);
        ctx.rotate(state.angle);

        const M = params.m1 + params.m2;
        const r1 = (params.m2 / M) * params.L;
        const r2 = (params.m1 / M) * params.L;

        // Rod
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-r1, 0); ctx.lineTo(r2, 0); ctx.stroke();

        // Particles
        ctx.fillStyle = "#3b82f6"; ctx.beginPath(); ctx.arc(-r1, 0, 5 + params.m1 * 3, 0, Math.PI*2); ctx.fill();
        drawArrow(ctx, -r1, 0, -Math.PI/2, params.f1, "#60a5fa");

        ctx.fillStyle = "#fb923c"; ctx.beginPath(); ctx.arc(r2, 0, 5 + params.m2 * 3, 0, Math.PI*2); ctx.fill();
        drawArrow(ctx, r2, 0, -Math.PI/2, params.f2, "#fbbf24");

        // CM Marker
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.fill();
        
        ctx.restore();
        requestAnimationFrame(loop);
    }

    updateParams();
    requestAnimationFrame(loop);
}
