// ==========================================
// MAIN CONTROLLER
// Mengelola UI, Background, dan Pemilihan Simulasi
// ==========================================

import { initSingleParticleSim } from './sim_single_particle.js'; 
import { initRigidSim } from './sim_rigid.js';
import { initMultiParticleSim } from './sim_multi_particle.js'; // Added Import

// --- State Manager ---
let currentStopFn = null; 

// --- UI Elements ---
const tabSingle = document.getElementById('tab-single');
const tabRigid = document.getElementById('tab-rigid');
const tabMulti = document.getElementById('tab-multi'); // Added Tab

const infoSingle = document.getElementById('info-single');
const infoRigid = document.getElementById('info-rigid');
const infoMulti = document.getElementById('info-multi'); // Added Info

const controlsSingle = document.getElementById('controls-single');
const controlsRigid = document.getElementById('controls-rigid');
const controlsMulti = document.getElementById('controls-multi'); // Added Controls

const statsSingle = document.getElementById('stats-single');
const statsRigid = document.getElementById('stats-rigid');
const statsMulti = document.getElementById('stats-multi'); // Added Stats

const simBorder = document.getElementById('sim-border-color');

// --- Switch Logic ---
function switchSim(simName) {
    // 1. Hentikan simulasi sebelumnya
    if (currentStopFn) {
        currentStopFn();
        currentStopFn = null;
    }

    // 2. Bersihkan Canvas
    const canvas = document.getElementById('sim-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 3. Reset UI Styles (Helper Function)
    function resetTab(tab) {
        tab.classList.replace('bg-green-600', 'bg-slate-800');
        tab.classList.replace('text-white', 'text-slate-400');
        tab.classList.remove('shadow-lg');
    }
    function activeTab(tab) {
        tab.classList.replace('bg-slate-800', 'bg-green-600');
        tab.classList.replace('text-slate-400', 'text-white');
        tab.classList.add('shadow-lg');
    }

    resetTab(tabSingle);
    resetTab(tabRigid);
    if(tabMulti) resetTab(tabMulti);

    infoSingle.classList.add('hidden');
    infoRigid.classList.add('hidden');
    infoMulti.classList.add('hidden');

    controlsSingle.classList.add('hidden');
    controlsRigid.classList.add('hidden');
    controlsMulti.classList.add('hidden');

    statsSingle.classList.add('hidden');
    statsRigid.classList.add('hidden');
    statsMulti.classList.add('hidden');

    // 4. Activate Specific Sim
    if (simName === 'single') {
        activeTab(tabSingle);
        infoSingle.classList.remove('hidden');
        controlsSingle.classList.remove('hidden');
        statsSingle.classList.remove('hidden');
        simBorder.classList.remove('border-l-teal-500', 'border-l-indigo-500'); 
        simBorder.classList.add('border-l-purple-500'); 

        currentStopFn = initSingleParticleSim('sim-canvas');

    } else if (simName === 'rigid') {
        activeTab(tabRigid);
        infoRigid.classList.remove('hidden');
        controlsRigid.classList.remove('hidden');
        statsRigid.classList.remove('hidden');
        simBorder.classList.remove('border-l-purple-500', 'border-l-indigo-500'); 
        simBorder.classList.add('border-l-teal-500'); 

        currentStopFn = initRigidSim('sim-canvas');

    } else if (simName === 'multi') {
        if(tabMulti) activeTab(tabMulti);
        infoMulti.classList.remove('hidden');
        controlsMulti.classList.remove('hidden');
        statsMulti.classList.remove('hidden');
        simBorder.classList.remove('border-l-purple-500', 'border-l-teal-500'); 
        simBorder.classList.add('border-l-indigo-500'); 

        currentStopFn = initMultiParticleSim('sim-canvas');
    }
}

// --- Event Listeners ---
if(tabSingle) tabSingle.addEventListener('click', () => switchSim('single'));
if(tabRigid) tabRigid.addEventListener('click', () => switchSim('rigid'));
if(tabMulti) tabMulti.addEventListener('click', () => switchSim('multi'));

// --- Initial Load ---
switchSim('single'); // Start with single particle

// --- BACKGROUND EFFECT (Keep as is) ---
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

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
    });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
