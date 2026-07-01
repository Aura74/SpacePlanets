/* ============================================================
   RYMDSKEPPSARKIVET – HUVUD-JAVASCRIPT
   Tema, prestandalägen, stjärnfält, galleri, duell, skala
   ============================================================ */

(function () {
    'use strict';

    const root = document.documentElement;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

    // ---------- Hjälpare ----------
    function fmtInt(n) {
        return n.toLocaleString('sv-SE');
    }
    function fmtLength(m) {
        if (m >= 1000) return (m / 1000).toLocaleString('sv-SE', { maximumFractionDigits: 2 }) + ' km';
        return m.toLocaleString('sv-SE', { maximumFractionDigits: 2 }) + ' m';
    }
    function shipById(id) { return SHIPS.find(s => s.id === id); }

    function blueprintHTML(ship) {
        const sil = SILHOUETTES[ship.sil];
        return `<div class="ship-visual__blueprint"><svg viewBox="${sil.vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="${sil.d}"/></svg></div>`;
    }
    function imageHTML(ship) {
        // Riktig bild läggs ovanpå blueprinten. Visas bara om den laddas (annars syns siluetten).
        if (!ship.image) return '';
        return `<img class="ship-visual__img" alt="${ship.name}" loading="lazy"
            src="${ship.image}"
            onload="this.classList.add('is-loaded')"
            onerror="this.remove()">`;
    }

    // ==========================================
    // 1. LADDNINGSSKÄRM
    // ==========================================
    window.addEventListener('load', () => {
        const loader = $('#loader');
        if (!loader) return;
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 600);
        }, 700);
    });

    // ==========================================
    // 2. TEMA-VÄXLARE
    // ==========================================
    function initTheme() {
        const btn = $('#themeToggle');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
        });
    }

    // ==========================================
    // 3. PRESTANDALÄGE
    // ==========================================
    let starfield = null;

    function applyPerfButtons() {
        const current = root.getAttribute('data-perf');
        $$('.perf-btn').forEach(b => b.classList.toggle('is-active', b.dataset.perfSet === current));
    }

    function setPerf(mode) {
        root.setAttribute('data-perf', mode);
        try { localStorage.setItem('spaceships:perfMode', mode); } catch (e) {}
        applyPerfButtons();
        // Stjärnfält av/på beroende på läge
        if (mode === 'lite') {
            if (starfield) { starfield.stop(); starfield = null; }
        } else if (!starfield) {
            starfield = initStarField(mode);
        } else {
            starfield.setDensity(mode);
        }
    }

    function initPerf() {
        $$('.perf-btn').forEach(btn => {
            btn.addEventListener('click', () => setPerf(btn.dataset.perfSet));
        });
        applyPerfButtons();
    }

    // ==========================================
    // 4. STJÄRNFÄLT (Canvas)
    // ==========================================
    function initStarField(mode) {
        const canvas = $('#starsCanvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        let width, height, stars, shooting, raf, running = true;
        let density = mode === 'max' ? 320 : 180;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        function resize() {
            const p = canvas.parentElement;
            width = p.clientWidth; height = p.clientHeight;
            canvas.width = width * dpr; canvas.height = height * dpr;
            canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        function makeStars(n) {
            return Array.from({ length: n }, () => ({
                x: Math.random() * width, y: Math.random() * height,
                size: Math.random() * 1.8 + 0.2,
                opacity: Math.random(),
                tw: 0.004 + Math.random() * 0.014,
                dir: Math.random() > 0.5 ? 1 : -1
            }));
        }
        function makeShooting() {
            return { x: Math.random() * width, y: Math.random() * height * 0.4,
                len: 70 + Math.random() * 90, speed: 7 + Math.random() * 9,
                angle: Math.PI / 5 + (Math.random() - 0.5) * 0.25, opacity: 1 };
        }

        resize();
        stars = makeStars(density);
        shooting = [];
        const shootTimer = setInterval(() => {
            if (running && mode === 'max' && shooting.length < 2 && Math.random() > 0.5) shooting.push(makeShooting());
            else if (running && shooting.length < 1 && Math.random() > 0.75) shooting.push(makeShooting());
        }, 3500);

        function frame() {
            if (!running) return;
            ctx.clearRect(0, 0, width, height);
            for (const s of stars) {
                s.opacity += s.tw * s.dir;
                if (s.opacity >= 1) { s.opacity = 1; s.dir = -1; }
                else if (s.opacity <= 0.1) { s.opacity = 0.1; s.dir = 1; }
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180, 210, 245, ${s.opacity * 0.9})`;
                ctx.fill();
            }
            shooting = shooting.filter(ss => {
                ss.x += Math.cos(ss.angle) * ss.speed;
                ss.y += Math.sin(ss.angle) * ss.speed;
                ss.opacity -= 0.012;
                if (ss.opacity <= 0) return false;
                const tx = ss.x - Math.cos(ss.angle) * ss.len;
                const ty = ss.y - Math.sin(ss.angle) * ss.len;
                const g = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
                g.addColorStop(0, 'rgba(90,209,230,0)');
                g.addColorStop(1, `rgba(140,225,245,${ss.opacity})`);
                ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ss.x, ss.y);
                ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.stroke();
                return ss.x < width + 120 && ss.y < height + 120;
            });
            raf = requestAnimationFrame(frame);
        }
        frame();

        const onResize = () => { resize(); stars = makeStars(density); };
        window.addEventListener('resize', onResize);

        return {
            stop() { running = false; cancelAnimationFrame(raf); clearInterval(shootTimer); window.removeEventListener('resize', onResize); ctx.clearRect(0, 0, width, height); },
            setDensity(m) { density = m === 'max' ? 320 : 180; stars = makeStars(density); }
        };
    }

    // ==========================================
    // 5. NAVIGATION
    // ==========================================
    function initNav() {
        const navbar = $('#navbar');
        const toggle = $('#navToggle');
        const menu = $('#navMenu');
        const links = $$('.nav-link');

        const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

        if (toggle) {
            toggle.addEventListener('click', () => {
                const open = menu.classList.toggle('active');
                toggle.classList.toggle('active', open);
                toggle.setAttribute('aria-expanded', String(open));
            });
        }
        links.forEach(l => l.addEventListener('click', () => {
            menu.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }));

        // Scroll-spy
        const sections = $$('section[id], header[id]');
        const spy = () => {
            const y = window.scrollY + 140;
            let cur = '';
            sections.forEach(sec => { if (y >= sec.offsetTop) cur = sec.id; });
            links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${cur}`));
        };
        window.addEventListener('scroll', spy, { passive: true }); spy();
    }

    // ==========================================
    // 6. BACK TO TOP
    // ==========================================
    function initBackToTop() {
        const btn = $('#backToTop');
        if (!btn) return;
        window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 600), { passive: true });
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // ==========================================
    // 7. HERO-RÄKNARE
    // ==========================================
    function initCounters() {
        const nums = $$('.hero-stat__num');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                obs.unobserve(e.target);
                const target = parseInt(e.target.dataset.count, 10) || 0;
                if (root.getAttribute('data-perf') === 'lite') { e.target.textContent = target; return; }
                let cur = 0; const step = Math.max(1, Math.round(target / 40));
                const t = setInterval(() => {
                    cur += step;
                    if (cur >= target) { e.target.textContent = target; clearInterval(t); }
                    else e.target.textContent = cur;
                }, 28);
            });
        }, { threshold: 0.6 });
        nums.forEach(n => obs.observe(n));
    }

    // ==========================================
    // 8. FLOTTAN (GALLERI) + FILTER
    // ==========================================
    function shipCardHTML(ship) {
        return `
        <article class="ship-card" data-id="${ship.id}" data-franchise="${ship.franchiseId}" style="--ship-accent:${ship.accent}" tabindex="0" role="button" aria-label="Visa ${ship.name}">
            <div class="ship-visual">
                ${blueprintHTML(ship)}
                ${imageHTML(ship)}
                <span class="ship-tag">${FRANCHISE_LABEL[ship.franchiseId]}</span>
            </div>
            <div class="ship-body">
                <h3 class="ship-name">${ship.name}</h3>
                <p class="ship-klass">${ship.klass}</p>
                <div class="ship-specs">
                    <div class="ship-spec"><span class="ship-spec__val">${fmtLength(ship.length)}</span><span class="ship-spec__lbl">Längd</span></div>
                    <div class="ship-spec"><span class="ship-spec__val">${ship.crew >= 1000 ? fmtInt(ship.crew) : ship.crew}</span><span class="ship-spec__lbl">Besättning</span></div>
                    <div class="ship-spec"><span class="ship-spec__val">${ship.year}</span><span class="ship-spec__lbl">Debut</span></div>
                </div>
            </div>
        </article>`;
    }

    function initFleet() {
        const grid = $('#fleetGrid');
        if (!grid) return;
        grid.innerHTML = SHIPS.map(shipCardHTML).join('');

        // Öppna modal
        grid.addEventListener('click', e => {
            const card = e.target.closest('.ship-card');
            if (card) openModal(card.dataset.id);
        });
        grid.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                const card = e.target.closest('.ship-card');
                if (card) { e.preventDefault(); openModal(card.dataset.id); }
            }
        });

        // Filter
        $$('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                $$('.filter-chip').forEach(c => c.classList.remove('is-active'));
                chip.classList.add('is-active');
                const f = chip.dataset.filter;
                $$('.ship-card', grid).forEach(card => {
                    card.classList.toggle('is-hidden', f !== 'all' && card.dataset.franchise !== f);
                });
            });
        });
    }

    // ==========================================
    // 9. DETALJ-MODAL
    // ==========================================
    let lastFocus = null;

    function openModal(id) {
        const ship = shipById(id);
        if (!ship) return;
        const modal = $('#shipModal');
        const panel = $('#modalPanel');
        lastFocus = document.activeElement;

        panel.style.setProperty('--ship-accent', ship.accent);
        panel.innerHTML = `
            <button class="modal-close" data-modal-close aria-label="Stäng"><i class="fa-solid fa-xmark"></i></button>
            <div class="modal-hero">
                ${blueprintHTML(ship)}
                ${imageHTML(ship)}
            </div>
            <div class="modal-body">
                <p class="modal-tag">${ship.origin}</p>
                <h2 class="modal-name" id="modalName">${ship.name}</h2>
                <p class="modal-origin">${ship.klass} · ${ship.role}</p>
                <p class="modal-desc">${ship.desc}</p>
                <blockquote class="modal-quote">”${ship.quote}”</blockquote>
                <div class="modal-specs">
                    <div class="modal-spec"><div class="modal-spec__lbl">Längd</div><div class="modal-spec__val">${fmtLength(ship.length)}</div></div>
                    <div class="modal-spec"><div class="modal-spec__lbl">Besättning</div><div class="modal-spec__val">${ship.crewText}</div></div>
                    <div class="modal-spec"><div class="modal-spec__lbl">Drivteknik</div><div class="modal-spec__val">${ship.ftl}</div></div>
                    <div class="modal-spec"><div class="modal-spec__lbl">Roll</div><div class="modal-spec__val">${ship.role}</div></div>
                    <div class="modal-spec"><div class="modal-spec__lbl">Hastighetsbetyg</div><div class="modal-spec__val">${ship.speedRating}/100</div></div>
                    <div class="modal-spec"><div class="modal-spec__lbl">Eldkraftsbetyg</div><div class="modal-spec__val">${ship.weaponRating}/100</div></div>
                </div>
            </div>`;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        $('.modal-close', panel).focus();
    }

    function closeModal() {
        const modal = $('#shipModal');
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }

    function initModal() {
        document.addEventListener('click', e => { if (e.target.closest('[data-modal-close]')) closeModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#shipModal').classList.contains('is-open')) closeModal(); });
    }

    // ==========================================
    // 10. DUELL (HEAD-TO-HEAD)
    // ==========================================
    const DUEL_METRICS = [
        { key: 'length', label: 'Längd', fmt: fmtLength, max: () => Math.max(...SHIPS.map(s => s.length)) },
        { key: 'crew', label: 'Besättning', fmt: v => (v >= 1000 ? fmtInt(v) : v), max: () => Math.max(...SHIPS.map(s => s.crew)) },
        { key: 'speedRating', label: 'Hastighet', fmt: v => v + '/100', max: () => 100 },
        { key: 'weaponRating', label: 'Eldkraft', fmt: v => v + '/100', max: () => 100 }
    ];

    function duelCardHTML(ship) {
        return `
            <div class="dc-visual">${blueprintHTML(ship)}${imageHTML(ship)}</div>
            <div class="dc-name">${ship.name}</div>
            <div class="dc-klass">${FRANCHISE_LABEL[ship.franchiseId]} · ${ship.year}</div>`;
    }

    function renderDuel() {
        const a = shipById($('#selA').value);
        const b = shipById($('#selB').value);
        if (!a || !b) return;

        const cardA = $('#cardA'), cardB = $('#cardB');
        cardA.style.setProperty('--ship-accent', a.accent);
        cardB.style.setProperty('--ship-accent', b.accent);
        cardA.innerHTML = duelCardHTML(a);
        cardB.innerHTML = duelCardHTML(b);

        const bars = $('#duelBars');
        bars.innerHTML = DUEL_METRICS.map(m => {
            const max = m.max();
            // logaritmisk skala för längd/besättning så stora värden inte dränker små
            const scale = (v) => {
                if (m.key === 'length' || m.key === 'crew') {
                    return Math.max(4, (Math.log10(v + 1) / Math.log10(max + 1)) * 100);
                }
                return Math.max(4, (v / max) * 100);
            };
            return `
            <div class="duel-bar__row">
                <div class="duel-bar__head">
                    <span class="duel-bar__label">${m.label}</span>
                    <span class="duel-bar__values"><span class="v-a">${m.fmt(a[m.key])}</span><span class="duel-bar__sep">·</span><span class="v-b">${m.fmt(b[m.key])}</span></span>
                </div>
                <div class="duel-bar__track">
                    <div class="duel-bar__fill a" data-w="${scale(a[m.key])}"></div>
                    <div class="duel-bar__fill b" data-w="${scale(b[m.key])}"></div>
                </div>
            </div>`;
        }).join('');

        // animera bredd
        requestAnimationFrame(() => {
            $$('.duel-bar__fill', bars).forEach(f => { f.style.width = (parseFloat(f.dataset.w) / 2) + '%'; });
        });

        // Verdikt: vinst per mätvärde
        let aw = 0, bw = 0;
        DUEL_METRICS.forEach(m => { if (a[m.key] > b[m.key]) aw++; else if (b[m.key] > a[m.key]) bw++; });
        const verdict = $('#duelVerdict');
        if (a.id === b.id) verdict.innerHTML = `Välj två olika skepp för en jämförelse.`;
        else if (aw > bw) verdict.innerHTML = `<strong>${a.name}</strong> leder ${aw}–${bw} över ${b.name} på de fyra måtten.`;
        else if (bw > aw) verdict.innerHTML = `<strong>${b.name}</strong> leder ${bw}–${aw} över ${a.name} på de fyra måtten.`;
        else verdict.innerHTML = `Dött lopp – ${a.name} och ${b.name} står ${aw}–${bw}.`;
    }

    function initDuel() {
        const selA = $('#selA'), selB = $('#selB');
        if (!selA || !selB) return;
        const opts = SHIPS.map(s => `<option value="${s.id}">${s.name} (${FRANCHISE_LABEL[s.franchiseId]})</option>`).join('');
        selA.innerHTML = opts; selB.innerHTML = opts;
        selA.value = 'millennium-falcon';
        selB.value = 'enterprise-d';
        selA.addEventListener('change', renderDuel);
        selB.addEventListener('change', renderDuel);
        renderDuel();
    }

    // ==========================================
    // 11. STORLEKSSKALA
    // ==========================================
    function initScale() {
        const chart = $('#scaleChart');
        if (!chart) return;
        const sorted = [...SHIPS].sort((a, b) => a.length - b.length);
        const maxSqrt = Math.sqrt(Math.max(...SHIPS.map(s => s.length)));
        chart.innerHTML = sorted.map(ship => {
            const sil = SILHOUETTES[ship.sil];
            const pct = (Math.sqrt(ship.length) / maxSqrt) * 100;
            return `
            <div class="scale-row" style="--ship-accent:${ship.accent}">
                <div class="scale-head">
                    <span class="scale-ico"><svg viewBox="${sil.vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="${sil.d}" fill="currentColor"/></svg></span>
                    <span class="scale-name">${ship.short}<small>${FRANCHISE_LABEL[ship.franchiseId]}</small></span>
                </div>
                <div class="scale-track"><div class="scale-fill" data-w="${pct}"></div></div>
                <div class="scale-len">${fmtLength(ship.length)}<small>verklig längd</small></div>
            </div>`;
        }).join('');

        // animera in när synligt
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                obs.unobserve(e.target);
                $$('.scale-fill', e.target).forEach(f => f.style.width = f.dataset.w + '%');
            });
        }, { threshold: 0.2 });
        obs.observe(chart);
    }

    // ==========================================
    // 12. TIDSLINJE
    // ==========================================
    function initTimeline() {
        const tl = $('#timeline');
        if (!tl) return;
        const sorted = [...SHIPS].sort((a, b) => a.year - b.year);
        tl.innerHTML = sorted.map((ship, i) => `
            <div class="timeline-item" style="--ship-accent:${ship.accent}" data-aos="fade-up" data-aos-delay="${(i % 4) * 60}">
                <div class="timeline-year">${ship.year}</div>
                <div class="timeline-ship">${ship.name}</div>
                <div class="timeline-meta">${ship.origin} · ${ship.klass}</div>
            </div>`).join('');
    }

    // ==========================================
    // 13. AOS
    // ==========================================
    function initAOS() {
        if (typeof AOS === 'undefined') return;
        AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60,
            disable: () => root.getAttribute('data-perf') === 'lite' });
    }

    // ==========================================
    // 14. FPS-VAKT – föreslå Lätt vid hackighet
    // ==========================================
    function initFpsGuard() {
        if (root.getAttribute('data-perf') === 'lite') return;
        try { if (sessionStorage.getItem('spaceships:fpsChecked')) return; } catch (e) {}
        window.addEventListener('load', () => {
            setTimeout(() => {
                let frames = 0, last = performance.now(), start = last;
                function tick(now) {
                    frames++;
                    if (now - start < 2500) { requestAnimationFrame(tick); return; }
                    const fps = frames / ((now - start) / 1000);
                    try { sessionStorage.setItem('spaceships:fpsChecked', '1'); } catch (e) {}
                    if (fps < 45) showPerfHint();
                }
                requestAnimationFrame(tick);
            }, 1200);
        });
    }
    function showPerfHint() {
        if ($('#perfHint')) return;
        const hint = document.createElement('div');
        hint.id = 'perfHint';
        hint.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:1200;background:var(--surface);border:1px solid var(--border-strong);border-radius:6px;padding:0.85rem 1rem;box-shadow:var(--shadow-lg);display:flex;gap:0.8rem;align-items:center;max-width:92vw;font-size:0.9rem';
        hint.innerHTML = `<span>Sidan verkar gå trögt. Vill du byta till <strong>Lätt</strong> läge?</span>
            <button id="perfHintYes" style="background:var(--accent);color:#04121a;border-radius:4px;padding:0.45rem 0.9rem;font-weight:600">Byt till Lätt</button>
            <button id="perfHintNo" aria-label="Stäng" style="color:var(--text-muted);padding:0.3rem 0.5rem">✕</button>`;
        document.body.appendChild(hint);
        $('#perfHintYes').addEventListener('click', () => { setPerf('lite'); hint.remove(); });
        $('#perfHintNo').addEventListener('click', () => hint.remove());
    }

    // ==========================================
    // INIT
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initPerf();
        if (root.getAttribute('data-perf') !== 'lite') starfield = initStarField(root.getAttribute('data-perf'));
        initNav();
        initBackToTop();
        initCounters();
        initFleet();
        initModal();
        initDuel();
        initScale();
        initTimeline();
        initAOS();
        initFpsGuard();
    });

})();
