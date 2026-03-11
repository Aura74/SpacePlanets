# Rymdäventyret – Utforska Vårt Solsystem

En interaktiv, vetenskapligt korrekt och barnvänlig webbplats om rymden, vårt solsystem, planeterna, månen och de historiska månlandningarna.

## Funktioner

### Innehåll
- **Solsystem-animation** – CSS-animerad modell med alla 8 planeter i omloppsbana
- **Planetkort** – Expanderbara kort med fakta om varje planet (Merkurius → Neptunus)
- **Månen** – Detaljerad sektion om Jordens måne med faser och fakta
- **Månlandningar** – Karusell med alla Apollo-uppdrag (Apollo 11–17)
- **Rymdhistoria** – Tidslinje med viktiga milstolpar (1957–2021)
- **Roliga fakta** – Karusell med fascinerande rymdfakta

### Interaktivitet
- **Gravitationslabb** – Matter.js-driven fysikmotor där du kan:
  - Klicka för att släppa bollar med realistisk gravitation
  - Byta mellan olika planeters gravitation (Månen, Mars, Jorden, Jupiter, Rymden)
  - Dra och släppa bollar med musen
  - Trycka på "Bollregn" för massutlösning
- **Animerad stjärnhimmel** – Canvas-baserat stjärnfält med skjutstjärnor
- **Scroll-animationer** – AOS (Animate On Scroll) för mjuka övergångar
- **Mus-effekter** – Sparkle-trail vid snabb musrörelse
- **Konami-kod** – Hemligt rymd-firande (↑↑↓↓←→←→BA)
- **Parallax-astronaut** – Flytande astronaut som reagerar på mus och scroll

### Karuseller
- Månlandningar (Swiper.js)
- Roliga rymdfakta (Swiper.js)

### Design
- Mörkt rymdtema med neon-accenter
- Responsiv design (mobil, surfplatta, desktop)
- Google Fonts: Orbitron (rubriker) + Nunito (brödtext)
- Font Awesome ikoner
- CSS-animerade planetsfärer med realistiska färger

## Teknisk Stack

| Bibliotek | Version | Användning |
|-----------|---------|------------|
| [Matter.js](https://brm.io/matter-js/) | 0.19.0 | Fysikmotor för gravitationslabb |
| [Swiper](https://swiperjs.com/) | 11 | Karuseller |
| [AOS](https://michalsnik.github.io/aos/) | 2.3.4 | Scroll-animationer |
| [Font Awesome](https://fontawesome.com/) | 6.5.1 | Ikoner |
| [Google Fonts](https://fonts.google.com/) | – | Orbitron & Nunito |

## Filstruktur

```
SpacePlanets/
├── index.html          # Huvudsida (allt i en fil)
├── css/
│   └── style.css       # Alla stilmallar
├── js/
│   ├── main.js         # Navigering, animationer, karuseller
│   └── gravity.js      # Matter.js gravitationslabb
├── images/             # Bildmapp (bilder laddas via CDN)
└── README.md           # Denna fil
```

## Starta

1. Öppna `index.html` i en webbläsare
2. Alternativt, starta en lokal server:
   ```bash
   npx serve .
   # eller
   python -m http.server 8000
   ```

## Vetenskapliga källor

- Planetdata baserad på NASA Planetary Fact Sheet
- Månlandningsdata från NASA Apollo Mission Archives
- Alla siffror och fakta är vetenskapligt verifierade

## Språk

Webbplatsen är skriven på **svenska** och riktar sig till barn och ungdomar som vill lära sig om rymden.

## Licens

Fritt att använda och modifiera för utbildningssyfte.
