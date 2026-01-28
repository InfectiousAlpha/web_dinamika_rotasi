// ==========================================
// MODUL SIMULASI 4: Aproksimasi Batang (Integral)
// ==========================================

export function initRodApproxSim(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    
    // --- State ---
    // N: Jumlah partikel (slices)
    let params = { M: 2.0, L: 200, N: 5 }; 
    let results = { I_approx: 0, I_exact: 0, error: 0 };

    // --- DOM Elements ---
    const sliders = {
        M: document.getElementById('slider-a-m'),
        L: document.getElementById('slider-a-l'),
        N: document.getElementById('slider-a-n')
    };
    
    const displays = {
        M: document.getElementById('val-a-m'),
        L: document.getElementById('val-a-l'),
        N: document.getElementById('val-a-n'),
        iApprox: document.getElementById('stat-a-approx'),
        iExact: document.getElementById('stat-a-exact'),
        error: document.getElementById('stat-a-error')
    };

    // --- Core Logic ---
    function calculate() {
        // 1. Hitung Teoritis (Batang diputar di ujung)
        // Rumus: I = 1/3 * M * L^2
        // Kita bagi 1000 untuk scaling visual agar angka tidak jutaan (konsisten dengan sim sebelumnya)
        results.I_exact = (1/3) * params.M * (params.L * params.L) / 1000;

        // 2. Hitung Aproksimasi (Penjumlahan Partikel Diskrit)
        // Kita membagi batang menjadi N segmen.
        // Massa tiap partikel (dm) = Total Massa / N
        // Posisi tiap partikel (r) = titik tengah segmen tersebut
        
        const dm = params.M / params.N;
        const dr = params.L / params.N; // Panjang per segmen
        let sumInertia = 0;

        for (let i = 1; i <= params.N; i++) {
            // Posisi r diambil di tengah-tengah segmen (Midpoint Riemann Sum)
            // Contoh: L=100, N=2. Segmen 1 (0-50) -> r=25. Segmen 2 (50-100) -> r=75.
            let r = (i - 0.5) * dr;
            
            // I = m * r^2
            sumInertia += dm * (r * r);
        }

        results.I_approx = sumInertia / 1000; // Scaling
        
        // Hitung % Error
        if (results.I_exact !== 0) {
            results.error = Math.abs((results.I_approx - results.I_exact) / results.I_exact) * 100;
        }
    }

    function updateUI() {
        if (!displays.M) return;
        
        displays.M.textContent = params.M.toFixed(1) + " kg";
        displays.L.textContent = params.L.toFixed(0) + " px";
        displays.N.textContent = params.N + " partikel";

        // Update Hasil Perhitungan
        calculate();
        
        displays.iApprox.textContent = results.I_approx.toFixed(2);
        displays.iExact.textContent = results.I_exact.toFixed(2);
        
        // Error styling
        displays.error.textContent = results.error.toFixed(2) + "%";
        if (results.error < 1) displays.error.className = "text-right text-green-400 font-bold";
        else if (results.error < 5) displays.error.className = "text-right text-yellow-400 font-bold";
        else displays.error.className = "text-right text-red-400 font-bold";

        render();
    }

    function onInput() {
        params.M = parseFloat(sliders.M.value);
        params.L = parseFloat(sliders.L.value);
        params.N = parseInt(sliders.N.value);
        updateUI();
    }

    // Attach Listeners
    Object.values(sliders).forEach(s => {
        if(s) s.addEventListener('input', onInput);
    });

    // --- Rendering (Static) ---
    function render() {
        if (canvas.width !== canvas.parentElement.clientWidth) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2 - params.L / 2; // Start agak ke kiri agar batang centered
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);
        
        // 1. Gambar "Batang Ideal" (Bayangan di belakang)
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        // Gambar outline batang penuh
        ctx.strokeRect(cx, cy - 20, params.L, 40);
        ctx.fillRect(cx, cy - 20, params.L, 40);

        // Label Batang Ideal
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Bentuk Batang Ideal", cx + params.L/2, cy - 30);

        // 2. Gambar Partikel Aproksimasi
        const dr = params.L / params.N; // Lebar visual per partikel
        const particleColor = params.N > 50 ? "#f43f5e" : "#fb7185"; // Merah/Pink

        for (let i = 1; i <= params.N; i++) {
            // Posisi tengah segmen
            let r_center = (i - 0.5) * dr;
            let drawX = cx + r_center;

            ctx.fillStyle = particleColor;
            
            // Gambar partikel sebagai bola/lingkaran
            // Ukuran bola mengecil jika jumlah partikel sangat banyak agar muat
            let radius = Math.min(dr / 2 - 1, 15); 
            if (radius < 2) radius = dr/2; // Minimum size logic untuk N besar

            ctx.beginPath();
            ctx.arc(drawX, cy, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Titik Poros
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        
        // Axis Line
        ctx.strokeStyle = "#cbd5e1";
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(cx, cy - 50); ctx.lineTo(cx, cy + 50); ctx.stroke();
        ctx.setLineDash([]);
        
        // Text explanation on Canvas
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "left";
        ctx.fillText("Poros Rotasi", cx + 10, cy + 60);
    }

    // Init
    onInput();

    // Cleanup function
    return function stop() {
        Object.values(sliders).forEach(s => {
            if(s) s.removeEventListener('input', onInput);
        });
    };
}
