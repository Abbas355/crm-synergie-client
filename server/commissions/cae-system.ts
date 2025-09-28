/**
 * SYSTÈME COMMISSION ANIMATION EQUIPE (CAE)
 * Bonus Leadership pour nouveaux partenaires atteignant 25 points
 */

export interface CAEConfig {
  [position: string]: {
    firstGeneration: number;
    secondGeneration?: number;
    description: string;
  };
}

// Configuration des bonus CAE par position
export const CAE_POSITIONS: CAEConfig = {
  'ETT': {
    firstGeneration: 40,
    description: 'CA EQUIPE ETT'
  },
  'ETL': {
    firstGeneration: 140,
    description: 'CA EQUIPE ETL'
  },
  'Manager': {
    firstGeneration: 290,
    secondGeneration: 60,
    description: 'CA EQUIPE (M)'
  },
  'RC': {
    firstGeneration: 390,
    secondGeneration: 40,
    description: 'CA EQUIPE RC'
  },
  'RD': {
    firstGeneration: 390,
    secondGeneration: 40,
    description: 'CA EQUIPE RD'
  },
  'RVP': {
    firstGeneration: 390,
    secondGeneration: 40,
    description: 'CA EQUIPE RVP'
  },
  'SVP': {
    firstGeneration: 410,
    secondGeneration: 40,
    description: 'CA EQUIPE SVP'
  }
};

export interface CAECalculation {
  vendeurId: number;
  nouveauCQ: {
    id: number;
    nom: string;
    pointsDuMois: number;
  };
  uplineDistribution: {
    vendeurId: number;
    position: string;
    montant: number;
    type: 'first_generation' | 'second_generation';
    description: string;
  }[];
  totalCommission: number;
}

/**
 * Calcule la distribution des bonus CAE selon la hiérarchie
 */
export function calculateCAEDistribution(
  nouveauCQ: { id: number; nom: string; pointsDuMois: number },
  uplineHierarchy: { vendeurId: number; position: string; level: number }[]
): CAECalculation {
  
  // Vérifier que le nouveau CQ a atteint 25 points
  if (nouveauCQ.pointsDuMois < 25) {
    return {
      vendeurId: nouveauCQ.id,
      nouveauCQ,
      uplineDistribution: [],
      totalCommission: 0
    };
  }

  const distribution: CAECalculation['uplineDistribution'] = [];
  let totalCommission = 0;

  // Trier la hiérarchie par niveau (plus proche = niveau plus bas)
  const sortedHierarchy = uplineHierarchy.sort((a, b) => a.level - b.level);

  // Suivre les positions déjà rencontrées pour la règle de ligne ouverte
  const positionsFound = new Set<string>();
  const positionCounts = new Map<string, number>();

  for (const upline of sortedHierarchy) {
    const position = upline.position;
    const config = CAE_POSITIONS[position];
    
    if (!config) continue;

    // Compter les occurrences de cette position
    const currentCount = positionCounts.get(position) || 0;
    positionCounts.set(position, currentCount + 1);

    let montant = 0;
    let type: 'first_generation' | 'second_generation' = 'first_generation';

    if (currentCount === 0) {
      // Première occurrence de cette position
      if (position === 'ETT' || position === 'ETL') {
        // Pour ETT et ETL, applique la logique de partage
        montant = calculateSharedBonus(position, positionsFound);
      } else if (position === 'Manager') {
        // Pour Manager, calcule selon les positions inférieures
        montant = calculateManagerBonus(positionsFound);
      } else {
        // Pour RC, RD, RVP, SVP - applique la différence
        montant = calculateHighLevelBonus(position, positionsFound);
      }
      
      positionsFound.add(position);
    } else if (currentCount === 1 && config.secondGeneration) {
      // Deuxième occurrence - bonus 2ème génération si disponible
      montant = config.secondGeneration;
      type = 'second_generation';
    }

    if (montant > 0) {
      distribution.push({
        vendeurId: upline.vendeurId,
        position,
        montant,
        type,
        description: `${config.description}${type === 'second_generation' ? ' (2ème génération)' : ''}`
      });
      totalCommission += montant;
    }
  }

  return {
    vendeurId: nouveauCQ.id,
    nouveauCQ,
    uplineDistribution: distribution,
    totalCommission
  };
}

/**
 * Calcule le bonus partagé pour ETT et ETL
 */
function calculateSharedBonus(position: string, positionsFound: Set<string>): number {
  if (position === 'ETT') {
    return 40; // ETT touche toujours 40€
  }
  
  if (position === 'ETL') {
    if (positionsFound.has('ETT')) {
      return 100; // 140€ - 40€ déjà donné au ETT
    }
    return 140; // Montant complet si pas de ETT
  }
  
  return 0;
}

/**
 * Calcule le bonus Manager selon les positions inférieures
 */
function calculateManagerBonus(positionsFound: Set<string>): number {
  let deduction = 0;
  
  if (positionsFound.has('ETT')) {
    deduction += 40;
  }
  
  if (positionsFound.has('ETL')) {
    if (positionsFound.has('ETT')) {
      deduction += 100; // ETL a reçu 100€ (140€ - 40€)
    } else {
      deduction += 140; // ETL a reçu 140€ complet
    }
  }
  
  return 290 - deduction;
}

/**
 * Calcule le bonus pour les niveaux élevés (RC, RD, RVP, SVP)
 */
function calculateHighLevelBonus(position: string, positionsFound: Set<string>): number {
  const config = CAE_POSITIONS[position];
  let deduction = 0;
  
  // Déduire les montants déjà distribués aux niveaux inférieurs
  if (positionsFound.has('Manager')) {
    deduction += 290;
  } else {
    if (positionsFound.has('ETL')) {
      deduction += 140;
    }
    if (positionsFound.has('ETT') && !positionsFound.has('ETL')) {
      deduction += 40;
    }
  }
  
  const result = config.firstGeneration - deduction;
  return Math.max(0, result);
}

/**
 * Génère un exemple de calcul CAE
 */
export function generateCAEExample(): CAECalculation {
  const nouveauCQ = {
    id: 100,
    nom: "Nouveau Vendeur",
    pointsDuMois: 25
  };

  const uplineHierarchy = [
    { vendeurId: 1, position: 'ETT', level: 1 },
    { vendeurId: 2, position: 'ETL', level: 2 },
    { vendeurId: 3, position: 'Manager', level: 3 },
    { vendeurId: 4, position: 'Manager', level: 4 },
    { vendeurId: 5, position: 'RC', level: 5 }
  ];

  return calculateCAEDistribution(nouveauCQ, uplineHierarchy);
}