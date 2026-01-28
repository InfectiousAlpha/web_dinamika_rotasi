// ==========================================
// MODUL SIMULASI 3: Sistem Banyak Partikel
// ==========================================

export function initMultiParticleSim(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let isActive = true;

    // --- State & Data ---
    // Array objek partikel: { id: 1, m: 2.0, r: 100 }
    let particles = [
        { id: Date.now(), m: 2.0, r: 100 } // Default 1 partikel
    ];
    let params = { force: 0.0, damping: 0.0 };
    let state = { angle: 0, angularVel: 0, lastTime: 0 };
    let physics = { totalInertia: 0, torque: 0, alpha: 0 };

    // --- DOM Elements ---
    const globalSliders = {
        force: document.getElementById('slider-m-f'),
        damp: document.getElementById('slider-m-damp')
    };
    const globalDisplays = {
        force: document.getElementById('val-m-f'),
        damp: document.getElementById('val-m-damp'),
        count: document.getElementById('stat-m-count'),
        inertia: document.getElementById('stat-m-inertia'),
        omega: document.getElementById('stat-m-omega'),
        torque: document.getElementById('stat-m-torque'),
        alpha: document.getElementById('stat-m-alpha')
    };
    const particleListContainer = document.getElementById('particle-list');
    const btnAdd = document.getElementById('btn-add-particle');

    // --- Helper: Update Global Params ---
    function updateGlobals() {
        if(!globalSliders.force) return;
        params.force = parseFloat(globalSliders.force.value);
        params.damping = parseFloat(globalSliders.damp.value);
        
        if(globalDisplays.force) {
            globalDisplays.force.textContent = params.force.toFixed(1) + " N";
            globalDisplays.damp.textContent = params.damping.toFixed(2);
        }
    }

    // --- Helper: Render UI List Partikel ---
    function renderParticleControls() {
        if(!particleListContainer) return;
        particleListContainer.innerHTML = ''; // Clear list

        particles.forEach((p, index) => {
            const item = document.createElement('div');
            item.className = "bg-slate-800/40 p-3 rounded border border-white/5 relative group transition-all hover:bg-slate-800/60";
            item.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-indigo-400">Partikel ${index + 1}</span>
                    ${particles.length > 1 ? `<button class="btn-remove text-red-400 hover:text-red-300 p-1" data-id="${p.id}"><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>` : ''}
                </div>
                <div class="space-y-2">
                    <div>
                        <div class="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Massa: <b class="text-slate-200">${p.m.toFixed(1)} kg</b></span>
                        </div>
                        <input type="range" class="inp-m w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" min="0.5" max="10" step="0.5" value="${p.m}" data-id="${p.id}">
                    </div>
                    <div>
                        <div class="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Radius: <b class="text-slate-200">${p.r} px</b></span>
                        </div>
                        <input type="range" class="inp-r w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" min="20" max="250" step="10" value="${p.r}" data-id="${p.id}">
                    </div>
                </div>
            `;
            particleListContainer.appendChild(item);
        });

        // Re-attach listeners for new inputs
        document.querySelectorAll('.inp-m').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const id = parseInt(e.target.dataset.id);
                const p = particles.find(x => x.id === id);
                if(p) { p.m = parseFloat(e.target.value); renderParticleControls(); } // Re-render to update text value
            });
        });
        document.querySelectorAll('.inp-r').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const id = parseInt(e.target.dataset.id);
                const p = particles.find(x => x.id === id);
                if(p) { p.r = parseFloat(e.target.value); renderParticleControls(); }
            });
        });
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                removeParticle(id);
            });
        });

        if(globalDisplays.count) globalDisplays.count.textContent = `${particles.length} Partikel`;
    }

    // --- Logic: Add/Remove ---
    function addParticle() {
        if(particles.length >= 10) {
            alert("Maksimal 10 partikel!");
            return;
        }
        // Randomize radius slightly for better visibility
        const newR = 50 + Math.floor(Math.random() * 150);
        particles.push({ id: Date.now(), m: 2.0, r: newR });
        renderParticleControls();
    }

    function removeParticle(id) {
        if(particles.length <= 1) return;
        particles = particles.filter(p => p.id !== id);
        renderParticleControls();
    }

    // --- Listeners ---
    globalSliders.force.addEventListener('input', updateGlobals);
    globalSliders.damp.addEventListener('input', updateGlobals);
    btnAdd.addEventListener('click', addParticle);
    
    const btnReset = document.getElementById('btn-reset');
    const resetFn = () => { state.angle = 0; state.angularVel = 0; };
    btnReset.addEventListener('click', resetFn);

    // --- Physics ---
    function updatePhysics(dt) {
        // 1. Hitung Inersia Total (Additif)
        // I_total = sum(m * r^2)
        let totalInertia = 0;
        let maxR = 0;

        particles.forEach(p => {
            // Kita bagi 1000 agar nilai inersia tidak terlalu raksasa untuk simulasi pixel
            totalInertia += p.m * (p.r * p.r);
            if(p.r > maxR) maxR = p.r;
        });
        
        // Simpan nilai asli untuk display, tapi gunakan scaling untuk kalkulasi gerak
        physics.totalInertia = totalInertia;
        const I_sim = totalInertia / 1000; 

        // 2. Hitung Torsi
        // Gaya diterapkan pada partikel terluar (maxR) agar torsi maksimal
        // Tau = r * F
        // Gunakan scaling /10 untuk visual agar tidak berputar terlalu gila
        const torque = params.force * (maxR / 10);
        physics.torque = params.force * maxR; // Nilai display asli

        // 3. Percepatan Sudut (Alpha = Tau / I)
        // Hindari pembagian nol
        const alpha = I_sim > 0 ? torque / I_sim : 0;
        physics.alpha = alpha;

        // 4. Integrasi Gerak
        const dragFactor = 1.0 - (params.damping * 0.05);
        state.angularVel = (state.angularVel + alpha * dt) * dragFactor;
        state.angle += state.angularVel * dt;
    }

    function drawArrow(ctx, startX, startY, angle, magnitude, color) {
        if (Math.abs(magnitude) < 0.1) return;
        const scale = 4; 
        const len = magnitude * scale;
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

    // --- Loop ---
    function loop(timestamp) {
        if (!isActive) return;
        if (!state.lastTime) state.lastTime = timestamp;
        const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
        state.lastTime = timestamp;

        updatePhysics(dt);

        // Update Stats
        if(globalDisplays.inertia) {
            globalDisplays.inertia.textContent = physics.totalInertia.toFixed(0);
            globalDisplays.omega.textContent = state.angularVel.toFixed(2);
            globalDisplays.torque.textContent = physics.torque.toFixed(1);
            globalDisplays.alpha.textContent = physics.alpha.toFixed(2);
        }

        // Render
        if(canvas.width === 0 || canvas.width !== canvas.parentElement.clientWidth) { 
            canvas.width = canvas.parentElement.clientWidth; 
            canvas.height = canvas.parentElement.clientHeight; 
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // Pusat Pivot
        ctx.fillStyle = "#cbd5e1"; 
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();

        ctx.rotate(state.angle);

        // Cari partikel terluar untuk menggambar vektor gaya nanti
        let maxR = 0;

        // Gambar Batang & Partikel
        // Urutkan berdasarkan radius agar gambar tumpukannya rapi (kecil di atas besar)
        const sortedParticles = [...particles].sort((a,b) => b.r - a.r);

        sortedParticles.forEach(p => {
            if(p.r > maxR) maxR = p.r;

            // Batang
            ctx.strokeStyle = `rgba(100, 116, 139, 0.5)`; 
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(p.r, 0); ctx.stroke();

            // Partikel
            ctx.fillStyle = `hsl(${200 + (p.id % 60)}, 70%, 50%)`; // Variasi warna sedikit
            ctx.beginPath(); 
            ctx.arc(p.r, 0, 5 + p.m * 1.5, 0, Math.PI*2); 
            ctx.fill();

            // Text info (opsional, jika terlalu ramai bisa dihapus)
            /*
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = "10px sans-serif";
            ctx.fillText(p.m + "kg", p.r - 10, -10);
            */
        });

        // Gambar Vektor Gaya pada partikel terluar
        if(maxR > 0) {
            drawArrow(ctx, maxR, 0, 0, params.force, "#fbbf24");
        }

        ctx.restore();
        animationFrameId = requestAnimationFrame(loop);
    }

    // Init
    updateGlobals();
    renderParticleControls();
    animationFrameId = requestAnimationFrame(loop);

    // Cleanup
    return function stop() {
        isActive = false;
        cancelAnimationFrame(animationFrameId);
        // Hapus listener manual jika perlu, atau biarkan GC bekerja karena elemen parent dihapus/hidden
        btnAdd.removeEventListener('click', addParticle);
        btnReset.removeEventListener('click', resetFn);
    };
}
