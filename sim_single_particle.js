// ==========================================
// MODUL SIMULASI 1: Partikel Tunggal (Rotasi)
// ==========================================

export function initSingleParticleSim(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let isActive = true;

    // --- State & Params ---
    // m: massa, r: jari-jari, f: gaya tangensial, damping: hambatan
    let params = { m: 2.0, r: 150, f: 0.0, damping: 0.0 };
    let state = { angle: 0, angularVel: 0, lastTime: 0 };
    let physics_output = { inertia: 0, torque: 0, alpha: 0 };

    // --- DOM Elements ---
    const sliders = {
        m: document.getElementById('slider-s-m'),
        r: document.getElementById('slider-s-r'),
        f: document.getElementById('slider-s-f'),
        damp: document.getElementById('slider-s-damp')
    };
    
    const displays = {
        m: document.getElementById('val-s-m'),
        r: document.getElementById('val-s-r'),
        f: document.getElementById('val-s-f'),
        damp: document.getElementById('val-s-damp'),
        inertia: document.getElementById('stat-s-inertia'),
        omega: document.getElementById('stat-s-omega'),
        alpha: document.getElementById('stat-s-alpha'),
        torque: document.getElementById('stat-s-torque')
    };

    function updateParams() {
        if(!sliders.m) return;
        params.m = parseFloat(sliders.m.value);
        params.r = parseFloat(sliders.r.value);
        params.f = parseFloat(sliders.f.value);
        params.damping = parseFloat(sliders.damp.value);

        if(displays.m) {
            displays.m.textContent = params.m.toFixed(1) + " kg";
            displays.r.textContent = params.r.toFixed(0) + " px";
            displays.f.textContent = params.f.toFixed(1) + " N";
            displays.damp.textContent = params.damping.toFixed(2);
        }
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
        state.angle = 0; state.angularVel = 0;
    };
    if(btnReset) {
        btnReset.addEventListener('click', resetFn);
        listeners.push({ el: btnReset, type: 'click', fn: resetFn });
    }

    // --- Physics Logic ---
    function updatePhysics(dt) {
        // 1. Momen Inersia Partikel Tunggal (I = m * r^2)
        // Kita bagi 1000 agar angkanya tidak terlalu besar secara visual/skala pixel
        const I = params.m * (params.r * params.r) / 1000; 
        physics_output.inertia = params.m * params.r * params.r; // Nilai asli untuk display

        // 2. Torsi (Tau = r * F * sin(theta))
        // Karena gaya kita anggap selalu tangensial (tegak lurus batang), sin(90) = 1
        const torque = params.f * (params.r / 10); // Bagi 10 untuk skala visual
        physics_output.torque = params.f * params.r; // Nilai asli (N.px)

        // 3. Percepatan Sudut (Alpha = Tau / I)
        const alpha = torque / I;
        physics_output.alpha = alpha;

        // 4. Update Kecepatan Sudut (Omega)
        // Hambatan Udara (Damping) logic
        const dragFactor = 1.0 - (params.damping * 0.05);
        state.angularVel = (state.angularVel + alpha * dt) * dragFactor;

        // 5. Update Posisi Sudut
        state.angle += state.angularVel * dt;
    }

    function drawArrow(ctx, startX, startY, angle, magnitude, color) {
        if (Math.abs(magnitude) < 0.1) return;
        const scale = 4; 
        const len = magnitude * scale;
        
        // Arah panah tegak lurus batang
        const arrowAngle = angle + (Math.PI / 2);
        
        const endX = startX + Math.cos(arrowAngle) * len;
        const endY = startY + Math.sin(arrowAngle) * len;

        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
        
        const headAngle = Math.atan2(endY - startY, endX - startX);
        const headLen = 8;
        ctx.beginPath(); ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLen * Math.cos(headAngle - Math.PI/6), endY - headLen * Math.sin(headAngle - Math.PI/6));
        ctx.lineTo(endX - headLen * Math.cos(headAngle + Math.PI/6), endY - headLen * Math.sin(headAngle + Math.PI/6));
        ctx.fill();
    }

    function loop(timestamp) {
        if (!isActive) return;
        if (!state.lastTime) state.lastTime = timestamp;
        const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
        state.lastTime = timestamp;

        updatePhysics(dt);

        // Update Stats UI
        if(displays.inertia) {
            displays.inertia.textContent = physics_output.inertia.toFixed(0);
            displays.omega.textContent = state.angularVel.toFixed(2);
            displays.alpha.textContent = physics_output.alpha.toFixed(2);
            displays.torque.textContent = physics_output.torque.toFixed(1);
        }

        // Render Canvas
        if(canvas.width === 0 || canvas.width !== canvas.parentElement.clientWidth) { 
            canvas.width = canvas.parentElement.clientWidth; 
            canvas.height = canvas.parentElement.clientHeight; 
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        
        // Pivot Point (Pusat Rotasi)
        ctx.fillStyle = "#cbd5e1"; 
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
        
        // Rotasi Sistem
        ctx.rotate(state.angle);

        // Batang (Rod)
        ctx.strokeStyle = "#64748b"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(params.r, 0); ctx.stroke();

        // Partikel (Massa)
        const particleX = params.r;
        const particleY = 0;
        
        ctx.fillStyle = "#3b82f6"; // Biru
        ctx.beginPath(); 
        // Ukuran partikel visual tergantung massa
        ctx.arc(particleX, particleY, 8 + params.m * 2, 0, Math.PI*2); 
        ctx.fill();
        
        // Label Massa
        ctx.fillStyle = "white";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("m", particleX, particleY + 4);

        // Gambar Vektor Gaya (Selalu tegak lurus batang)
        // Kita gambar dari posisi partikel
        // Sudut 0 relatif terhadap sistem rotasi (karena kita sudah ctx.rotate)
        drawArrow(ctx, particleX, particleY, 0, params.f, "#fbbf24"); // Warna Kuning/Oranye

        ctx.restore();
        animationFrameId = requestAnimationFrame(loop);
    }

    updateParams();
    animationFrameId = requestAnimationFrame(loop);

    return function stop() {
        isActive = false;
        cancelAnimationFrame(animationFrameId);
        listeners.forEach(l => l.el.removeEventListener(l.type, l.fn));
    };
}
