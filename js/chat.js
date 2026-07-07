/* ============================================================
   RYMDSKEPPSARKIVET – ARKIVARIEN (AI-skeppsexpert)
   Gemini API med modell-fallback + lokal offline-hjärna.
   Mönster från AI_ChatBot_Liten_Version, anpassat till arkivet.
   ============================================================ */

(function () {
    'use strict';

    // ── AI-konfiguration ─────────────────────────
    const GEMINI_API_KEY = 'AIzaSyCM4mKLZNHyaF4G4CiARUF9xSnqFFtnUAI';
    const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest']; // provas i ordning
    const geminiUrl = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Faktabas till systemprompten byggs från ships.js – en källa till sanning
    const SHIP_FACTS = SHIPS.map(s =>
        `• ${s.name} (${s.franchise}, ${s.year}): ${s.klass}. Längd ${s.length} m, besättning ${s.crewText}, ${s.ftl}. Tillverkare: ${s.maker}. Roll: ${s.role}. Betyg – hastighet ${s.speedRating}/100, eldkraft ${s.weaponRating}/100.`
    ).join('\n');

    const SYSTEM_PROMPT = `Du är Arkivarien – Rymdskeppsarkivets AI-expert på rymdskepp från film, TV och spel. Du pratar svenska.

Arkivets tolv skepp (din primära faktabas – utgå från dessa siffror när de efterfrågas):
${SHIP_FACTS}

Personlighet:
- Kunnig, torrt humoristisk, filmnördig – som en museiintendent som älskar sitt arkiv
- Kortfattad men informativ: 1–4 meningar om inte användaren ber om mer
- Du får gärna jämföra skepp, ha åsikter och blinka åt fansen
- Du kan använda **fetstil** för att betona skeppsnamn och nyckeltal

Regler:
- Svara alltid på svenska om inte användaren skriver på annat språk
- Håll dig till science fiction: rymdskepp, filmer, serier, spel och deras universum
- Om frågan är helt utanför ämnet: styr vänligt tillbaka till arkivet
- Om du inte vet något, säg det ärligt – hitta inte på siffror`;

    // ── Widget-markup (injiceras så index.html hålls ren) ──
    function injectWidget() {
        const wrap = document.createElement('div');
        wrap.id = 'chatRoot';
        wrap.innerHTML = `
        <button id="chatFab" aria-label="Fråga Arkivarien" title="Fråga Arkivarien">
            <span class="chat-fab__tip">Fråga Arkivarien</span>
            <i class="fa-solid fa-user-astronaut" aria-hidden="true"></i>
        </button>
        <section id="chatWidget" class="chat-widget" hidden role="dialog" aria-modal="false" aria-label="Chatt med Arkivarien">
            <header class="chat-head">
                <div class="chat-head__id">
                    <span class="chat-orb" aria-hidden="true"></span>
                    <div>
                        <h3>Arkivarien</h3>
                        <p class="chat-status"><span class="chat-status__dot"></span> Online · Gemini</p>
                    </div>
                </div>
                <div class="chat-head__actions">
                    <button class="chat-iconbtn" id="chatClear" title="Rensa chatten" aria-label="Rensa chatten"><i class="fa-solid fa-rotate-right"></i></button>
                    <button class="chat-iconbtn" id="chatClose" title="Stäng" aria-label="Stäng chatten"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </header>
            <div class="chat-box" id="chatBox">
                <div id="chatMessages"></div>
                <div class="chat-typing" id="chatTyping" hidden>
                    <span></span><span></span><span></span>
                </div>
            </div>
            <div class="chat-suggest" id="chatSuggest">
                <button class="chat-chip" data-msg="Vilket skepp i arkivet är snabbast?"><i class="fa-solid fa-gauge-high"></i> Snabbast?</button>
                <button class="chat-chip" data-msg="Jämför Millennium Falcon och Enterprise-D."><i class="fa-solid fa-code-compare"></i> Falcon vs Enterprise</button>
                <button class="chat-chip" data-msg="Berätta om Rocinante från The Expanse."><i class="fa-solid fa-rocket"></i> Rocinante</button>
            </div>
            <footer class="chat-inputrow">
                <textarea id="chatInput" rows="1" maxlength="500" placeholder="Fråga om skeppen …" aria-label="Skriv din fråga"></textarea>
                <button id="chatSend" aria-label="Skicka" disabled><i class="fa-solid fa-paper-plane"></i></button>
            </footer>
        </section>`;
        document.body.appendChild(wrap);
    }

    // ── Lokal offline-hjärna (byggd på SHIPS-datan) ─────────
    function normalize(str) {
        return str.toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[?!.,'"]/g, '');
    }

    function shipSummary(s) {
        return `**${s.name}** (${s.franchise}, ${s.year}) – ${s.klass}. Längd **${s.length} m**, besättning ${s.crewText}, ${s.ftl}. Känd för: ${s.scenes[0]}.`;
    }

    function findShipsInText(text) {
        const n = normalize(text);
        return SHIPS.filter(s =>
            n.includes(normalize(s.short)) || n.includes(normalize(s.name)) ||
            (s.id === 'borg-cube' && n.includes('borg')) ||
            (s.id === 'enterprise-d' && n.includes('enterprise')));
    }

    function getLocalResponse(input) {
        const n = normalize(input);
        const hits = findShipsInText(input);

        if (hits.length >= 2) {
            const [a, b] = hits;
            const faster = a.speedRating === b.speedRating ? null : (a.speedRating > b.speedRating ? a : b);
            const bigger = a.length === b.length ? null : (a.length > b.length ? a : b);
            let out = `**${a.short}** (${a.length} m, hastighet ${a.speedRating}/100, eldkraft ${a.weaponRating}/100) mot **${b.short}** (${b.length} m, hastighet ${b.speedRating}/100, eldkraft ${b.weaponRating}/100).`;
            if (faster) out += ` Snabbast: **${faster.short}**.`;
            if (bigger) out += ` Störst: **${bigger.short}**.`;
            return out + ' Öppna duellen på sidan för hela jämförelsen!';
        }
        if (hits.length === 1) return shipSummary(hits[0]);

        if (/(snabbast|fortast)/.test(n)) {
            const s = [...SHIPS].sort((x, y) => y.speedRating - x.speedRating)[0];
            return `Snabbast i arkivet är **${s.name}** med hastighetsbetyg ${s.speedRating}/100. ${s.quote ? '”' + s.quote + '”' : ''}`;
        }
        if (/(storst|langst|biggest)/.test(n)) {
            const s = [...SHIPS].sort((x, y) => y.length - x.length)[0];
            return `Störst är **${s.name}** – ${s.length >= 1000 ? (s.length / 1000).toLocaleString('sv-SE') + ' km' : s.length + ' m'} av ren ${s.franchise}-geometri.`;
        }
        if (/(eldkraft|starkast|bevapnad|vapen)/.test(n)) {
            const s = [...SHIPS].sort((x, y) => y.weaponRating - x.weaponRating)[0];
            return `Tyngst beväpnad är **${s.name}** med eldkraftsbetyg ${s.weaponRating}/100. ${s.weapons[0]}.`;
        }
        if (/(hej|halla|tjena|hello|hi|god morgon|god kvall)/.test(n)) {
            return 'Hälsningar! Jag är **Arkivarien**. Fråga mig om skeppen i arkivet – jämförelser, hastigheter, besättningar eller berömda scener.';
        }
        if (/(tack|tackar|thanks)/.test(n)) {
            return 'Nöjet är på min sida. Arkivet är öppet dygnet runt.';
        }
        return 'Jag kör i **offline-läge** just nu och kan bara svara utifrån arkivets faktabas. Prova att nämna ett skepp vid namn – t.ex. *"Berätta om Nostromo"* eller *"Jämför Voyager och Galactica"*.';
    }

    // ── Gemini-anrop med modell-fallback ─────────
    let history = [];

    async function callAI(userMessage) {
        history.push({ role: 'user', parts: [{ text: userMessage }] });
        const body = {
            contents: history,
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { temperature: 0.8, topP: 0.95, maxOutputTokens: 1024 }
        };

        let lastErr = null;
        for (const model of GEMINI_MODELS) {
            try {
                const res = await fetch(geminiUrl(model), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
                    body: JSON.stringify(body)
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => null);
                    lastErr = new Error(errData?.error?.message || `HTTP ${res.status}`);
                    continue; // prova nästa modell
                }
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') ||
                    'Jag kunde inte formulera ett svar just nu.';
                history.push({ role: 'model', parts: [{ text }] });
                if (history.length > 40) history = history.slice(-40);
                return text;
            } catch (e) {
                lastErr = e; // nätverksfel → prova nästa modell
            }
        }
        history.pop(); // rulla tillbaka user-inlägget så historiken inte förgiftas
        throw lastErr || new Error('Okänt fel');
    }

    // ── UI-hjälpare ──────────────────────────────
    const $id = (id) => document.getElementById(id);
    let isTyping = false;
    let hasOpened = false;
    let apiAvailable = true;

    function formatText(text) {
        return text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    function scrollToBottom() {
        const box = $id('chatBox');
        box.scrollTop = box.scrollHeight;
    }

    function addMessage(text, sender) {
        const welcome = $id('chatWelcome');
        if (welcome) welcome.remove();

        const msg = document.createElement('div');
        msg.className = `chat-msg chat-msg--${sender}`;
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        if (sender === 'bot') bubble.innerHTML = formatText(text);
        else bubble.textContent = text;
        msg.appendChild(bubble);
        $id('chatMessages').appendChild(msg);
        scrollToBottom();
        return bubble;
    }

    function typewriter(el, text) {
        // I Lätt-läge: visa direkt utan animation
        if (document.documentElement.getAttribute('data-perf') === 'lite') {
            el.innerHTML = formatText(text);
            scrollToBottom();
            return Promise.resolve();
        }
        return new Promise(resolve => {
            const html = formatText(text);
            const tokens = html.split(/(<[^>]+>)/).flatMap(part =>
                part.startsWith('<') ? [part] : part.split(''));
            let out = '', i = 0;
            const speed = Math.max(5, Math.min(18, 1100 / tokens.length));
            (function next() {
                if (i < tokens.length) {
                    out += tokens[i++];
                    el.innerHTML = out;
                    scrollToBottom();
                    setTimeout(next, tokens[i - 1].startsWith('<') ? 0 : speed);
                } else resolve();
            })();
        });
    }

    function showWelcome() {
        const div = document.createElement('div');
        div.id = 'chatWelcome';
        div.className = 'chat-welcome';
        div.innerHTML = `
            <span class="chat-orb chat-orb--big" aria-hidden="true"></span>
            <h4>Arkivarien till er tjänst</h4>
            <p>Fråga om skeppen – jämförelser, fakta, berömda scener. Jag kan arkivets tolv skepp utan och innan.</p>`;
        $id('chatMessages').appendChild(div);
    }

    async function sendMessage(raw) {
        const text = (raw || '').trim();
        if (!text || isTyping) return;
        isTyping = true;

        addMessage(text, 'user');
        const input = $id('chatInput');
        input.value = '';
        input.style.height = 'auto';
        $id('chatSend').disabled = true;
        $id('chatSuggest').hidden = true;
        $id('chatTyping').hidden = false;
        scrollToBottom();

        let response;
        if (apiAvailable) {
            try {
                response = await callAI(text);
            } catch (err) {
                apiAvailable = false;
                response = getLocalResponse(text) + '\n\n*(AI-tjänsten svarar inte just nu – jag använder arkivets lokala faktabas.)*';
            }
        } else {
            await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            response = getLocalResponse(text);
        }

        $id('chatTyping').hidden = true;
        const bubble = addMessage('', 'bot');
        await typewriter(bubble, response);
        isTyping = false;
    }

    function openWidget() {
        $id('chatWidget').hidden = false;
        $id('chatFab').classList.add('is-hidden');
        if (!hasOpened) { showWelcome(); hasOpened = true; }
        setTimeout(() => $id('chatInput').focus(), 250);
    }
    function closeWidget() {
        $id('chatWidget').hidden = true;
        $id('chatFab').classList.remove('is-hidden');
    }
    function clearChat() {
        $id('chatMessages').innerHTML = '';
        history = [];
        $id('chatSuggest').hidden = false;
        showWelcome();
    }

    // ── Init ─────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof SHIPS === 'undefined') return;
        injectWidget();

        $id('chatFab').addEventListener('click', openWidget);
        $id('chatClose').addEventListener('click', closeWidget);
        $id('chatClear').addEventListener('click', clearChat);

        const input = $id('chatInput');
        input.addEventListener('input', () => {
            $id('chatSend').disabled = input.value.trim().length === 0;
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 96) + 'px';
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input.value);
            }
        });
        $id('chatSend').addEventListener('click', () => sendMessage(input.value));
        $id('chatSuggest').addEventListener('click', e => {
            const chip = e.target.closest('.chat-chip');
            if (chip) sendMessage(chip.dataset.msg);
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !$id('chatWidget').hidden) closeWidget();
        });
    });

})();
