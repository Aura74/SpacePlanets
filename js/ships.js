/* ============================================
   RYMDSKEPPSARKIVET – DATAMODELL
   En källa till sanning för alla skepp.
   ----------------------------------------------
   Fält:
   - length: meter (vedertagna källor)
   - crew:   numeriskt värde för stapeldiagram
   - crewText: visningstext
   - speedRating / weaponRating: 0–100 redaktionella bedömningar
   - image:  riktig bild (Wikimedia/fan-wiki). Laddas som lager ovanpå
             blueprint-siluetten; misslyckas den visas siluetten istället.
   - svg:    siluett (viewBox 0 0 100 X + path) för blueprint/skala
   ============================================ */

const SILHOUETTES = {
    falcon:    { vb: '0 0 100 70', d: 'M50 6c20 0 33 9 33 20 0 4-3 7-8 9l14 4c4 1 4 5 0 6l-18 3c-5 8-12 12-21 12s-16-4-21-12l-18-3c-4-1-4-5 0-6l14-4c-5-2-8-5-8-9 0-11 13-20 33-20zm22 23a5 5 0 100 10 5 5 0 000-10zm-44 0a5 5 0 100 10 5 5 0 000-10z' },
    xwing:     { vb: '0 0 100 60', d: 'M2 6l34 18v3l-30 2 30 3v3L2 56l36-16 8-3V18l-8-3zm44 6c2-3 6-5 10-5 7 0 13 5 13 12s-6 12-13 12c-4 0-8-2-10-5l46-6v-2z' },
    wedge:     { vb: '0 0 100 50', d: 'M4 24L92 4c5-1 8 2 6 6l-3 8 5 2c2 1 2 4 0 5l-9 3-2 5c-1 4-5 6-9 5L6 30c-3-1-3-5-2-6z' },
    enterprise:{ vb: '0 0 100 56', d: 'M50 4c16 0 29 7 29 15s-13 15-29 15c-7 0-13-1-18-4l-2 6 8 3-1 4-12-2-3 7-4-1 3-9-9 2-1-4 9-4-3-6c5-3 11-7 11-15 0-8 13-15 28-15zm0 6c-12 0-21 4-21 9s9 9 21 9 21-4 21-9-9-9-21-9z' },
    cube:      { vb: '0 0 100 100', d: 'M14 14h72v72H14zM30 14v72M50 14v72M70 14v72M14 30h72M14 50h72M14 70h72' },
    nostromo:  { vb: '0 0 100 60', d: 'M6 26l24-4 6-10h10l4 10 30 2c8 0 14 4 14 9s-6 9-14 9l-30 2-4 10H36l-6-10-24-4c-4-1-4-13 0-14zm70 0a5 5 0 100 10 5 5 0 000-10z' },
    serenity:  { vb: '0 0 100 62', d: 'M8 31c0-9 9-15 22-15h30c14 0 24 5 24 12 0 3-2 5-5 7l13 3c3 1 3 5 0 6l-15 2c-4 5-12 8-22 8H30C17 54 8 47 8 38zm60-8l18-12c3-2 6 1 5 4l-4 12zm0 18l18 12c3 2 6-1 5-4l-4-12z' },
    discovery: { vb: '0 0 100 44', d: 'M2 20c0-7 5-12 12-12s12 5 12 12-5 12-12 12S2 27 2 20zm24 0h54l4-4h6v8h-6l-4-4zm54-3h14v6H80z' },
    galactica: { vb: '0 0 100 50', d: 'M2 18l20-10 8 6h44l6-6 12 4c4 1 4 4 0 5l-8 2 8 2c4 1 4 4 0 5l-12 4-6-6H30l-8 6-20-10c-3-1-3-12 0-13zm26 2h40v8H28z' },
    rocinante: { vb: '0 0 100 40', d: 'M4 20l16-8 4-5h8l3 5h40c12 0 20 4 20 8s-8 8-20 8H35l-3 5h-8l-4-5-16-8c-2-1-2-2 0-3zm78-2l14 2v4l-14 2z' },
    normandy:  { vb: '0 0 100 52', d: 'M4 26l22-6 5-8h10l4 8h22l8-6 18 4c4 1 4 4 0 5l-6 3 6 3c4 1 4 4 0 5l-18 4-8-6H45l-4 8H31l-5-8-22-6c-3-1-3-6 0-7zm20-4l-8-10 14 6zm0 12l-8 10 14-6z' },
    voyager:   { vb: '0 0 100 50', d: 'M6 22c0-7 9-12 22-12 10 0 19 3 23 8l8-2-2-9 5-1 3 10 16 5c4 1 4 5 0 6l-16 5-3 10-5-1 2-9-8-2c-4 5-13 8-23 8-13 0-22-5-22-12z' }
};

