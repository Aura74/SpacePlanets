# Rymdskeppsarkivet

En premium, filmisk samlingssida som jämför science fiction-historiens mest ikoniska rymdskepp – från *Millennium Falcon* till *Rocinante*. Ställ skepp mot skepp, jämför storlek, besättning och eldkraft, och utforska genrens tidslinje. Seriös och redaktionell ton, mörkt/ljust tema och tre prestandalägen.

> Tidigare projekt: en barnvänlig solsystemssida. Helt ombyggt 2026.

---

## Tech Stack

| Del | Val |
|---|---|
| **Typografi** | Space Grotesk (display) + Inter (brödtext) |
| **Ikoner** | Font Awesome 6.5.1 |
| **Scroll-animationer** | AOS 2.3.4 |
| **AI-chat** | Google Gemini (REST, `gemini-flash-latest` med fallback) + lokal offline-hjärna |
| **PWA** | manifest.json + versionerad network-first service worker |
| **Fysik / övrigt** | Inga – ren vanilla HTML/CSS/JS |
| **Build** | Ingen. Öppna `index.html` eller `npx serve .` |

### CDN-includes
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css">
```

---

## Projektstruktur
```
SpacePlanets/
├── index.html        # Allt innehållsskelett + inline tema/perf-script i <head>
├── css/style.css     # All styling (tokens, dark/light, perf-lägen, chat, responsivt)
├── js/ships.js       # DATAMODELL: alla 12 skepp + siluetter + ARCHIVE_PICKS (en källa till sanning)
├── js/main.js        # Tema, perf, stjärnfält, galleri, modal, duell, skala, tidslinje, PWA-registrering
├── js/chat.js        # "Arkivarien" – AI-skeppsexpert (Gemini + lokal fallback)
├── sw.js             # Service worker (network-first, versionerad – se PWA nedan)
├── manifest.json     # PWA-manifest (installerbar app)
├── images/icons/     # App-ikoner 192/512
└── README.md
```

## AI-chatten "Arkivarien"

Flytande knapp nere till höger (astronaut-ikon). Gemini-driven skeppsexpert som kan arkivets faktabas (systemprompten byggs runtime från `SHIPS`-datan i ships.js).

- **Modellkedja:** `gemini-flash-latest` → `gemini-flash-lite-latest` → **lokal offline-hjärna** som svarar ur skeppsdatan (summeringar, jämförelser, snabbast/störst/eldkraft). Chatten fungerar alltså även helt utan nätverk.
- API-nyckeln ligger i `js/chat.js` (klient-side – ok för lokal demo, flytta till backend-proxy vid publicering).
- Typewriter-effekten stängs av i Lätt-läget. Escape stänger. Fullskärm på mobil (≤480px).

## PWA (installerbar + offline)

Sidan är en installerbar PWA med en **medvetet "fällsäker" service worker** (bakgrund: en kvarglömd SW från ett annat projekt på `127.0.0.1:5500` serverade en månad gammal cache – det får inte hända igen):

- **Network-first för allt på samma origin** → sidan kan ALDRIG fastna i gammal cache. Cachen används bara offline.
- **Stale-while-revalidate** för externa CDN/bilder → senast sedda foton visas offline.
- Rör aldrig POST (Gemini-API:et påverkas inte) och rensar **bara sina egna** versionscachar (`rymdskeppsarkivet-*`), aldrig andra projekts på samma origin.
- **Vid större ändringar: bumpa `VERSION` i sw.js** (t.ex. `-v2`), så städas gammalt automatiskt.
- SW registreras bara över http(s) – öppnas `index.html` via `file://` funkar sidan precis som vanligt, utan SW.

---

## Sektioner

| # | Sektion | Beskrivning |
|---|---|---|
| 1 | **Hero** | Canvas-stjärnfält (parallax i Max) + grid, rubrik, statremsa. |
| 2 | **Flottan** | Sökfält + filterchips (FLIP-animation), 12 skeppskort. Klick öppnar detalj-modal. |
| 3 | **Arkivets val** | 4 redaktionella topplistor i magazine-layout (data: `ARCHIVE_PICKS` i ships.js). |
| 4 | **Jämför (Duell)** | Välj två skepp → staplar + verdikt. **Delbar länk** `?duel=<idA>-vs-<idB>` + kopiera-knapp. |
| 5 | **Storleksskala** | Alla skepp i relativ skala (kvadratrot), från X-wing till Borg-kub. |
| 6 | **Citat** | 12 repliker i horisontell scroll-snap-vägg. |
| 7 | **Tidslinje** | När varje skepp debuterade på film/TV (1968–2015). |
| 8 | **Footer** | Källor (Memory Alpha, Wookieepedia m.fl.), länkar, social. |

### Detalj-modalen
Öppnas från Flottan/Arkivets val. Innehåller beskrivning, citat, spec-grid (inkl. tillverkare), **Bestyckning**, **Känd för** (tre scener), **Källor** (länkar per skepp) samt bläddring ‹ › längst ner. Piltangenter vä/hö bläddrar mellan skepp, Tab är fokus-fällad, Escape stänger. I Max-läget animeras bytet med View Transitions API (Chrome).

### Skeppen (12)
Star Wars: Millennium Falcon, T-65 X-wing, Imperial Star Destroyer ·
Star Trek: USS Enterprise-D, USS Voyager, Borg-kub ·
Klassiker: USCSS Nostromo (*Alien*), Serenity (*Firefly*), Discovery One (*2001*) ·
Modern: Battlestar Galactica, Rocinante (*The Expanse*), Normandy SR-2 (*Mass Effect*).

