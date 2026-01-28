// ==========================================
// MODUL SIMULASI 1: Silinder Menggelinding
// ==========================================

export function initRollingSim(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    const PIXELS_PER_METER = 40;
    const CYLINDER_RADIUS = 25; 

    // Simulation Loop Variable
    let animationFrameId;
    let isActive = true;

    // --- State & Params ---
    let params = { g: 9.8, m: 5.0, mu_s: 0.5, mu_k: 0.3, theta: 15.0 };
    let state = { pos: 0.0, vel: 0.0, rotation_angle: 0.0, lastTime: 0, is_slipping: false };
    let physics_output = { accel: 0, friction: 0, torque: 0, normal: 0, weight: 0, mode: "Diam" };

    // --- DOM Elements ---
    const sliders = {
        g: document.getElementById('slider-g'),
        m: document.getElementById('slider-m'),
        mus: document.getElementById('slider-mus'),
        theta: document.getElementById('slider-theta')
    };
    
    const displays = {
        g: document.getElementById('val-g'),
        m: document.getElementById('val-m'),
        mus: document.getElementById('val-mus'),
        theta: document.getElementById('val-theta'),
        state: document.getElementById('stat-state'),
        vel: document.getElementById('stat-vel'),
        acc: document.getElementById('stat-acc'),
        f: document.getElementById('stat-f'),
        torque: document.getElementById('stat-torque-roll')
    };

    function updateParams() {
        if(!sliders.g) return;
        params.g = parseFloat(sliders.g.value);
        params.m = parseFloat(sliders.m.value);
        params.mu_s = parseFloat(sliders.mus.value);
        params.theta = parseFloat(sliders.theta.value);
        
        // Simple display update
        if(displays.g) displays.g.textContent = params.g.toFixed(1) + " m/s²";
        if(displays.m) displays.m.textContent = params.m.toFixed(1) + " kg";
        if(displays.mus) displays.mus.textContent = params.mu_s.toFixed(2);
        if(displays.theta) displays.theta.textContent = params.theta.toFixed(1) + "°";
    }

    // Attach Listeners
    const listeners = [];
    Object.values(sliders).forEach(s => { 
        if(s) {
            s.addEventListener('input', updateParams);
            listeners.push({ el: s, type: 'input', fn: updateParams });
        }
    });

    const btnReset = document.getElementById('btn-reset');
    const resetFn = () => {
        state.pos = 0; state.vel = 0; state.rotation_angle = 0;
    };
    if(btnReset) {
        btnReset.addEventListener('click', resetFn);
        listeners.push({ el: btnReset, type: 'click', fn: resetFn });
    }

    // --- Physics Logic ---
    function updatePhysics(dt) {
        const rad = params.theta * Math.PI / 180;
        const fg = params.m * params.g;
        const fg_parallel = fg * Math.sin(rad);
        const fg_normal = fg * Math.cos(rad);
        physics_output.weight = fg;
        physics_output.normal = fg_normal;

        const k = 0.5; // Silinder Pejal
        const f_req_rolling = (k * fg_parallel) / (1 + k);
        const f_max_static = params.mu_s * fg_normal;
        const f_kinetic = 0.3 * fg_normal; // Simplified kinetic friction

        let accel = 0;
        let friction = 0;

        if (params.theta > 0.1) {
            if (f_req_rolling <= f_max_static) {
                state.is_slipping = false;
                friction = f_req_rolling;
                accel = (params.g * Math.sin(rad)) / (1 + k);
                physics_output.mode = "Menggelinding Murni";
            } else {
                state.is_slipping = true;
                friction = f_kinetic;
                accel = (fg_parallel - friction) / params.m;
                physics_output.mode = "Menggelinding + Slip";
            }
        } else {
            state.is_slipping = false;
            physics_output.mode = "Diam";
        }

        state.vel += accel * dt;
        state.pos += state.vel * dt;

        const R_physics = 1.0; 
        if (state.is_slipping) {
            const alpha = (2 * friction) / (params.m * R_physics);
            const current_omega = (state.vel / R_physics) * 0.5;
            state.rotation_angle += (current_omega + alpha * dt) * dt * 5; 
        } else {
            const dPosPixels = (state.vel * dt) * PIXELS_PER_METER;
            state.rotation_angle += dPosPixels / CYLINDER_RADIUS;
        }

        physics_output.accel = accel;
        physics_output.friction = friction;
        physics_output.torque = friction * 0.25;
    }

    function drawArrow(ctx, startX, startY, endX, endY, color) {
        if (Math.abs(startX - endX) < 1 && Math.abs(startY - endY) < 1) return;
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLen = 10;
        ctx.beginPath(); ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI/6), endY - headLen * Math.sin(angle - Math.PI/6));
        ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI/6), endY - headLen * Math.sin(angle + Math.PI/6));
        ctx.fill();
    }

    function loop(timestamp) {
        if (!isActive) return;
        if (!state.lastTime) state.lastTime = timestamp;
        const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
        state.lastTime = timestamp;

        updatePhysics(dt);

        // Update UI
        if(displays.state) {
            displays.state.textContent = physics_output.mode;
            displays.state.style.color = state.is_slipping ? '#f87171' : '#4ade80';
            displays.vel.textContent = state.vel.toFixed(2) + " m/s";
            displays.acc.textContent = physics_output.accel.toFixed(2) + " m/s²";
            displays.f.textContent = physics_output.friction.toFixed(1) + " N";
            displays.torque.textContent = physics_output.torque.toFixed(2) + " Nm";
        }

        // Render
        if(canvas.width === 0) { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 + 100;
        const rad = params.theta * Math.PI / 180;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-rad);

        // Slope
        ctx.fillStyle = "#3f3f46"; ctx.fillRect(-1000, 0, 2000, 400); 
        ctx.fillStyle = "#22c55e"; ctx.fillRect(-1000, 0, 2000, 4); 

        // Ticks
        ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 2;
        const spacing = 100;
        const offset = (state.pos * PIXELS_PER_METER) % spacing;
        for(let i = -10; i < 10; i++) {
            let x = i * spacing - offset;
            if(x > -cx - 500 && x < cx + 500) {
                ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, 14); ctx.stroke();
            }
        }

        // Cylinder
        const cylY = -CYLINDER_RADIUS;
        ctx.translate(0, cylY); 
        ctx.save();
        ctx.rotate(state.rotation_angle); 
        ctx.fillStyle = "#3b82f6"; ctx.strokeStyle = "white"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, CYLINDER_RADIUS, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(CYLINDER_RADIUS, 0); ctx.stroke();
        ctx.restore(); 

        // Vectors
        const scale = 3.0;
        drawArrow(ctx, 0, CYLINDER_RADIUS, -physics_output.friction * scale, CYLINDER_RADIUS, "#fb923c"); 
        drawArrow(ctx, 0, CYLINDER_RADIUS, 0, CYLINDER_RADIUS - physics_output.normal * scale, "#ffffff");

        ctx.restore(); 
        animationFrameId = requestAnimationFrame(loop);
    }

    // Initialize
    updateParams();
    animationFrameId = requestAnimationFrame(loop);

    // Return Cleanup Function
    return function stop() {
        isActive = false;
        cancelAnimationFrame(animationFrameId);
        listeners.forEach(l => l.el.removeEventListener(l.type, l.fn));
    };
}
