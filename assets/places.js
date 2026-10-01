// Lieux par défaut (coordonnées issues d'OpenStreetMap, sept. 2026).
// L'administrateur peut ajouter / renommer / déplacer ces lieux depuis
// l'espace Admin > « Lieux & carte » : la liste en base remplace alors celle-ci.
export const DEFAULT_PLACES = [
  // --- Fokontany / quartiers de la Commune urbaine de Diego Suarez ---
  { id: 'ambalakazaha',   nom: 'Ambalakazaha',        type: 'urbain', lat: -12.30740, lng: 49.29917 },
  { id: 'ambalavola',     nom: 'Ambalavola',          type: 'urbain', lat: -12.30751, lng: 49.28219 },
  { id: 'ambohimitsinjo', nom: 'Ambohimitsinjo',      type: 'urbain', lat: -12.30259, lng: 49.29057 },
  { id: 'avenir',         nom: 'Avenir',              type: 'urbain', lat: -12.28074, lng: 49.29380 },
  { id: 'bazarikely',     nom: 'Bazarikely',          type: 'urbain', lat: -12.28235, lng: 49.28983 },
  { id: 'cite-btm',       nom: 'Cité BTM',            type: 'urbain', lat: -12.31234, lng: 49.29234 },
  { id: 'cite-ouvriere',  nom: 'Cité Ouvrière',       type: 'urbain', lat: -12.29600, lng: 49.29744 },
  { id: 'grand-pavois',   nom: 'Grand Pavois',        type: 'urbain', lat: -12.29289, lng: 49.28754 },
  { id: 'lazaret-nord',   nom: 'Lazaret Nord',        type: 'urbain', lat: -12.28121, lng: 49.30204 },
  { id: 'lazaret-sud',    nom: 'Lazaret Sud',         type: 'urbain', lat: -12.28981, lng: 49.29869 },
  { id: 'mahatsara',      nom: 'Mahatsara',           type: 'urbain', lat: -12.29354, lng: 49.28154 },
  { id: 'mangarivotra',   nom: 'Mangarivotra',        type: 'urbain', lat: -12.28608, lng: 49.28025 },
  { id: 'morafeno',       nom: 'Morafeno',            type: 'urbain', lat: -12.30109, lng: 49.29812 },
  { id: 'place-kabary',   nom: 'Place Kabary (Centre-ville)', type: 'urbain', lat: -12.27185, lng: 49.29175 },
  { id: 'scama',          nom: 'SCAMA',               type: 'urbain', lat: -12.31949, lng: 49.29481 },
  { id: 'soafeno',        nom: 'Soafeno',             type: 'urbain', lat: -12.29486, lng: 49.29211 },
  { id: 'tanambao-nord',  nom: 'Tanambao Nord (Avaratra)', type: 'urbain', lat: -12.28649, lng: 49.29391 },
  { id: 'tanambao-sud',   nom: 'Tanambao Sud',        type: 'urbain', lat: -12.29004, lng: 49.29300 },
  { id: 'tanambao-3',     nom: 'Tanambao III',        type: 'urbain', lat: -12.28579, lng: 49.28928 },
  { id: 'tanambao-4',     nom: 'Tanambao IV',         type: 'urbain', lat: -12.28905, lng: 49.28923 },
  { id: 'tanambao-5',     nom: 'Tanambao V',          type: 'urbain', lat: -12.28813, lng: 49.28526 },
  { id: 'tanambao-tsena', nom: 'Tanambao Tsena (Marché)', type: 'urbain', lat: -12.28813, lng: 49.29208 },
  { id: 'tsaramandroso',  nom: 'Tsaramandroso',       type: 'urbain', lat: -12.29881, lng: 49.28269 },
  { id: 'villa-basse',    nom: 'Villa Basse',         type: 'urbain', lat: -12.27700, lng: 49.28826 },

  // --- Hors Diego : environs et villes de la région DIANA ---
  { id: 'aeroport',       nom: 'Aéroport Arrachart',  type: 'hors', lat: -12.34940, lng: 49.29170 },
  { id: 'anamakia',       nom: 'Anamakia',            type: 'hors', lat: -12.32527, lng: 49.25146 },
  { id: 'antanamitarana', nom: 'Antanamitarana',      type: 'hors', lat: -12.38048, lng: 49.30527 },
  { id: 'antongombato',   nom: 'Antongombato',        type: 'hors', lat: -12.37752, lng: 49.22735 },
  { id: 'ramena',         nom: 'Ramena (plage)',      type: 'hors', lat: -12.24243, lng: 49.34565 },
  { id: 'sakalava',       nom: 'Baie des Sakalava',   type: 'hors', lat: -12.27130, lng: 49.39273 },
  { id: 'sakaramy',       nom: 'Sakaramy',            type: 'hors', lat: -12.44824, lng: 49.26300 },
  { id: 'mahavanona',     nom: 'Mahavanona',          type: 'hors', lat: -12.43694, lng: 49.35887 },
  { id: 'joffreville',    nom: 'Joffreville (Montagne d’Ambre)', type: 'hors', lat: -12.49655, lng: 49.20321 },
  { id: 'andrafiabe',     nom: 'Andrafiabe',          type: 'hors', lat: -12.52773, lng: 49.40513 },
  { id: 'anivorano',      nom: 'Anivorano Nord',      type: 'hors', lat: -12.74160, lng: 49.23358 },
  { id: 'ambilobe',       nom: 'Ambilobe',            type: 'hors', lat: -13.19444, lng: 49.04996 },
  { id: 'ambanja',        nom: 'Ambanja',             type: 'hors', lat: -13.68145, lng: 48.45284 },
  { id: 'vohemar',        nom: 'Vohémar (Iharana)',   type: 'hors', lat: -13.35528, lng: 50.00706 }
];

export const DIEGO_CENTER = [-12.2900, 49.2920];
