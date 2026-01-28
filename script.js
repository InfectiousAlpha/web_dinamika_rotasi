// ==========================================
// 1. Background Animation (Canvas)
// ==========================================
const bgCanvas = document.getElementById('bg-canvas');
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
        this.color = `rgba(34, 197, 94, ${Math.random() * 0.2 + 0.05})`; // Green tint
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        bgCtx.fillStyle = this.color;
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        bgCtx.fill();
    }
}

function initParticles() {
    particles = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 10), 100);
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    bgCtx.clearRect(0, 0, width, height);
    particles.forEach((p, index) => {
        p.update();
        p.draw();
        for (let j = index + 1; j < particles.length; j++) {
            const dx = p.x - particles[j].x;
            const dy = p.y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 150) {
                bgCtx.beginPath();
                bgCtx.strokeStyle = `rgba(34, 197, 94, ${0.05 * (1 - distance / 150)})`;
                bgCtx.lineWidth = 1;
                bgCtx.moveTo(p.x, p.y);
                bgCtx.lineTo(particles[j].x, particles[j].y);
                bgCtx.stroke();
            }
        }
    });
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', resizeBg);
resizeBg();
animateParticles();

// ==========================================
// 2. UI Interactions (Scroll, Tilt, Menu)
// ==========================================

// Scroll Reveal
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// 3D Tilt Effect
document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
});

// Mobile Menu
const menuBtn = document.getElementById('menu-btn');
const closeMenu = document.getElementById('close-menu');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

function toggleMenu() {
    mobileMenu.classList.toggle('translate-x-full');
    document.body.style.overflow = mobileMenu.classList.contains('translate-x-full') ? 'auto' : 'hidden';
}

if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
if (closeMenu) closeMenu.addEventListener('click', toggleMenu);
mobileLinks.forEach(link => link.addEventListener('click', toggleMenu));