const SHIPS = [
    {
        id: 'millennium-falcon', name: 'Millennium Falcon', short: 'Falcon',
        franchise: 'Star Wars', franchiseId: 'starwars', origin: 'Star Wars (1977)',
        klass: 'YT-1300, modifierad lättfraktare', role: 'Smuggling & frakt', year: 1977,
        length: 34.75, crew: 4, crewText: '2–4 + passagerare',
        ftl: 'Hyperdrift, klass 0,5', speedRating: 90, weaponRating: 58,
        accent: '#f2c14e', sil: 'falcon',
        image: 'https://upload.wikimedia.org/wikipedia/en/8/8d/A_screenshot_from_Star_Wars_Episode_IV_A_New_Hope_depicting_the_Millennium_Falcon.jpg',
        desc: 'Han Solos modifierade fraktare – "the ship that made the Kessel Run in less than twelve parsecs". Under det skranliga skalet döljer sig en av galaxens snabbaste farkoster, ständigt på gränsen till haveri men aldrig besegrad.',
        quote: 'She may not look like much, but she\'s got it where it counts.'
    },
    {
        id: 'x-wing', name: 'T-65 X-wing', short: 'X-wing',
        franchise: 'Star Wars', franchiseId: 'starwars', origin: 'Star Wars (1977)',
        klass: 'T-65B rymdjaktplan', role: 'Jakt- & attackplan', year: 1977,
        length: 12.5, crew: 1, crewText: '1 pilot + astromech',
        ftl: 'Hyperdrift, klass 1', speedRating: 82, weaponRating: 70,
        accent: '#ff7a45', sil: 'xwing',
        image: 'https://upload.wikimedia.org/wikipedia/en/7/7b/X-wing.jpg',
        desc: 'Rebellalliansens arbetshäst, döpt efter sina S-formade vingar som öppnas i attackläge. Det var en X-wing som sköt den avgörande protontorpeden ner i Dödsstjärnans ventilationsschakt.',
        quote: 'Lås S-vingarna i attackposition.'
    },
    {
        id: 'star-destroyer', name: 'Imperial Star Destroyer', short: 'Star Destroyer',
        franchise: 'Star Wars', franchiseId: 'starwars', origin: 'Star Wars (1977)',
        klass: 'Imperial I-klass slagskepp', role: 'Slagskepp & flaggskepp', year: 1977,
        length: 1600, crew: 37000, crewText: '~37 000 + 9 700 trupp',
        ftl: 'Hyperdrift, klass 2', speedRating: 55, weaponRating: 96,
        accent: '#9fb3c8', sil: 'wedge',
        image: 'https://static.wikia.nocookie.net/starwars/images/9/9d/ImperialStarDestroyer-RFGE.png/revision/latest?cb=20240803160040',
        desc: 'Den kilformade siluetten som glider in över skärmen i öppningsscenen och definierade kejsardömets makt. Över en och en halv kilometer lång, bestyckad med tunga turbolaser och full av TIE-jaktplan.',
        quote: 'En symbol för kejsardömets järnhand över galaxen.'
    },
    {
        id: 'enterprise-d', name: 'USS Enterprise NCC-1701-D', short: 'Enterprise-D',
        franchise: 'Star Trek', franchiseId: 'startrek', origin: 'The Next Generation (1987)',
        klass: 'Galaxy-klass utforskningsskepp', role: 'Utforskning & diplomati', year: 1987,
        length: 642.5, crew: 1014, crewText: '~1 014 (inkl. familjer)',
        ftl: 'Warpdrift, max warp 9,6', speedRating: 80, weaponRating: 74,
        accent: '#5b8cff', sil: 'enterprise',
        image: 'https://upload.wikimedia.org/wikipedia/en/5/58/Enterprise_Forward.jpg',
        desc: 'Federationens flytande stad under kapten Picard. Ett utforskningsskepp där hela familjer levde ombord, byggt för diplomati lika mycket som försvar – med ett separerbart stridsavsnitt vid fara.',
        quote: 'Att gå dit ingen människa har gått förut.'
    },
    {
        id: 'voyager', name: 'USS Voyager NCC-74656', short: 'Voyager',
        franchise: 'Star Trek', franchiseId: 'startrek', origin: 'Voyager (1995)',
        klass: 'Intrepid-klass', role: 'Vetenskap & långfärd', year: 1995,
        length: 344, crew: 150, crewText: '~150',
        ftl: 'Warpdrift, max warp 9,975', speedRating: 84, weaponRating: 68,
        accent: '#7aa5ff', sil: 'voyager',
        image: 'https://upload.wikimedia.org/wikipedia/en/7/70/Feature-voyager-starboard2-bonchune-large.jpg',
        desc: 'Slungad 70 000 ljusår hemifrån till Deltakvadranten. Ett mindre, snabbare skepp med rörliga warpnaceller och bio-neurala kretsar, tvunget att klara sig på egen hand under en decennielång resa hem.',
        quote: 'Det finns kaffe i den där nebulosan.'
    },
    {
        id: 'borg-cube', name: 'Borg-kub', short: 'Borg-kub',
        franchise: 'Star Trek', franchiseId: 'startrek', origin: 'TNG: "Q Who" (1989)',
        klass: 'Borg taktisk kub', role: 'Assimilering & erövring', year: 1989,
        length: 3000, crew: 64000, crewText: 'Tiotusentals drönare',
        ftl: 'Transwarp', speedRating: 78, weaponRating: 99,
        accent: '#67e8b0', sil: 'cube',
        image: 'https://static.wikia.nocookie.net/memoryalpha/images/f/fd/Borg_cube%2C_2384.jpg/revision/latest?cb=20221204213450&path-prefix=en',
        desc: 'Ingen brygga, ingen kapten, ingen rädsla. En tre kilometer stor kub utan front eller akter, med ett kollektivt medvetande. Skador läker av sig själva. "Motstånd är meningslöst."',
        quote: 'Vi är Borg. Motstånd är meningslöst.'
    },
    {
        id: 'nostromo', name: 'USCSS Nostromo', short: 'Nostromo',
        franchise: 'Alien', franchiseId: 'classic', origin: 'Alien (1979)',
        klass: 'Lockmart CM-88B bogserare', role: 'Kommersiell malmtransport', year: 1979,
        length: 243, crew: 7, crewText: '7',
        ftl: 'Hyperdrift (cryo-sömn)', speedRating: 40, weaponRating: 8,
        accent: '#e8a13a', sil: 'nostromo',
        image: 'https://static.wikia.nocookie.net/avp/images/c/c5/Img4.jpg/revision/latest?cb=20131021025529',
        desc: 'En sliten industriell bogserare som drar en enorm raffinaderilast genom rymden. Inget krigsskepp – bara sju arbetare, en katt och en organism ingen av dem borde ha släppt ombord.',
        quote: 'In space, no one can hear you scream.'
    },
    {
        id: 'serenity', name: 'Serenity', short: 'Serenity',
        franchise: 'Firefly', franchiseId: 'classic', origin: 'Firefly (2002)',
        klass: 'Firefly-klass transportskepp', role: 'Frakt & smuggling', year: 2002,
        length: 82, crew: 9, crewText: '9',
        ftl: 'Ingen FTL (sublight)', speedRating: 52, weaponRating: 18,
        accent: '#d98e5a', sil: 'serenity',
        image: 'https://upload.wikimedia.org/wikipedia/en/1/11/Serenityship.jpg',
        desc: 'Ett hem lika mycket som ett skepp. Den obeväpnade Firefly-fraktaren tar kapten Mal och hans brokiga besättning runt randen av civilisationen – glödande akter, ingen radarsignatur värd namnet, och en orubblig vägran att ge upp.',
        quote: 'I aim to misbehave.'
    },
    {
        id: 'discovery-one', name: 'Discovery One', short: 'Discovery One',
        franchise: '2001', franchiseId: 'classic', origin: '2001: A Space Odyssey (1968)',
        klass: 'Interplanetärt forskningsskepp', role: 'Bemannad Jupiter-expedition', year: 1968,
        length: 140, crew: 5, crewText: '5 (+ HAL 9000)',
        ftl: 'Ingen FTL (kärnpuls)', speedRating: 22, weaponRating: 4,
        accent: '#cfd6e0', sil: 'discovery',
        image: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Discovery_One_from_trailer_of_2001_A_Space_Odyssey_%281968%29.png',
        desc: 'Kubricks ryggradsformade skepp med roterande boendekula. Vetenskapligt trovärdigt långt före sin tid – tyst, sterilt och styrt av den mjukröstade AI:n HAL 9000, vars haveri blev filmhistoriens mest oroande.',
        quote: 'I\'m sorry, Dave. I\'m afraid I can\'t do that.'
    },
    {
        id: 'galactica', name: 'Battlestar Galactica', short: 'Galactica',
        franchise: 'Battlestar Galactica', franchiseId: 'modern', origin: 'BSG (2004)',
        klass: 'Battlestar (hangarfartyg)', role: 'Hangarfartyg & flyktledare', year: 2004,
        length: 1438, crew: 2500, crewText: '~2 500 + flygkår',
        ftl: 'FTL-hopp', speedRating: 60, weaponRating: 88,
        accent: '#8fa3b3', sil: 'galactica',
        image: 'https://static.wikia.nocookie.net/galactica/images/7/76/Jupiter-class_Transparent.png/revision/latest?cb=20241020063545',
        desc: 'Ett åldrande slagskepp på väg att bli museum – tills cylonerna utplånade människans tolv kolonier. Galactica blir den sista beväpnade eskorten för mänsklighetens spillra, byggd robust nog att överleva när högteknologin svek.',
        quote: 'So say we all.'
    },
    {
        id: 'rocinante', name: 'Rocinante', short: 'Rocinante',
        franchise: 'The Expanse', franchiseId: 'modern', origin: 'The Expanse (2015)',
        klass: 'MCRN korvett (kapad)', role: 'Multiroll-stridsskepp', year: 2015,
        length: 46, crew: 4, crewText: '4 kärnbesättning',
        ftl: 'Ingen FTL (Epstein-drift)', speedRating: 70, weaponRating: 64,
        accent: '#46c79a', sil: 'rocinante',
        image: 'https://static.wikia.nocookie.net/expanse/images/5/54/RociArtS4.png/revision/latest?cb=20220113235011',
        desc: 'Den hårdast vetenskapligt grundade farkosten på listan. En kapad mars-korvett driven av Epstein-fusion – ingen warp, ingen ljudeffekt i vakuum, bara g-krafter, reaktionsmassa och en besättning som blir en familj.',
        quote: 'Vi tar hand om vår egen.'
    },
    {
        id: 'normandy-sr2', name: 'Normandy SR-2', short: 'Normandy',
        franchise: 'Mass Effect', franchiseId: 'modern', origin: 'Mass Effect 2 (2010)',
        klass: 'Fregatt med smygteknik', role: 'Spaning & specialuppdrag', year: 2010,
        length: 216, crew: 30, crewText: '~30+',
        ftl: 'Massreduktion-kärna + reläer', speedRating: 86, weaponRating: 72,
        accent: '#5ad1e6', sil: 'normandy',
        image: 'https://upload.wikimedia.org/wikipedia/en/a/a9/Mass_Effect_Normandy_SR-1.png',
        desc: 'Commander Shepards fregatt med ett element-zero-drivverk som låter skeppet glida fram osynligt för värmesökare. En av spelvärldens mest ikoniska farkoster, hemmabas mellan uppdrag att rädda galaxen.',
        quote: 'Normandy redo att lyfta.'
    }
];

const FRANCHISE_LABEL = {
    starwars: 'Star Wars',
    startrek: 'Star Trek',
    classic: 'Klassiker',
    modern: 'Modern'
};

window.SHIPS = SHIPS;
window.SILHOUETTES = SILHOUETTES;
window.FRANCHISE_LABEL = FRANCHISE_LABEL;