---

## Designsystem

| Token | Mörkt | Ljust |
|---|---|---|
| `--bg` | `#070910` | `#eef1f6` |
| `--surface` | `#11151f` | `#ffffff` |
| `--accent` (warp-cyan) | `#5ad1e6` | `#0f8aa0` |
| Text | `#eaeef6` | `#121826` |

- **Radius:** 4px / 6px (aldrig SaaS-runda hörn)
- **Skuggor:** fleralager, mörka och mjuka (`--shadow`, `--shadow-lg`, `--glow`)
- **Franchise-accenter:** varje skepp har en egen `accent`-färg (i `ships.js`) som driver kort-glow, taggar, skala-staplar och tidslinje-markörer via CSS-variabeln `--ship-accent`.
- **Eyebrows** med flankerande linjer (uppercase, accentfärg).

---

## Bilder (viktigt)

Riktiga skeppsbilder är upphovsrättsskyddade. Lösningen är **progressiv förbättring**:

1. Varje kort/modal renderar först en **SVG-blueprint-siluett** (i `ships.js` → `SILHOUETTES`).
2. Ovanpå läggs en `<img>` mot URL:en i skeppets `image`-fält.
3. **Laddas bilden** → den tonas in över siluetten. **404/blockerad** → `img` tas bort och siluetten blir kvar. Aldrig en trasig bild-ikon.

**Alla 12 skepp har verifierade riktiga bilder** (HTTP 200). 7 från Wikipedia (`upload.wikimedia.org`), 5 från Fandom-wikis (`static.wikia.nocookie.net`: Star Destroyer, Borg-kub, Nostromo, Galactica, Rocinante). Laddar en bild inte faller kortet tillbaka till blueprint-siluetten.

> Bilderna är upphovsrättsskyddade (fair use). Helt ok för **privat, lokal** visning. Ska sidan **publiceras** – byt till egna/licensierade bilder eller sätt `image: ''` på alla skepp för att köra rena siluetter.

Byt bild på valfritt skepp via `image`-fältet i `js/ships.js`:
- lägg en fil i `images/` och peka `image: 'images/falcon.jpg'`, eller
- klistra in en fungerande URL, eller
- sätt `image: ''` för att tvinga fram siluetten.

Allt är data-drivet – inget behöver röras i HTML/CSS.

---

## Tema & Prestandalägen

- **Tema:** sol/måne-knapp i navbar. Sparas i `localStorage['theme']` (`dark`/`light`). Inline-script i `<head>` sätter `data-theme` **före paint** (ingen blink).
- **Prestanda:** segmentkontroll **Lätt / Standard / Max** i navbar. Sparas i `localStorage['spaceships:perfMode']`.
  - **Lätt:** stjärnfält av, ingen blur/skuggor, AOS av, inga hovers, ingen FLIP/shimmer. För tröga datorer.
  - **Standard:** stjärnfält (180 stjärnor), AOS, skuggor, FLIP, shimmer.
  - **Max:** tätare stjärnfält (320) + skjutstjärnor + scroll-parallax i 3 djuplager, gradient-rubrik, siluetter som ritas (stroke-animation), View Transitions i modalen.
  - **Auto** (default vid första besök) väljer Lätt/Standard via `hardwareConcurrency`/`deviceMemory`/`saveData`.
  - **FPS-vakt:** mäter ~2,5 s efter load; under 45 FPS föreslås Lätt via en artig banner (en gång per session, **endast i auto-läge** – tjatar inte på den som valt själv).
  - Väljaren finns i navbaren på desktop och **inne i mobilmenyn** på ≤1024px.

> Ingen Lenis – sidan använder native smooth scroll (Lenis presterar dåligt på måldatorn).

---

## How to Run
```bash
# enklast
öppna index.html i webbläsaren   # allt utom PWA/offline fungerar

# lokal server (krävs för PWA/service worker)
npx serve .
```

---

## Customization

| Vad | Var |
|---|---|
| Lägg till / ändra skepp | `js/ships.js` → `SHIPS`-arrayen (+ siluett i `SILHOUETTES`) |
| Byt bild på ett skepp | `image`-fältet i `ships.js` |
| Mätvärden i duellen | `DUEL_METRICS` i `js/main.js` |
| Färger / tema | `:root` och `:root[data-theme="light"]` i `css/style.css` |
| Stjärntäthet | `density` i `initStarField` (`js/main.js`) |

---

## Mobil / Responsivt

Brytpunkter **1200 / 1024 / 768 / 480**.
- ≤1024px: hamburgermeny — helhöjds slide-in-panel (`100dvh` + `100vh`-fallback) med **egen stäng-knapp (X)**, scrim bakom, scroll-lås och Escape/klick-utanför-stängning. Hamburgaren döljs medan menyn är öppen. **Effekt-väljaren ligger inne i menypanelen** (navbarens döljs).
- ≤768px: duell-väljare staplas, skala-rader blir en kolumn.
- ≤480px: galleri och footer blir en kolumn.
- Inga fasta pixelbredder, ingen horisontell scroll.

---

## Browser support
Chrome 90+, Firefox 88+, Safari 14+. Använder `color-mix()`, `aspect-ratio`, `backdrop-filter`, `100dvh` – med fallbacks där det behövs.

---

*Inte anslutet till något filmbolag. Alla skepp, namn och varumärken tillhör respektive rättighetsinnehavare.*