// ==========================================
// 3. Physics Simulation (Rigid Rotor 2D)
// ==========================================
(function() {
    // --- Simulation Constants ---
    const TIME_STEP = 0.016; // Fixed step approximation

    // --- State ---
    let params = {
        m1: 2.0,
        m2: 2.0,
        L: 150,
        f1: 0.0,
        f2: 0.0
    };

    let state = {
        pos: { x: 0, y: 0 }, // Center of Mass position relative to canvas center
        vel: { x: 0, y: 0 }, // Velocity of Center of Mass
        angle: 0,            // Orientation angle (radians)
        angularVel: 0,       // Angular Velocity (rad/s)
        lastTime: 0
    };

    let physics_output = {
        inertia: 0,
        torque: 0,
        f_net_mag: 0
    };

    // --- DOM Elements ---
    const canvas = document.getElementById('sim-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
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

    function resize() {
        if (canvas && canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
    }
    window.addEventListener('resize', resize);
    resize();

    function updateParams() {
        params.m1 = parseFloat(sliders.m1.value);
        params.m2 = parseFloat(sliders.m2.value);
        params.L = parseFloat(sliders.len.value);
        params.f1 = parseFloat(sliders.f1.value);
        params.f2 = parseFloat(sliders.f2.value);

        displays.m1.textContent = params.m1.toFixed(1) + " kg";
        displays.m2.textContent = params.m2.toFixed(1) + " kg";
        displays.len.textContent = params.L.toFixed(0) + " px";
        displays.f1.textContent = params.f1.toFixed(1) + " N";
        displays.f2.textContent = params.f2.toFixed(1) + " N";
    }

    Object.values(sliders).forEach(s => s.addEventListener('input', updateParams));
    
    document.getElementById('btn-reset').addEventListener('click', () => {
        state.pos = { x: 0, y: 0 };
        state.vel = { x: 0, y: 0 };
        state.angle = 0;
        state.angularVel = 0;
    });

    // --- Physics Core ---
    function updatePhysics(dt) {
        // 1. Calculate Center of Mass properties
        const M = params.m1 + params.m2;
        
        // Distances from CM to particles
        // r1 is distance to m1, r2 is distance to m2
        // m1 * r1 = m2 * r2  AND  r1 + r2 = L
        const r1 = (params.m2 / M) * params.L;
        const r2 = (params.m1 / M) * params.L;

        // Moment of Inertia about CM
        const I = params.m1 * r1 * r1 + params.m2 * r2 * r2;
        physics_output.inertia = I;

        // 2. Forces and Torques (Local Frame -> World Frame)
        // Forces are applied perpendicular to the rod.
        // F1 vector in local frame: (0, -f1) if rod is along X.
        // F2 vector in local frame: (0, -f2).
        
        // We need to rotate these forces by 'angle' to get world components.
        // Force direction is Angle + 90 degrees (perpendicular)
        const forceDir = state.angle - Math.PI / 2;
        
        // F1 components (applied at particle 1)
        const F1x = params.f1 * Math.cos(forceDir);
        const F1y = params.f1 * Math.sin(forceDir);

        // F2 components (applied at particle 2)
        const F2x = params.f2 * Math.cos(forceDir);
        const F2y = params.f2 * Math.sin(forceDir);

        // Net Force (Translation)
        const F_net_x = F1x + F2x;
        const F_net_y = F1y + F2y;
        
        physics_output.f_net_mag = Math.sqrt(F_net_x*F_net_x + F_net_y*F_net_y);

        // Torque (Rotation) about CM
        // Torque = r x F. Since Forces are always perpendicular to r:
        // Tau1 = r1 * f1 (careful with signs/direction).
        // Let's define positive torque as Counter-Clockwise (CCW).
        // Visual setup: P1 is Left/Top, P2 is Right/Bottom usually?
        // Let's assume P1 is at angle + PI (left) and P2 is at angle (right) relative to CM locally?
        // No, let's stick to: P1 is at distance r1 "behind", P2 is r2 "ahead".
        // The force F1 is "up" in local frame. P1 is at local x = -r1. Torque = (-r1) * F1_y_local.
        // Wait, cross product r x F.
        // P1 vector from CM: magnitude r1, direction angle + PI.
        // P2 vector from CM: magnitude r2, direction angle.
        
        // Torque produced by F1:
        // P1 is at -r1 along rod. Force is "up" perpendicular.
        // This creates a clockwise torque if F1 is positive? 
        // Let's simplify: F1 pushes P1 "Forward" in rotation?
        // Let's say positive F pushes "Counter-Clockwise".
        // P1 is at -r1. Pushing it "up" (tangent) creates +Torque.
        // P2 is at +r2. Pushing it "up" (tangent) creates +Torque.
        // Wait, if both pushed "up" perpendicular, they translate.
        // To rotate, one goes up, one down.
        
        // Let's define the slider F as "Tangential Force".
        // P1 position relative to CM: (-r1, 0) rotated.
        // P2 position relative to CM: (+r2, 0) rotated.
        
        // To create positive rotation (CCW):
        // F1 must push in -Y local direction? No.
        // Let's define F1 slider: Positive = pushes "Left" relative to rod facing P1?
        // SIMPLER: F1 slider + : Pushes in direction of rotation +90 deg.
        // Torque 1 = F1 * r1.
        // Torque 2 = F2 * r2.
        
        // Actually, if F1 pushes in +90deg direction, and P1 is at -r1 (180deg),
        // Torque = r x F = (-r1) * (F1) = -r1*F1. (Clockwise).
        // P2 is at +r2 (0deg). Force +90deg.
        // Torque = r x F = (r2) * (F2) = +r2*F2. (Counter-Clockwise).
        
        // So Net Torque:
        const torque = (params.f2 * r2) - (params.f1 * r1);
        physics_output.torque = torque;

        // 3. Integration (Euler)
        // Linear
        const ax = F_net_x / M;
        const ay = F_net_y / M;
        
        // Drag (Simulate air resistance to stop it floating forever)
        const drag = 0.99;
        state.vel.x = (state.vel.x + ax * dt) * drag;
        state.vel.y = (state.vel.y + ay * dt) * drag;
        
        state.pos.x += state.vel.x * dt * 10; // *10 for pixel scaling visual speed
        state.pos.y += state.vel.y * dt * 10;

        // Angular
        const alpha = torque / I * 500; // Scaling for visual responsiveness
        const rotDrag = 0.98;
        state.angularVel = (state.angularVel + alpha * dt) * rotDrag;
        state.angle += state.angularVel * dt;

        // 4. Boundary Check (Bounce)
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
        
        const scale = 5; // Pixels per Newton visual
        const len = magnitude * scale;
        
        // End point
        const endX = startX + Math.cos(angle) * len;
        const endY = startY + Math.sin(angle) * len;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrow head
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

        // Updates UI Stats
        displays.inertia.textContent = physics_output.inertia.toFixed(0);
        displays.omega.textContent = state.angularVel.toFixed(2) + " rad/s";
        
        const v_mag = Math.sqrt(state.vel.x**2 + state.vel.y**2) * 10;
        displays.v.textContent = v_mag.toFixed(1) + " px/s";
        displays.fnet.textContent = physics_output.f_net_mag.toFixed(1) + " N";
        displays.torque.textContent = physics_output.torque.toFixed(1) + " Nm";

        // Render
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.save();
        ctx.translate(cx + state.pos.x, cy + state.pos.y);
        ctx.rotate(state.angle);

        // --- Draw System in Local Frame (rotated) ---
        
        const M = params.m1 + params.m2;
        const r1 = (params.m2 / M) * params.L;
        const r2 = (params.m1 / M) * params.L;

        // Rod
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-r1, 0);
        ctx.lineTo(r2, 0);
        ctx.stroke();

        // Particle 1 (Left/Negative Local X) - Blue
        const p1Size = 5 + params.m1 * 3;
        ctx.fillStyle = "#3b82f6"; // Blue
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#3b82f6";
        ctx.beginPath();
        ctx.arc(-r1, 0, p1Size, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Force 1 Vector (Applied at P1)
        // Force angle relative to rod is -90 deg (up in screen, but coordinate system y is down?)
        // Let's use the local frame drawing.
        // Force direction: Perpendicular to rod.
        // F1 positive slider -> pushes P1 "Up" (-Y in canvas).
        drawArrow(ctx, -r1, 0, -Math.PI/2, params.f1, "#60a5fa");

        // Particle 2 (Right/Positive Local X) - Orange
        const p2Size = 5 + params.m2 * 3;
        ctx.fillStyle = "#fb923c"; // Orange
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#fb923c";
        ctx.beginPath();
        ctx.arc(r2, 0, p2Size, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Force 2 Vector (Applied at P2)
        // F2 positive slider -> pushes P2 "Up" (-Y in canvas).
        drawArrow(ctx, r2, 0, -Math.PI/2, params.f2, "#fbbf24");

        // Center of Mass Marker
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI*2);
        ctx.fill();
        
        // Pivot/CM Label
        ctx.rotate(-state.angle); // Cancel rotation for text
        ctx.font = "10px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("CM", -6, 15);

        ctx.restore();

        requestAnimationFrame(loop);
    }

    updateParams();
    requestAnimationFrame(loop);
})();
