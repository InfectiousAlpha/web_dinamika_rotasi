🌀 Rotational Dynamics (Dinamika Rotasi) - Interactive Lab
A modern, web-based interactive physics simulation designed to teach the fundamental concepts of Rotational Dynamics. Built with vanilla JavaScript (ES6 Modules), HTML5 Canvas, and Tailwind CSS.
🚀 Overview
This project provides a virtual laboratory where users can experiment with torque, moment of inertia, and angular acceleration in real-time. It features a responsive, "glassmorphism" UI and three distinct simulation modes.
✨ Features
1. Single Particle Rotation
* Concept: Newton's Second Law for Rotation (  ).
* Interaction: Control the mass, radius, and tangential force applied to a single particle.
* Visualization: Real-time rendering of force vectors and angular velocity.
2. Rigid Rotor System (2D)
   * Concept: Combined translational and rotational motion.
   * Interaction: Manipulate a rigid rod with two masses. Apply different forces to each end to see how the Center of Mass moves while the object spins.
   * Physics: Includes damping (air resistance) and wall collision mechanics.
3. Multi-Particle System
   * Concept: Additive Moment of Inertia (  ).
   * Interaction: Dynamically add or remove particles to the system.
   * Analysis: Observe how the distribution of mass affects the total inertia and the torque required to spin the system.
🛠️ Tech Stack
      * Core: HTML5, CSS3, JavaScript (ES6 Modules).
      * Rendering: HTML5 Canvas API (2D Context).
      * Styling: Tailwind CSS (via CDN) & Custom CSS.
      * Math Rendering: MathJax for LaTeX formula display.
      * Design: Glassmorphism UI, Dark Mode theme, Responsive layout.
📂 Project Structure
web_dinamika_rotasi/
├── index.html              # Main entry point, UI layout, and MathJax config
├── style.css               # Custom styling, dark theme, and glass effects
├── script.js               # Main controller, tab switching, and background effects
├── sim_single_particle.js  # Logic for Simulation 1 (Single Mass)
├── sim_rigid.js            # Logic for Simulation 2 (Rigid Body Physics)
├── sim_multi_particle.js   # Logic for Simulation 3 (Dynamic Array of Particles)
└── README.md               # Project documentation

🚀 How to Run
⚠️ Important: Because this project uses JavaScript ES6 Modules (type="module" in index.html), you cannot simply double-click the index.html file to run it. Browsers block module requests from the local file system (file://) for security reasons (CORS).
You must use a local development server.
Option 1: VS Code (Recommended)
      1. Install the "Live Server" extension by Ritwick Dey in VS Code.
      2. Right-click index.html and select "Open with Live Server".
Option 2: Python
If you have Python installed, open your terminal in the project folder and run:
# Python 3
python -m http.server 8000

Then open http://localhost:8000 in your browser.
Option 3: Node.js (http-server)
npx http-server .

🧮 Physics Formulas Used
The simulations rely on the following core physics principles:
      1. Torque (  ):
  
(Force applied at a distance from the pivot)
      2. Moment of Inertia (  ):
         * Single Particle:   
         * Discrete System:   
            3. Angular Acceleration (  ):
  
🎨 UI Controls
               * Sliders: Adjust Mass (  ), Radius (  ), Force (  ), and Damping (Air Resistance).
               * Tabs: Switch between different experiments instantly.
               * Stats Panel: Real-time numerical readout of Inertia, Angular Velocity (  ), and Net Torque.
               * Dynamic Lists: In Simulation 3, use the "+ Tambah Partikel" button to add new masses to the system.
📝 License
This project is open-source and available for educational purposes.
