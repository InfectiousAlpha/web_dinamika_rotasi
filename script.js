// ==========================================
// MAIN CONTROLLER
// Mengelola UI, Background, dan Pemilihan Simulasi
// ==========================================

import { initRollingSim } from './sim_rolling.js';
import { initRigidSim } from './sim_rigid.js';

// --- State Manager ---
let currentStopFn = null; 

// --- UI Elements ---
const tabRolling = document.getElementById('tab-rolling');
const tabRigid = document.getElementById('tab-rigid');
const infoRolling = document.getElementById('info-rolling');
const infoRigid = document.getElementById('info-rigid');
const controlsRolling = document.getElementById('controls-rolling');
const controlsRigid = document.getElementById('controls-rigid');
const statsRolling = document.getElementById('stats-rolling');
const statsRigid = document.getElementById('stats-rigid');
const simBorder = document.getElementById('sim-border-color');

// --- Switch Logic ---
function switchSim(simName) {
    if (currentStopFn) {
        currentStopFn();
        currentStopFn = null;
    }

    const canvas = document.getElementById('sim-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (simName === 'rolling') {
        tabRolling.classList.replace('bg-slate-800', 'bg-green-600');
        tabRolling.classList.replace('text-slate-400', 'text-white');
        tabRolling.classList.add('shadow-lg');
        
        tabRigid.classList.replace('bg-green-600', 'bg-slate-800');
        tabRigid.classList.replace('text-white', 'text-slate-400');
        tabRigid.classList.remove('shadow-lg');

        infoRolling.classList.remove('hidden');
        infoRigid.classList.add('hidden');
        
        controlsRolling.classList.remove('hidden');
        controlsRigid.classList.add('hidden');

        statsRolling.classList.remove('hidden');
        statsRigid.classList.add('hidden');

        simBorder.classList.replace('border-l-teal-500', 'border-l-purple-500'); 
        currentStopFn = initRollingSim('sim-canvas');

    } else if (simName === 'rigid') {
        tabRigid.classList.replace('bg-slate-800', 'bg-green-600');
        tabRigid.classList.replace('text-slate-400', 'text-white');
        tabRigid.classList.add('shadow-lg');

        tabRolling.classList.replace('bg-green-600', 'bg-slate-800');
        tabRolling.classList.replace('text-white', 'text-slate-400');
        tabRolling.classList.remove('shadow-lg');

        infoRigid.classList.remove('hidden');
        infoRolling.classList.add('hidden');

        controlsRigid.classList.remove('hidden');
        controlsRolling.classList.add('hidden');

        statsRigid.classList.remove('hidden');
        statsRolling.classList.add('hidden');

        simBorder.classList.replace('border-l-purple-500', 'border-l-teal-500'); 
        currentStopFn = initRigidSim('sim-canvas');
    }
}

// --- Event Listeners ---
if(tabRolling) tabRolling.addEventListener('click', () => switchSim('rolling'));
if(tabRigid) tabRigid.addEventListener('click', () => switchSim('rigid'));

// --- Background Effect ---
const bgCanvas = document.getElementById('bg-canvas');
if (bgCanvas) {
    const bgCtx = bgCanvas.getContext('2d');
    let width, height, particles = [];

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

// --- Start ---
window.onload = function() {
    switchSim('rolling');
};
