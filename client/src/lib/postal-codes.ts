// Base de données des codes postaux et communes de France
// Source: Base officielle des codes postaux (données publiques)

// Type pour les entrées de la base de données de codes postaux
export type CodePostalEntry = {
  codePostal: string;
  villes: string[];
};

// Type pour le format de stockage optimisé (Map)
type CodePostalMap = Record<string, string[]>;

// Conversion du tableau en Map pour un accès optimisé
const buildCodePostalMap = (entries: CodePostalEntry[]): CodePostalMap => {
  const map: CodePostalMap = {};
  for (const entry of entries) {
    map[entry.codePostal] = entry.villes;
  }
  return map;
};

// Nous importerons les données complètes depuis un JSON externe
// Pour l'instant, nous incluons un petit échantillon pour les tests
const codePostalData: CodePostalEntry[] = [
  { codePostal: "75000", villes: ["Paris"] },
  { codePostal: "75001", villes: ["Paris 1er Arrondissement"] },
  { codePostal: "75002", villes: ["Paris 2ème Arrondissement"] },
  { codePostal: "75003", villes: ["Paris 3ème Arrondissement"] },
  { codePostal: "75004", villes: ["Paris 4ème Arrondissement"] },
  { codePostal: "75005", villes: ["Paris 5ème Arrondissement"] },
  { codePostal: "75006", villes: ["Paris 6ème Arrondissement"] },
  { codePostal: "75007", villes: ["Paris 7ème Arrondissement"] },
  { codePostal: "75008", villes: ["Paris 8ème Arrondissement"] },
  { codePostal: "75009", villes: ["Paris 9ème Arrondissement"] },
  { codePostal: "75010", villes: ["Paris 10ème Arrondissement"] },
  { codePostal: "75011", villes: ["Paris 11ème Arrondissement"] },
  { codePostal: "75012", villes: ["Paris 12ème Arrondissement"] },
  { codePostal: "75013", villes: ["Paris 13ème Arrondissement"] },
  { codePostal: "75014", villes: ["Paris 14ème Arrondissement"] },
  { codePostal: "75015", villes: ["Paris 15ème Arrondissement"] },
  { codePostal: "75016", villes: ["Paris 16ème Arrondissement"] },
  { codePostal: "75017", villes: ["Paris 17ème Arrondissement"] },
  { codePostal: "75018", villes: ["Paris 18ème Arrondissement"] },
  { codePostal: "75019", villes: ["Paris 19ème Arrondissement"] },
  { codePostal: "75020", villes: ["Paris 20ème Arrondissement"] },
  
  { codePostal: "13000", villes: ["Marseille"] },
  { codePostal: "13001", villes: ["Marseille 1er Arrondissement"] },
  { codePostal: "13002", villes: ["Marseille 2ème Arrondissement"] },
  { codePostal: "13003", villes: ["Marseille 3ème Arrondissement"] },
  { codePostal: "13004", villes: ["Marseille 4ème Arrondissement"] },
  { codePostal: "13005", villes: ["Marseille 5ème Arrondissement"] },
  { codePostal: "13006", villes: ["Marseille 6ème Arrondissement"] },
  { codePostal: "13007", villes: ["Marseille 7ème Arrondissement"] },
  { codePostal: "13008", villes: ["Marseille 8ème Arrondissement"] },
  { codePostal: "13009", villes: ["Marseille 9ème Arrondissement"] },
  { codePostal: "13010", villes: ["Marseille 10ème Arrondissement"] },
  { codePostal: "13011", villes: ["Marseille 11ème Arrondissement"] },
  { codePostal: "13012", villes: ["Marseille 12ème Arrondissement"] },
  { codePostal: "13013", villes: ["Marseille 13ème Arrondissement"] },
  { codePostal: "13014", villes: ["Marseille 14ème Arrondissement"] },
  { codePostal: "13015", villes: ["Marseille 15ème Arrondissement"] },
  { codePostal: "13016", villes: ["Marseille 16ème Arrondissement"] },
  
  { codePostal: "69000", villes: ["Lyon"] },
  { codePostal: "69001", villes: ["Lyon 1er Arrondissement"] },
  { codePostal: "69002", villes: ["Lyon 2ème Arrondissement"] },
  { codePostal: "69003", villes: ["Lyon 3ème Arrondissement"] },
  { codePostal: "69004", villes: ["Lyon 4ème Arrondissement"] },
  { codePostal: "69005", villes: ["Lyon 5ème Arrondissement"] },
  { codePostal: "69006", villes: ["Lyon 6ème Arrondissement"] },
  { codePostal: "69007", villes: ["Lyon 7ème Arrondissement"] },
  { codePostal: "69008", villes: ["Lyon 8ème Arrondissement"] },
  { codePostal: "69009", villes: ["Lyon 9ème Arrondissement"] },
  
  { codePostal: "33000", villes: ["Bordeaux"] },
  { codePostal: "59000", villes: ["Lille"] },
  { codePostal: "31000", villes: ["Toulouse"] },
  { codePostal: "44000", villes: ["Nantes"] },
  { codePostal: "67000", villes: ["Strasbourg"] },
  { codePostal: "34000", villes: ["Montpellier"] },
  { codePostal: "06000", villes: ["Nice"] },
  { codePostal: "29200", villes: ["Brest"] },
  { codePostal: "35000", villes: ["Rennes"] },
  { codePostal: "83000", villes: ["Toulon"] },
  { codePostal: "83130", villes: ["La Garde"] },
  { codePostal: "83136", villes: ["Rocbaron", "Forcalqueiret", "Sainte-Anastasie-sur-Issole", "La Roquebrussanne"] },
  { codePostal: "83140", villes: ["Six-Fours-les-Plages", "Ollioules"] },
  { codePostal: "83330", villes: ["Le Beausset", "Le Castellet"] },
  { codePostal: "83400", villes: ["Hyères"] },
  { codePostal: "83500", villes: ["La Seyne-sur-Mer"] },
  { codePostal: "87000", villes: ["Limoges"] },
  { codePostal: "51100", villes: ["Reims"] },
  { codePostal: "54000", villes: ["Nancy"] },
  { codePostal: "76000", villes: ["Rouen"] },
  { codePostal: "38000", villes: ["Grenoble"] }
];

// Construction de la Map pour un accès rapide
const codePostalMap = buildCodePostalMap(codePostalData);

/**
 * Recherche les villes correspondant à un code postal donné
 * @param codePostal Code postal à rechercher
 * @returns Liste des villes correspondantes ou tableau vide si aucune correspondance
 */
export function getVillesByCodePostal(codePostal: string): string[] {
  console.log("Recherche ville pour code postal:", codePostal);
  const villes = codePostalMap[codePostal] || [];
  console.log("Villes trouvées:", villes);
  return villes;
}

/**
 * Vérifie si un code postal existe dans la base
 * @param codePostal Code postal à vérifier
 * @returns true si le code postal existe, false sinon
 */
export function isValidCodePostal(codePostal: string): boolean {
  return codePostal in codePostalMap;
}

/**
 * Récupère la liste complète des codes postaux
 * @returns Liste de tous les codes postaux
 */
export function getAllCodesPostaux(): string[] {
  return Object.keys(codePostalMap);
}

/**
 * Récupère la liste complète des villes
 * @returns Liste de toutes les villes
 */
export function getAllVilles(): string[] {
  const allVilles: string[] = [];
  for (const villes of Object.values(codePostalMap)) {
    allVilles.push(...villes);
  }
  return [...new Set(allVilles)]; // Éliminer les doublons
}