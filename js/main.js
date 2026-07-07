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
        // pathLength=1 gör att rit-animationen (Max-läget) kan använda dasharray:1 oavsett verklig kurvlängd
        return `<div class="ship-visual__blueprint"><svg viewBox="${sil.vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="${sil.d}" pathLength="1"/></svg></div>`;
    }

    // ---------- Toast ----------
    let toastTimer = null;
    function toast(msg) {
        let t = $('#toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'toast'; t.className = 'toast';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
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
        const meta = $('#metaTheme');
        const syncMeta = () => {
            if (meta) meta.setAttribute('content', root.getAttribute('data-theme') === 'light' ? '#eef1f6' : '#070910');
        };
        syncMeta();
        if (!btn) return;
        btn.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
            syncMeta();
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
                dir: Math.random() > 0.5 ? 1 : -1,
                depth: 0.35 + Math.random() * 0.65 // parallaxlager i Max-läget (nära=1, långt=0.35)
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
            // hero utom synhåll → hoppa över ritandet helt (sparar GPU)
            const sy = window.scrollY;
            if (sy > height * 1.15) { raf = requestAnimationFrame(frame); return; }
            ctx.clearRect(0, 0, width, height);
            // ljust tema: mörka prickar (ljusa stjärnor syns inte mot ljus bakgrund)
            const light = root.getAttribute('data-theme') === 'light';
            // Max-läget: stjärnorna glider olika fort vid scroll → djupkänsla i 3 lager
            const par = root.getAttribute('data-perf') === 'max' ? sy * 0.3 : 0;
            for (const s of stars) {
                s.opacity += s.tw * s.dir;
                if (s.opacity >= 1) { s.opacity = 1; s.dir = -1; }
                else if (s.opacity <= 0.1) { s.opacity = 0.1; s.dir = 1; }
                let yy = s.y + par * (1 - s.depth);
                if (par) { yy %= height; if (yy < 0) yy += height; }
                ctx.beginPath();
                ctx.arc(s.x, yy, s.size, 0, Math.PI * 2);
                ctx.fillStyle = light
                    ? `rgba(45, 80, 120, ${s.opacity * 0.45})`
                    : `rgba(180, 210, 245, ${s.opacity * 0.9})`;
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
                g.addColorStop(0, light ? 'rgba(15,90,120,0)' : 'rgba(90,209,230,0)');
                g.addColorStop(1, light ? `rgba(15,90,120,${ss.opacity * 0.6})` : `rgba(140,225,245,${ss.opacity})`);
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
        const closeBtn = $('#navClose');
        const links = $$('.nav-link');

        const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

        function openMenu() {
            menu.classList.add('active');
            toggle.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('menu-open');
        }
        function closeMenu() {
            menu.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        }
        if (toggle) toggle.addEventListener('click', () => menu.classList.contains('active') ? closeMenu() : openMenu());
        if (closeBtn) closeBtn.addEventListener('click', closeMenu);
        links.forEach(l => l.addEventListener('click', closeMenu));
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('active')) closeMenu(); });
        // klick på scrimmen (utanför panelen) stänger
        document.addEventListener('click', e => {
            if (!document.body.classList.contains('menu-open')) return;
            if (e.target.closest('#navMenu') || e.target.closest('#navToggle')) return;
            closeMenu();
        });

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

    let fleetFilter = 'all';
    let fleetQuery = '';

    function applyFleet() {
        const grid = $('#fleetGrid');
        const q = fleetQuery.trim().toLowerCase();
        let visible = 0;
        $$('.ship-card', grid).forEach(card => {
            const ship = shipById(card.dataset.id);
            const matchesFilter = fleetFilter === 'all' || ship.franchiseId === fleetFilter;
            const hay = `${ship.name} ${ship.short} ${ship.klass} ${ship.franchise} ${FRANCHISE_LABEL[ship.franchiseId]}`.toLowerCase();
            const matchesQuery = !q || hay.includes(q);
            const show = matchesFilter && matchesQuery;
            card.classList.toggle('is-hidden', !show);
            if (show) visible++;
        });
        const empty = $('#fleetEmpty');
        if (empty) empty.hidden = visible !== 0;
    }

    // FLIP: mät före/efter och animera korten till sina nya platser (Web Animations API, inga lib)
    function flipFleet(mutate) {
        const grid = $('#fleetGrid');
        if (root.getAttribute('data-perf') === 'lite') { mutate(); return; }
        const cards = $$('.ship-card', grid);
        const first = new Map();
        cards.forEach(c => { if (!c.classList.contains('is-hidden')) first.set(c, c.getBoundingClientRect()); });
        mutate();
        cards.forEach(c => {
            if (c.classList.contains('is-hidden')) return;
            const last = c.getBoundingClientRect();
            const f = first.get(c);
            if (f) {
                const dx = f.left - last.left, dy = f.top - last.top;
                if (dx || dy) c.animate(
                    [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
                    { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
            } else {
                c.animate(
                    [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
                    { duration: 380, easing: 'ease-out' });
            }
        });
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

        // Filter-chips med FLIP
        $$('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                $$('.filter-chip').forEach(c => c.classList.remove('is-active'));
                chip.classList.add('is-active');
                flipFleet(() => { fleetFilter = chip.dataset.filter; applyFleet(); });
            });
        });

        // Sökfält (debounce + FLIP)
        const search = $('#fleetSearch');
        if (search) {
            let deb;
            search.addEventListener('input', () => {
                clearTimeout(deb);
                deb = setTimeout(() => {
                    flipFleet(() => { fleetQuery = search.value; applyFleet(); });
                }, 140);
            });
        }
    }

    // ==========================================
    // 9. DETALJ-MODAL
    // ==========================================
    let lastFocus = null;
    let currentShipId = null;

    function modalHTML(ship) {
        const idx = SHIPS.findIndex(s => s.id === ship.id);
        const prev = SHIPS[(idx - 1 + SHIPS.length) % SHIPS.length];
        const next = SHIPS[(idx + 1) % SHIPS.length];
        return `
            <button class="modal-close" data-modal-close aria-label="Stäng"><i class="fa-solid fa-xmark"></i></button>
            <div class="modal-hero in-view">
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
                    <div class="modal-spec"><div class="modal-spec__lbl">Tillverkare</div><div class="modal-spec__val">${ship.maker}</div></div>
                    <div class="modal-spec"><div class="modal-spec__lbl">Hastighetsbetyg</div><div class="modal-spec__val">${ship.speedRating}/100</div></div>
                    <div class="modal-spec"><div class="modal-spec__lbl">Eldkraftsbetyg</div><div class="modal-spec__val">${ship.weaponRating}/100</div></div>
                </div>
                <div class="modal-block">
                    <h3>Bestyckning</h3>
                    <ul class="modal-weapons">${ship.weapons.map(w => `<li>${w}</li>`).join('')}</ul>
                </div>
                <div class="modal-block">
                    <h3>Känd för</h3>
                    <ol class="modal-scenes">${ship.scenes.map(s => `<li>${s}</li>`).join('')}</ol>
                </div>
                <div class="modal-sources">
                    <span>Källor:</span>
                    ${ship.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.label} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`).join('')}
                </div>
                <div class="modal-pager">
                    <button data-modal-prev><span class="mp-dir">‹ Föregående</span><span class="mp-name">${prev.short}</span></button>
                    <button data-modal-next><span class="mp-dir">Nästa ›</span><span class="mp-name">${next.short}</span></button>
                </div>
            </div>`;
    }

    function renderModalPanel(id) {
        const ship = shipById(id);
        if (!ship) return;
        const panel = $('#modalPanel');
        panel.style.setProperty('--ship-accent', ship.accent);
        panel.innerHTML = modalHTML(ship);
        panel.scrollTop = 0;
        currentShipId = id;
    }

    function openModal(id) {
        const modal = $('#shipModal');
        lastFocus = document.activeElement;
        renderModalPanel(id);
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        $('.modal-close', $('#modalPanel')).focus();
    }

    // Bläddra till nästa/förra skepp – med View Transition i Max-läget (Chrome), annars direkt
    function navModal(dir) {
        if (!currentShipId) return;
        const idx = SHIPS.findIndex(s => s.id === currentShipId);
        const target = SHIPS[(idx + dir + SHIPS.length) % SHIPS.length].id;
        const doRender = () => {
            renderModalPanel(target);
            const btn = $(dir > 0 ? '[data-modal-next]' : '[data-modal-prev]', $('#modalPanel'));
            if (btn) btn.focus();
        };
        if (document.startViewTransition && root.getAttribute('data-perf') === 'max') {
            document.startViewTransition(doRender);
        } else {
            doRender();
        }
    }

    function closeModal() {
        const modal = $('#shipModal');
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        currentShipId = null;
        if (lastFocus) lastFocus.focus();
    }

    function initModal() {
        document.addEventListener('click', e => {
            if (e.target.closest('[data-modal-close]')) closeModal();
            else if (e.target.closest('[data-modal-prev]')) navModal(-1);
            else if (e.target.closest('[data-modal-next]')) navModal(1);
        });
        document.addEventListener('keydown', e => {
            if (!$('#shipModal').classList.contains('is-open')) return;
            if (e.key === 'Escape') closeModal();
            else if (e.key === 'ArrowRight') navModal(1);
            else if (e.key === 'ArrowLeft') navModal(-1);
            else if (e.key === 'Tab') {
                // fokus-fälla: håll Tab inne i panelen
                const foc = $$('#modalPanel button, #modalPanel a[href]');
                if (!foc.length) return;
                const first = foc[0], last = foc[foc.length - 1];
                if (!$('#modalPanel').contains(document.activeElement)) { e.preventDefault(); first.focus(); }
                else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });
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

    let duelUrlDirty = false; // uppdatera URL:en först efter interaktion/deep-link

    function duelCardHTML(ship) {
        return `
            <div class="dc-visual in-view">${blueprintHTML(ship)}${imageHTML(ship)}</div>
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

        // Delbar länk: håll URL:en i synk med vald duell (utan att spamma historiken)
        if (duelUrlDirty && history.replaceState) {
            history.replaceState(null, '', location.pathname + '?duel=' + a.id + '-vs-' + b.id);
        }
    }

    function initDuel() {
        const selA = $('#selA'), selB = $('#selB');
        if (!selA || !selB) return;
        const opts = SHIPS.map(s => `<option value="${s.id}">${s.name} (${FRANCHISE_LABEL[s.franchiseId]})</option>`).join('');
        selA.innerHTML = opts; selB.innerHTML = opts;
        selA.value = 'millennium-falcon';
        selB.value = 'enterprise-d';

        // Deep-link: ?duel=<idA>-vs-<idB> förvalda + scrolla dit
        const param = new URLSearchParams(location.search).get('duel');
        if (param) {
            const [aId, bId] = param.split('-vs-');
            if (shipById(aId)) selA.value = aId;
            if (shipById(bId)) selB.value = bId;
            duelUrlDirty = true;
            setTimeout(() => { const el = $('#duell'); if (el) el.scrollIntoView(); }, 150);
        }

        selA.addEventListener('change', () => { duelUrlDirty = true; renderDuel(); });
        selB.addEventListener('change', () => { duelUrlDirty = true; renderDuel(); });

        // Kopiera delbar länk
        const share = $('#duelShare');
        if (share) {
            share.addEventListener('click', async () => {
                const url = location.href.split('?')[0] + '?duel=' + selA.value + '-vs-' + selB.value;
                try {
                    await navigator.clipboard.writeText(url);
                    toast('Länk till duellen kopierad');
                } catch (e) {
                    toast('Kunde inte kopiera – kopiera adressfältet istället');
                }
            });
        }

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
    // 12b. ARKIVETS VAL (redaktionella topplistor)
    // ==========================================
    function initPicks() {
        const grid = $('#picksGrid');
        if (!grid || typeof ARCHIVE_PICKS === 'undefined') return;
        grid.innerHTML = ARCHIVE_PICKS.map((p, i) => {
            const ship = shipById(p.ship);
            if (!ship) return '';
            const sil = SILHOUETTES[ship.sil];
            return `
            <article class="pick" style="--ship-accent:${ship.accent}" data-id="${ship.id}" tabindex="0" role="button" aria-label="Visa ${ship.name}" data-aos="fade-up" data-aos-delay="${i * 80}">
                <span class="pick__index">0${i + 1}</span>
                <span class="pick__label">${p.label}</span>
                <h3 class="pick__name">${ship.name}</h3>
                <p class="pick__blurb">${p.blurb}</p>
                <span class="pick__cta">Öppna i arkivet <i class="fa-solid fa-arrow-right"></i></span>
                <span class="pick__sil" aria-hidden="true"><svg viewBox="${sil.vb}"><path d="${sil.d}" fill="currentColor"/></svg></span>
            </article>`;
        }).join('');
        grid.addEventListener('click', e => {
            const el = e.target.closest('.pick');
            if (el) openModal(el.dataset.id);
        });
        grid.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                const el = e.target.closest('.pick');
                if (el) { e.preventDefault(); openModal(el.dataset.id); }
            }
        });
    }

    // ==========================================
    // 12c. CITAT-VÄGG (scroll-snap)
    // ==========================================
    function initQuotes() {
        const wall = $('#quoteWall');
        if (!wall) return;
        wall.innerHTML = SHIPS.map(s => `
            <figure class="quote-card" style="--ship-accent:${s.accent}">
                <blockquote>”${s.quote}”</blockquote>
                <figcaption>${s.name} · ${s.franchise} (${s.year})</figcaption>
            </figure>`).join('');
    }

    // ==========================================
    // 12d. SILUETT-OBSERVER (rit-animation i Max)
    // ==========================================
    function initVisualObserver() {
        const targets = $$('.ship-visual');
        if (!targets.length) return;
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
            });
        }, { threshold: 0.3 });
        targets.forEach(t => obs.observe(t));
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
    // 13b. PWA – registrera service worker
    // Network-first-SW (se sw.js) → sidan kan aldrig fastna i
    // gammal cache. Registreras bara över http(s), inte file://.
    // ==========================================
    function initPWA() {
        if (!('serviceWorker' in navigator)) return;
        if (!/^https?:$/.test(location.protocol)) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(reg => {
                reg.addEventListener('updatefound', () => {
                    const nw = reg.installing;
                    if (!nw) return;
                    nw.addEventListener('statechange', () => {
                        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                            toast('Arkivet har uppdaterats – ladda om för senaste versionen');
                        }
                    });
                });
            }).catch(() => { /* SW är progressiv förbättring – tyst vid fel */ });
        });
    }

    // ==========================================
    // 14. FPS-VAKT – föreslå Lätt vid hackighet
    // ==========================================
    function initFpsGuard() {
        if (root.getAttribute('data-perf') === 'lite') return;
        // föreslå bara Lätt i auto-läge – tjata inte på den som uttryckligen valt Standard/Max
        try { if (localStorage.getItem('spaceships:perfMode')) return; } catch (e) {}
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
        initPicks();
        initQuotes();
        initVisualObserver();
        initAOS();
        initPWA();
        initFpsGuard();
    });

})();
