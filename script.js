// ==========================================
// MAIN CONTROLLER
// Mengelola UI, Background, dan Pemilihan Simulasi
// ==========================================

// 1. IMPORT MODUL SIMULASI
import { initRollingSim } from './sim_rolling.js';
import { initRigidSim } from './sim_rigid.js';

// 2. JALANKAN SIMULASI YANG DIINGINKAN
// ----------------------------------------------------
// PENTING: Karena HTML saat ini disetup dengan kontrol
// slider untuk Rigid Rotor (Massa 1, Massa 2, dll), 
// kita jalankan initRigidSim().
//
// Jika ingin menjalankan Rolling Sim, Anda harus:
// 1. Mengubah HTML (index.html) agar memiliki kontrol slider 
//    yang sesuai (Gravitasi, Koefisien Gesek, Sudut).
// 2. Mengganti baris di bawah menjadi initRollingSim('sim-canvas');
// ----------------------------------------------------

// Jalankan Simulasi 2 (Rigid Rotor)
initRigidSim('sim-canvas');

// Opsional: Jalankan Simulasi 1 (Akan gagal/warn jika HTML tidak sesuai)
// initRollingSim('sim-canvas');


// ==========================================
// 3. LOGIKA UI & LATAR BELAKANG (SHARED)
// ==========================================

// --- Background Particles ---
const bgCanvas = document.getElementById('bg-canvas');
if (bgCanvas) {
    const bgCtx = bgCanvas.getContext('2d');
    let width, height;
    let particles = [];

    function resizeBg() {
        width = bgCanvas.width = window.innerWidth;
        height = bgCanvas.height = window.innerHeight;
        initParticles();
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
            this.color = `rgba(34, 197, 94, ${Math.random() * 0.2 + 0.05})`;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            bgCtx.fillStyle = this.color;
            bgCtx.beginPath(); bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2); bgCtx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const count = Math.min(Math.floor(window.innerWidth / 10), 100);
        for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    function animateParticles() {
        bgCtx.clearRect(0, 0, width, height);
        particles.forEach((p, index) => {
            p.update(); p.draw();
            for (let j = index + 1; j < particles.length; j++) {
                const dx = p.x - particles[j].x;
                const dy = p.y - particles[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 150) {
                    bgCtx.beginPath();
                    bgCtx.strokeStyle = `rgba(34, 197, 94, ${0.05 * (1 - dist / 150)})`;
                    bgCtx.moveTo(p.x, p.y); bgCtx.lineTo(particles[j].x, particles[j].y); bgCtx.stroke();
                }
            }
        });
        requestAnimationFrame(animateParticles);
    }

    window.addEventListener('resize', resizeBg);
    resizeBg();
    animateParticles();
}

// --- Scroll Reveal ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
    });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
