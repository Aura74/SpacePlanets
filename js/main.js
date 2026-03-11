/* ============================================
   RYMDÄVENTYRET – HUVUD-JAVASCRIPT
   Animationer, karuseller, interaktivitet
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // 1. LADDNINGSSKÄRM
    // ==========================================
    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 600);
            }, 1500);
        }
    });

    // ==========================================
    // 2. STJÄRNHIMMEL (Canvas)
    // ==========================================
    function initStarField() {
        const canvas = document.getElementById('starsCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height, stars, shootingStars;

        function resize() {
            width = canvas.width = canvas.parentElement.clientWidth;
            height = canvas.height = canvas.parentElement.clientHeight;
        }

        function createStars(count) {
            return Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2.5,
                speed: 0.02 + Math.random() * 0.08,
                opacity: Math.random(),
                twinkleSpeed: 0.005 + Math.random() * 0.02,
                twinkleDir: Math.random() > 0.5 ? 1 : -1
            }));
        }

        function createShootingStar() {
            return {
                x: Math.random() * width,
                y: Math.random() * height * 0.4,
                length: 60 + Math.random() * 80,
                speed: 8 + Math.random() * 12,
                angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
                opacity: 1,
                active: true
            };
        }

        resize();
        stars = createStars(250);
        shootingStars = [];

        // Slumpmässiga skjutstjärnor
        setInterval(() => {
            if (shootingStars.length < 2 && Math.random() > 0.6) {
                shootingStars.push(createShootingStar());
            }
        }, 3000);

        function animate() {
            ctx.clearRect(0, 0, width, height);

            // Rita stjärnor
            stars.forEach(star => {
                star.opacity += star.twinkleSpeed * star.twinkleDir;
                if (star.opacity >= 1) { star.opacity = 1; star.twinkleDir = -1; }
                if (star.opacity <= 0.1) { star.opacity = 0.1; star.twinkleDir = 1; }

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();

                // Glow för större stjärnor
                if (star.size > 1.5) {
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size + 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(180, 200, 255, ${star.opacity * 0.2})`;
                    ctx.fill();
                }
            });

            // Rita skjutstjärnor
            shootingStars = shootingStars.filter(ss => {
                if (!ss.active) return false;

                ss.x += Math.cos(ss.angle) * ss.speed;
                ss.y += Math.sin(ss.angle) * ss.speed;
                ss.opacity -= 0.015;

                if (ss.opacity <= 0 || ss.x > width + 100 || ss.y > height + 100) {
                    return false;
                }

                const tailX = ss.x - Math.cos(ss.angle) * ss.length;
                const tailY = ss.y - Math.sin(ss.angle) * ss.length;

                const gradient = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
                gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
                gradient.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity})`);

                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(ss.x, ss.y);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Ljusstark spets
                ctx.beginPath();
                ctx.arc(ss.x, ss.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${ss.opacity})`;
                ctx.fill();

                return true;
            });

            requestAnimationFrame(animate);
        }

        animate();

        window.addEventListener('resize', () => {
            resize();
            stars = createStars(250);
        });
    }

    // ==========================================
    // 3. NAVIGATION
    // ==========================================
    function initNavigation() {
        const navbar = document.getElementById('navbar');
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        const navLinks = document.querySelectorAll('.nav-link');

        // Scroll-effekt
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Mobil meny-toggle
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Stäng meny vid klick på länk
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Aktiv nav-länk baserat på scroll
        const sections = document.querySelectorAll('section[id]');
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY + 150;
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        });
    }

    // ==========================================
    // 4. TILLBAKA TILL TOPPEN
    // ==========================================
    function initBackToTop() {
        const btn = document.getElementById('backToTop');
        if (!btn) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==========================================
    // 5. SWIPER KARUSELLER
    // ==========================================
    function initSwipers() {
        // Månlandningar-karusell
        if (document.querySelector('.landing-swiper')) {
            new Swiper('.landing-swiper', {
                slidesPerView: 1,
                spaceBetween: 30,
                loop: true,
                autoplay: {
                    delay: 6000,
                    disableOnInteraction: true,
                },
                pagination: {
                    el: '.landing-swiper .swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.landing-swiper .swiper-button-next',
                    prevEl: '.landing-swiper .swiper-button-prev',
                },
                breakpoints: {
                    768: { slidesPerView: 1 },
                    992: { slidesPerView: 2, spaceBetween: 25 }
                }
            });
        }

        // Roliga fakta-karusell
        if (document.querySelector('.facts-swiper')) {
            new Swiper('.facts-swiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                loop: true,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: true,
                },
                pagination: {
                    el: '.facts-swiper .swiper-pagination',
                    clickable: true,
                },
                breakpoints: {
                    576: { slidesPerView: 2 },
                    992: { slidesPerView: 3, spaceBetween: 25 }
                }
            });
        }
    }

    // ==========================================
    // 6. AOS SCROLL-ANIMATIONER
    // ==========================================
    function initAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-out-cubic',
                once: true,
                offset: 50,
                disable: window.innerWidth < 768 ? 'phone' : false
            });
        }
    }

    // ==========================================
    // 7. PLANET-KORT EXPANDERING
    // ==========================================
    function initPlanetCards() {
        const cards = document.querySelectorAll('.planet-card');
        cards.forEach(card => {
            const content = card.querySelector('.planet-card-content');
            const desc = card.querySelector('.planet-desc');
            const funFact = card.querySelector('.planet-fun-fact');

            if (desc) desc.style.display = 'none';
            if (funFact) funFact.style.display = 'none';

            card.addEventListener('click', () => {
                const isOpen = card.classList.contains('expanded');

                // Stäng alla andra
                cards.forEach(c => {
                    c.classList.remove('expanded');
                    const d = c.querySelector('.planet-desc');
                    const f = c.querySelector('.planet-fun-fact');
                    if (d) d.style.display = 'none';
                    if (f) f.style.display = 'none';
                });

                if (!isOpen) {
                    card.classList.add('expanded');
                    if (desc) {
                        desc.style.display = 'block';
                        desc.style.animation = 'fadeSlideIn 0.4s ease';
                    }
                    if (funFact) {
                        funFact.style.display = 'block';
                        funFact.style.animation = 'fadeSlideIn 0.5s ease';
                    }
                }
            });
        });

        // Lägg till animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeSlideIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .planet-card.expanded {
                border-color: var(--color-primary) !important;
                box-shadow: 0 0 40px rgba(108, 99, 255, 0.3) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ==========================================
    // 8. PARALLAX ASTRONAUT
    // ==========================================
    function initParallax() {
        const astronaut = document.getElementById('astronaut');
        if (!astronaut) return;

        window.addEventListener('scroll', () => {
            const scroll = window.scrollY;
            if (scroll < window.innerHeight) {
                astronaut.style.transform = `translateY(calc(-50% + ${scroll * 0.3}px)) rotate(${scroll * 0.02}deg)`;
                astronaut.style.opacity = 1 - (scroll / window.innerHeight);
            }
        });

        // Mus-interaktion
        document.addEventListener('mousemove', (e) => {
            if (window.scrollY > window.innerHeight) return;
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            astronaut.style.transform = `translateY(-50%) translate(${x}px, ${y}px)`;
        });
    }

    // ==========================================
    // 9. SLUMPMÄSSIG SKJUTSTJÄRNA (Easter Egg)
    // ==========================================
    function initShootingStarEasterEgg() {
        const star = document.getElementById('shootingStar');
        if (!star) return;

        setInterval(() => {
            if (Math.random() > 0.7) {
                star.style.left = Math.random() * 50 + '%';
                star.style.top = Math.random() * 30 + '%';
                star.classList.add('active');
                setTimeout(() => star.classList.remove('active'), 1000);
            }
        }, 8000);
    }

    // ==========================================
    // 10. KONAMI-KOD EASTER EGG
    // ==========================================
    function initKonamiCode() {
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiIndex = 0;

        document.addEventListener('keydown', (e) => {
            if (e.key === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    konamiIndex = 0;
                    activateEasterEgg();
                }
            } else {
                konamiIndex = 0;
            }
        });

        function activateEasterEgg() {
            // Skapa ett rymd-firande!
            const emojis = ['🚀', '⭐', '🌟', '💫', '✨', '🌙', '🪐', '☄️', '🌍', '👾'];
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    const emoji = document.createElement('div');
                    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                    emoji.style.cssText = `
                        position: fixed;
                        font-size: ${20 + Math.random() * 30}px;
                        left: ${Math.random() * 100}%;
                        top: -50px;
                        z-index: 99999;
                        pointer-events: none;
                        animation: emojiDrop ${2 + Math.random() * 3}s ease-in forwards;
                    `;
                    document.body.appendChild(emoji);
                    setTimeout(() => emoji.remove(), 5000);
                }, i * 100);
            }

            // Lägg till drop-animation
            if (!document.getElementById('easterEggStyle')) {
                const style = document.createElement('style');
                style.id = 'easterEggStyle';
                style.textContent = `
                    @keyframes emojiDrop {
                        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(${window.innerHeight + 100}px) rotate(720deg); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    // ==========================================
    // 11. RÄKNARE ANIMATION
    // ==========================================
    function initCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const observed = new Set();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !observed.has(entry.target)) {
                    observed.add(entry.target);
                    animateCounter(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));

        function animateCounter(el) {
            const target = parseInt(el.dataset.count) || 0;
            const text = el.textContent;
            const suffix = text.replace(/[0-9,.]/g, '');

            if (target > 1000) {
                // För stora tal, visa bara slutresultatet med animation
                el.textContent = text;
                el.style.animation = 'counterPop 0.5s ease';
                return;
            }

            let current = 0;
            const increment = target / 40;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    el.textContent = text;
                    clearInterval(timer);
                } else {
                    el.textContent = Math.floor(current) + suffix;
                }
            }, 30);
        }

        // Lägg till animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes counterPop {
                0% { transform: scale(0.5); opacity: 0; }
                60% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // ==========================================
    // 12. STJÄRN-MUSMARKÖR EFFEKT
    // ==========================================
    function initCursorTrail() {
        let lastX = 0, lastY = 0;
        let throttle = false;

        document.addEventListener('mousemove', (e) => {
            if (throttle) return;
            throttle = true;
            setTimeout(() => throttle = false, 50);

            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            const speed = Math.sqrt(dx * dx + dy * dy);

            if (speed > 30) {
                createSparkle(e.clientX, e.clientY);
            }

            lastX = e.clientX;
            lastY = e.clientY;
        });

        function createSparkle(x, y) {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 4px;
                height: 4px;
                background: white;
                border-radius: 50%;
                pointer-events: none;
                z-index: 99998;
                box-shadow: 0 0 6px rgba(0, 212, 255, 0.8);
                animation: sparkleAway 0.6s ease-out forwards;
            `;
            document.body.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 600);
        }

        if (!document.getElementById('sparkleStyle')) {
            const style = document.createElement('style');
            style.id = 'sparkleStyle';
            style.textContent = `
                @keyframes sparkleAway {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(0) translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ==========================================
    // 13. MÅNFASER TOOLTIP
    // ==========================================
    function initMoonPhases() {
        const phases = document.querySelectorAll('.phase');
        phases.forEach(phase => {
            phase.addEventListener('mouseenter', function () {
                const title = this.getAttribute('title');
                if (!title) return;

                const tooltip = document.createElement('div');
                tooltip.className = 'phase-tooltip';
                tooltip.textContent = title;
                tooltip.style.cssText = `
                    position: absolute;
                    background: rgba(10, 10, 26, 0.95);
                    color: #00d4ff;
                    padding: 5px 12px;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    white-space: nowrap;
                    pointer-events: none;
                    transform: translateX(-50%) translateY(-120%);
                    z-index: 100;
                    left: 50%;
                `;
                this.style.position = 'relative';
                this.appendChild(tooltip);
            });

            phase.addEventListener('mouseleave', function () {
                const tooltip = this.querySelector('.phase-tooltip');
                if (tooltip) tooltip.remove();
            });
        });
    }

    // ==========================================
    // INIT ALLT
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        initStarField();
        initNavigation();
        initBackToTop();
        initSwipers();
        initAOS();
        initPlanetCards();
        initParallax();
        initShootingStarEasterEgg();
        initKonamiCode();
        initCounters();
        initCursorTrail();
        initMoonPhases();
    });

})();
