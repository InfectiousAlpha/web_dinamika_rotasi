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
// 3. Physics Simulation (Rolling Cylinder)
// ==========================================
(function() {
    // --- Simulation Constants ---
    const PIXELS_PER_METER = 40;
    const CYLINDER_RADIUS = 25; // in pixels visually

    // --- State ---
    let params = {
        g: 9.8,
        m: 5.0,
        mu_s: 0.5,
        mu_k: 0.3,
        theta: 15.0
    };

    let state = {
        pos: 0.0, // position along incline (meters)
        vel: 0.0, // velocity (m/s)
        rotation_angle: 0.0, // visual rotation (radians)
        lastTime: 0,
        is_slipping: false
    };

    let physics_output = {
        accel: 0,
        friction: 0,
        torque: 0,
        normal: 0,
        weight: 0,
        mode: "Diam"
    };

    // --- DOM Elements ---
    const canvas = document.getElementById('sim-canvas');
    
    // Guard clause if canvas doesn't exist (e.g. on other pages)
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const sliders = {
        g: document.getElementById('slider-g'),
        m: document.getElementById('slider-m'),
        mus: document.getElementById('slider-mus'),
        muk: document.getElementById('slider-muk'),
        theta: document.getElementById('slider-theta')
    };
    const displays = {
        g: document.getElementById('val-g'),
        m: document.getElementById('val-m'),
        mus: document.getElementById('val-mus'),
        muk: document.getElementById('val-muk'),
        theta: document.getElementById('val-theta'),
        state: document.getElementById('stat-state'),
        vel: document.getElementById('stat-vel'),
        acc: document.getElementById('stat-acc'),
        fg: document.getElementById('stat-fg'),
        f: document.getElementById('stat-f'),
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
        params.g = parseFloat(sliders.g.value);
        params.m = parseFloat(sliders.m.value);
        params.mu_s = parseFloat(sliders.mus.value);
        params.mu_k = parseFloat(sliders.muk.value);
        params.theta = parseFloat(sliders.theta.value);

        displays.g.textContent = params.g.toFixed(1) + " m/s²";
        displays.m.textContent = params.m.toFixed(1) + " kg";
        displays.mus.textContent = params.mu_s.toFixed(2);
        displays.muk.textContent = params.mu_k.toFixed(2);
        displays.theta.textContent = params.theta.toFixed(1) + "°";
    }

    Object.values(sliders).forEach(s => s.addEventListener('input', updateParams));
    document.getElementById('btn-reset').addEventListener('click', () => {
        state.pos = 0;
        state.vel = 0;
        state.rotation_angle = 0;
    });

    // --- Physics Core ---
    function updatePhysics(dt) {
        const rad = params.theta * Math.PI / 180;
        
        // Components
        const fg = params.m * params.g;
        const fg_parallel = fg * Math.sin(rad);
        const fg_normal = fg * Math.cos(rad);
        
        physics_output.weight = fg;
        physics_output.normal = fg_normal;

        // Inertia for Solid Cylinder: I = 1/2 m R^2
        // We use k = 0.5
        const k = 0.5;

        // Force calculations
        const f_req_rolling = (k * fg_parallel) / (1 + k);
        const f_max_static = params.mu_s * fg_normal;
        const f_kinetic = params.mu_k * fg_normal;

        let accel = 0;
        let friction = 0;
        let is_moving = false;

        if (params.theta > 0.1) {
            is_moving = true;
            // Check if it slips
            if (f_req_rolling <= f_max_static) {
                // Pure Rolling
                state.is_slipping = false;
                friction = f_req_rolling;
                accel = (params.g * Math.sin(rad)) / (1 + k);
                physics_output.mode = "Menggelinding Murni";
            } else {
                // Slipping (Rolling + Sliding)
                state.is_slipping = true;
                friction = f_kinetic; // Kinetic friction acts up the slope
                accel = (fg_parallel - friction) / params.m;
                physics_output.mode = "Menggelinding + Slip";
            }
        } else {
            state.is_slipping = false;
            physics_output.mode = "Diam";
        }

        // Update Kinematics
        state.vel += accel * dt;
        state.pos += state.vel * dt;

        // Update Rotation Angle
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

    function drawArrow(ctx, startX, startY, endX, endY, color, label) {
        if (Math.abs(startX - endX) < 1 && Math.abs(startY - endY) < 1) return;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLen = 10;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI/6), endY - headLen * Math.sin(angle - Math.PI/6));
        ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI/6), endY - headLen * Math.sin(angle + Math.PI/6));
        ctx.fill();
        if(label) {
            ctx.font = "bold 14px Consolas";
            ctx.fillText(label, endX + 10, endY + 10);
        }
    }

    function loop(timestamp) {
        if (!state.lastTime) state.lastTime = timestamp;
        const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
        state.lastTime = timestamp;

        updatePhysics(dt);

        // UI Updates
        displays.state.textContent = physics_output.mode;
        displays.state.style.color = state.is_slipping ? '#f87171' : '#4ade80';
        displays.vel.textContent = state.vel.toFixed(2) + " m/s";
        displays.acc.textContent = physics_output.accel.toFixed(2) + " m/s²";
        displays.fg.textContent = physics_output.weight.toFixed(1) + " N";
        displays.f.textContent = physics_output.friction.toFixed(1) + " N";
        displays.torque.textContent = physics_output.torque.toFixed(2) + " Nm";

        // Render
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 + 100;
        const rad = params.theta * Math.PI / 180;

        ctx.save();
        ctx.translate(cx, cy);

        // Rotate World
        ctx.rotate(-rad);

        // Draw Incline
        ctx.fillStyle = "#3f3f46"; 
        ctx.fillRect(-1000, 0, 2000, 400); 
        ctx.fillStyle = "#22c55e"; 
        ctx.fillRect(-1000, 0, 2000, 4); 

        // Draw Distance Markers
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;
        const spacing = 100;
        const offset = (state.pos * PIXELS_PER_METER) % spacing;
        for(let i = -10; i < 10; i++) {
            let x = i * spacing - offset;
            if(x > -cx - 500 && x < cx + 500) {
                ctx.beginPath();
                ctx.moveTo(x, 4);
                ctx.lineTo(x, 14);
                ctx.stroke();
            }
        }

        // Draw Cylinder
        const cylY = -CYLINDER_RADIUS;
        ctx.translate(0, cylY); 
        
        ctx.save();
        ctx.rotate(state.rotation_angle); 
        
        // Body
        ctx.fillStyle = "#3b82f6";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, CYLINDER_RADIUS, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        // Spoke
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(CYLINDER_RADIUS, 0); 
        ctx.stroke();
        
        // Dot
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI*2);
        ctx.fill();
        
        ctx.restore(); 

        // Draw Forces (Vectors)
        const scale = 3.0;

        // Friction
        drawArrow(ctx, 0, CYLINDER_RADIUS, -physics_output.friction * scale, CYLINDER_RADIUS, "#fb923c", "f"); 

        // Weight Components
        const W_par = physics_output.weight * Math.sin(rad); 
        const W_norm = physics_output.weight * Math.cos(rad);
        drawArrow(ctx, 0, 0, W_par * scale, W_norm * scale, "#d8b4fe", "w");

        // Normal Force
        drawArrow(ctx, 0, CYLINDER_RADIUS, 0, CYLINDER_RADIUS - physics_output.normal * scale, "#ffffff", "N");

        ctx.restore(); 
        requestAnimationFrame(loop);
    }

    updateParams();
    requestAnimationFrame(loop);
})();
