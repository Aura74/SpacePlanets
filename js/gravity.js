/* ============================================
   GRAVITATIONSLABB – Matter.js Fysikmotor
   Realistisk gravitation med CSS-liknande effekter
   ============================================ */

(function () {
    'use strict';

    // Matter.js moduler
    const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Composite = Matter.Composite,
        Mouse = Matter.Mouse,
        MouseConstraint = Matter.MouseConstraint,
        Events = Matter.Events;

    let engine, render, runner, mouseConstraint;
    let currentGravityY = 1.62 / 9.82; // Normalisera till Matter.js skala (Månen default)
    let isInitialized = false;
    const balls = [];
    const MAX_BALLS = 80;

    // Färgpalett för bollar
    const ballColors = [
        '#ff6b6b', '#ffd700', '#00d4ff', '#6c63ff',
        '#ff8c00', '#00ff88', '#ff69b4', '#8b5cf6',
        '#22d3ee', '#f472b6', '#fb923c', '#a3e635',
        '#e879f9', '#38bdf8', '#facc15', '#4ade80'
    ];

    // Emoji-objekt att släppa
    const objectTypes = [
        { type: 'circle', label: '' },
        { type: 'circle', label: '' },
        { type: 'circle', label: '' },
        { type: 'circle', label: '' }
    ];

    function getRandomColor() {
        return ballColors[Math.floor(Math.random() * ballColors.length)];
    }

    function initGravity() {
        const canvas = document.getElementById('gravityCanvas');
        if (!canvas) return;

        const wrapper = canvas.parentElement;
        const width = wrapper.clientWidth;
        const height = 450;

        canvas.width = width;
        canvas.height = height;

        // Skapa motor
        engine = Engine.create({
            gravity: { x: 0, y: currentGravityY }
        });

        // Skapa renderer
        render = Render.create({
            canvas: canvas,
            engine: engine,
            options: {
                width: width,
                height: height,
                background: 'transparent',
                wireframes: false,
                pixelRatio: window.devicePixelRatio || 1
            }
        });

        // Skapa väggar (osynliga kanter)
        const wallThickness = 60;
        const wallOptions = {
            isStatic: true,
            render: { visible: false },
            friction: 0.3,
            restitution: 0.6
        };

        const ground = Bodies.rectangle(width / 2, height + wallThickness / 2 - 5, width + 100, wallThickness, {
            ...wallOptions,
            render: {
                visible: true,
                fillStyle: 'rgba(108, 99, 255, 0.1)',
                strokeStyle: 'rgba(108, 99, 255, 0.3)',
                lineWidth: 2
            }
        });

        const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, wallOptions);
        const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, wallOptions);
        const ceiling = Bodies.rectangle(width / 2, -wallThickness / 2, width + 100, wallThickness, wallOptions);

        Composite.add(engine.world, [ground, leftWall, rightWall, ceiling]);

        // Lägg till lite plattformar för att studsa på
        const platform1 = Bodies.rectangle(width * 0.25, height * 0.55, 120, 12, {
            isStatic: true,
            angle: 0.15,
            render: {
                fillStyle: 'rgba(0, 212, 255, 0.15)',
                strokeStyle: 'rgba(0, 212, 255, 0.4)',
                lineWidth: 2
            },
            friction: 0.2,
            restitution: 0.7
        });

        const platform2 = Bodies.rectangle(width * 0.75, height * 0.4, 120, 12, {
            isStatic: true,
            angle: -0.15,
            render: {
                fillStyle: 'rgba(0, 212, 255, 0.15)',
                strokeStyle: 'rgba(0, 212, 255, 0.4)',
                lineWidth: 2
            },
            friction: 0.2,
            restitution: 0.7
        });

        Composite.add(engine.world, [platform1, platform2]);

        // Mus-interaktion
        const mouse = Mouse.create(canvas);
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: true,
                    strokeStyle: 'rgba(0, 212, 255, 0.3)',
                    lineWidth: 2
                }
            }
        });

        // Fix scrollning
        mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
        mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);

        Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;

        // Klick-event för att skapa bollar
        Events.on(mouseConstraint, 'mousedown', function (event) {
            const { x, y } = event.mouse.position;
            // Bara skapa boll om vi inte drar i en befintlig
            if (!mouseConstraint.body) {
                createBall(x, y);
            }
        });

        // Starta
        Render.run(render);
        runner = Runner.create();
        Runner.run(runner, engine);

        // Anpassad rendering ovanpå Matter.js
        Events.on(render, 'afterRender', function () {
            drawCustomEffects(render.context, width, height);
        });

        isInitialized = true;

        // Lägg till intro-bollar
        setTimeout(() => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    createBall(
                        width * 0.2 + Math.random() * width * 0.6,
                        50 + Math.random() * 50
                    );
                }, i * 200);
            }
        }, 500);
    }

    function createBall(x, y, options = {}) {
        if (balls.length >= MAX_BALLS) {
            // Ta bort äldsta bollen
            const oldBall = balls.shift();
            Composite.remove(engine.world, oldBall);
        }

        const radius = options.radius || 12 + Math.random() * 18;
        const color = options.color || getRandomColor();

        const ball = Bodies.circle(x, y, radius, {
            restitution: 0.7 + Math.random() * 0.25, // Studsighet
            friction: 0.05,
            frictionAir: 0.001,
            density: 0.001 + Math.random() * 0.002,
            render: {
                fillStyle: color,
                strokeStyle: 'rgba(255, 255, 255, 0.3)',
                lineWidth: 2
            }
        });

        // Ge en liten slumpmässig initial hastighet
        Body.setVelocity(ball, {
            x: (Math.random() - 0.5) * 3,
            y: Math.random() * -2
        });

        balls.push(ball);
        Composite.add(engine.world, ball);

        return ball;
    }

    function drawCustomEffects(ctx, width, height) {
        // Rita glow-effekter för bollar
        balls.forEach(ball => {
            if (!ball.position) return;
            const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
            const glowIntensity = Math.min(speed / 10, 1);

            if (glowIntensity > 0.1) {
                ctx.save();
                ctx.globalAlpha = glowIntensity * 0.3;
                ctx.beginPath();
                ctx.arc(ball.position.x, ball.position.y, ball.circleRadius + 8, 0, Math.PI * 2);
                ctx.fillStyle = ball.render.fillStyle;
                ctx.fill();
                ctx.restore();
            }
        });

        // Rita gravitationstext i hörnet
        ctx.save();
        ctx.font = '12px Orbitron, sans-serif';
        ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.textAlign = 'right';
        ctx.fillText(`Bollar: ${balls.length}/${MAX_BALLS}`, width - 15, 25);
        ctx.restore();
    }

    function setGravity(value, name) {
        if (!engine) return;
        currentGravityY = value / 9.82; // Normalisera

        if (value === 0) {
            // Rymd-läge: Ingen gravitation
            engine.gravity.y = 0;
            engine.gravity.x = 0;
            // Ge alla bollar lite slumpmässig rörelse
            balls.forEach(ball => {
                Body.setVelocity(ball, {
                    x: (Math.random() - 0.5) * 4,
                    y: (Math.random() - 0.5) * 4
                });
            });
        } else {
            engine.gravity.y = currentGravityY;
            engine.gravity.x = 0;
        }

        // Uppdatera label
        const label = document.getElementById('gravityLabel');
        if (label) {
            label.textContent = `${name} (${value} m/s²)`;
        }
    }

    function clearAllBalls() {
        balls.forEach(ball => {
            Composite.remove(engine.world, ball);
        });
        balls.length = 0;
    }

    function rainBalls() {
        if (!engine) return;
        const canvas = document.getElementById('gravityCanvas');
        if (!canvas) return;
        const width = canvas.width;

        let count = 0;
        const interval = setInterval(() => {
            if (count >= 20) {
                clearInterval(interval);
                return;
            }
            createBall(
                50 + Math.random() * (width - 100),
                20 + Math.random() * 30,
                { radius: 8 + Math.random() * 15 }
            );
            count++;
        }, 80);
    }

    // Resize-hantering
    function handleResize() {
        if (!render) return;
        const canvas = document.getElementById('gravityCanvas');
        if (!canvas) return;
        const wrapper = canvas.parentElement;
        const width = wrapper.clientWidth;
        const height = 450;

        render.canvas.width = width;
        render.canvas.height = height;
        render.options.width = width;
        render.options.height = height;

        Render.setPixelRatio(render, window.devicePixelRatio || 1);
    }

    // Event listeners för kontroller
    function setupControls() {
        // Gravitations-knappar
        document.querySelectorAll('.gravity-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.gravity-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const gravity = parseFloat(this.dataset.gravity);
                const name = this.dataset.name;
                setGravity(gravity, name);
            });
        });

        // Rensa bollar
        const clearBtn = document.getElementById('clearBalls');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllBalls);
        }

        // Bollregn
        const rainBtn = document.getElementById('rainBalls');
        if (rainBtn) {
            rainBtn.addEventListener('click', rainBalls);
        }

        // Resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 250);
        });
    }

    // Initiera när sektionen blir synlig (Intersection Observer)
    function observeGravitySection() {
        const section = document.getElementById('gravity');
        if (!section) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isInitialized) {
                    initGravity();
                    setupControls();
                    observer.unobserve(section);
                }
            });
        }, { threshold: 0.2 });

        observer.observe(section);
    }

    // Exportera init-funktion
    window.GravityLab = {
        init: observeGravitySection,
        setGravity: setGravity,
        clear: clearAllBalls,
        rain: rainBalls
    };

    // Starta observering direkt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeGravitySection);
    } else {
        observeGravitySection();
    }

})();
