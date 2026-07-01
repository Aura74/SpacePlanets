# Rymdskeppsarkivet

En premium, filmisk samlingssida som jämför science fiction-historiens mest ikoniska rymdskepp – från *Millennium Falcon* till *Rocinante*. Ställ skepp mot skepp, jämför storlek, besättning och eldkraft, och utforska genrens tidslinje. Seriös och redaktionell ton, mörkt/ljust tema och tre prestandalägen.

> Tidigare projekt: en barnvänlig solsystemssida. Helt ombyggt 2026.

---

## Tech Stack

| Del | Val |
|---|---|
| **Typografi** | Space Grotesk (display) + Inter (brödtext) |
| **Ikoner** | Font Awesome 6.5.1 |
| **Karuseller** | Swiper 11 *(laddad, redo för framtida bruk)* |
| **Scroll-animationer** | AOS 2.3.4 |
| **Fysik / övrigt** | Inga – ren vanilla HTML/CSS/JS |
| **Build** | Ingen. Öppna `index.html` eller `npx serve .` |

### CDN-includes
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css">
```

---

## Projektstruktur
```
SpacePlanets/
├── index.html        # Allt innehållsskelett + inline tema/perf-script i <head>
├── css/style.css     # All styling (tokens, dark/light, perf-lägen, responsivt)
├── js/ships.js       # DATAMODELL: alla 12 skepp + SVG-siluetter (en källa till sanning)
├── js/main.js        # Tema, perf, stjärnfält, galleri, modal, duell, skala, tidslinje
├── images/           # Lägg egna skeppsbilder här (se Bilder nedan)
└── README.md
```

---

## Sektioner

| # | Sektion | Beskrivning |
|---|---|---|
| 1 | **Hero** | Canvas-stjärnfält + grid, rubrik, statremsa (12 skepp / 8 universum / 57 år). |
| 2 | **Flottan** | Galleri med 12 skeppskort, filtrerbart per universum. Klick öppnar detalj-modal. |
| 3 | **Jämför (Duell)** | Välj två skepp → animerade staplar för längd, besättning, hastighet, eldkraft + verdikt. |
| 4 | **Storleksskala** | Alla skepp ritade i relativ skala (kvadratrot), från X-wing till Borg-kub. |
| 5 | **Tidslinje** | När varje skepp debuterade på film/TV (1968–2015). |
| 6 | **Footer** | Källor (Memory Alpha, Wookieepedia m.fl.), länkar, social. |

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
  - **Lätt:** stjärnfält av, ingen blur/skuggor, AOS av, inga hovers. För tröga datorer.
  - **Standard:** stjärnfält (180 stjärnor), AOS, skuggor.
  - **Max:** tätare stjärnfält (320) + skjutstjärnor, gradient-rubrik.
  - **Auto** (default vid första besök) väljer Lätt/Standard via `hardwareConcurrency`/`deviceMemory`/`saveData`.
  - **FPS-vakt:** mäter ~2,5 s efter load; under 45 FPS föreslås Lätt via en artig banner (en gång per session).

> Ingen Lenis – sidan använder native smooth scroll (Lenis presterar dåligt på måldatorn).

---

## How to Run
```bash
# enklast
öppna index.html i webbläsaren

# eller lokal server
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
- ≤1024px: hamburgermeny (helhöjds slide-in-panel, `100dvh`), perf-switch döljs.
- ≤768px: duell-väljare staplas, skala-rader blir en kolumn.
- ≤480px: galleri och footer blir en kolumn.
- Inga fasta pixelbredder, ingen horisontell scroll.

---

## Browser support
Chrome 90+, Firefox 88+, Safari 14+. Använder `color-mix()`, `aspect-ratio`, `backdrop-filter`, `100dvh` – med fallbacks där det behövs.

---

*Inte anslutet till något filmbolag. Alla skepp, namn och varumärken tillhör respektive rättighetsinnehavare.*
