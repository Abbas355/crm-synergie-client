interface Commune {
  nom: string;
  code: string;
  codeDepartement: string;
  siren: string;
  codeEpci: string;
  codeRegion: string;
  codesPostaux: string[];
  population: number;
}

/**
 * Récupère les communes associées à un code postal
 * @param codePostal Code postal à rechercher
 * @returns Liste des communes correspondantes
 */
export async function getCommunesByCodePostal(codePostal: string): Promise<Commune[]> {
  if (!codePostal || codePostal.length !== 5) {
    return [];
  }
  
  try {
    const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=nom,code,codeDepartement,siren,codeEpci,codeRegion,codesPostaux,population`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des communes:", error);
    throw error;
  }
}