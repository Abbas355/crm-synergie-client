/**
 * Module pour gérer les commissions sur ventes directes (CVD)
 * 
 * Ce module implémente les règles de calcul des commissions en fonction
 * des points générés par les ventes directes des vendeurs.
 */

// Points par type de produit
export const PRODUCT_POINTS = {
  freebox_pop: 4,
  freebox_essentiel: 5,
  freebox_ultra: 6,
  forfait_5g: 1
};

// Définition des tranches de points et des commissions associées par produit
export interface CommissionTier {
  min: number;
  max: number; // -1 pour illimité
  freebox_pop: number; // en euros
  freebox_essentiel: number; // en euros
  freebox_ultra: number; // en euros
  forfait_5g: number; // en euros
}

// Tranches de commission selon les points cumulés
export const COMMISSION_TIERS: CommissionTier[] = [
  { 
    min: 0, 
    max: 25, 
    freebox_pop: 50, 
    freebox_essentiel: 50, 
    freebox_ultra: 50, 
    forfait_5g: 10 
  },
  { 
    min: 26, 
    max: 50, 
    freebox_pop: 60, 
    freebox_essentiel: 70, 
    freebox_ultra: 80, 
    forfait_5g: 10 
  },
  { 
    min: 51, 
    max: 100, 
    freebox_pop: 70, 
    freebox_essentiel: 90, 
    freebox_ultra: 100, 
    forfait_5g: 10 
  },
  { 
    min: 101, 
    max: -1, // Illimité
    freebox_pop: 90, // CORRIGÉ: était 80
    freebox_essentiel: 100, // CORRIGÉ: était 110
    freebox_ultra: 120, 
    forfait_5g: 10 
  }
];

/**
 * Calcule le nombre de points pour une vente de produit
 */
export function calculatePoints(productType: string): number {
  return PRODUCT_POINTS[productType as keyof typeof PRODUCT_POINTS] || 0;
}

/**
 * Détermine la tranche de commission applicable en fonction du nombre de points
 */
export function getCommissionTier(points: number): CommissionTier {
  for (const tier of COMMISSION_TIERS) {
    if (points >= tier.min && (tier.max === -1 || points <= tier.max)) {
      return tier;
    }
  }
  return COMMISSION_TIERS[COMMISSION_TIERS.length - 1]; // Dernière tranche par défaut
}

/**
 * Calcule la commission pour une vente en fonction de la tranche et du type de produit
 */
export function calculateCommissionForSale(productType: string, tier: CommissionTier): number {
  const commissionKey = productType as keyof typeof tier;
  return tier[commissionKey] || 0;
}

/**
 * Structure pour stocker les ventes et les points accumulés
 */
export interface Sale {
  productType: string;
  points: number;
  commission: number;
  cumulativePoints: number;
  tier: number; // Numéro de la tranche (1-based)
}

/**
 * Calcule les commissions pour une série de ventes effectuées dans le mois
 * en tenant compte du changement de tranches au fur et à mesure de l'accumulation des points
 */
export function calculateCommissionsForMonth(sales: { productType: string }[]): {
  totalCommission: number;
  detailedSales: Sale[];
} {
  let cumulativePoints = 0;
  const detailedSales: Sale[] = [];
  let totalCommission = 0;

  // Traiter chaque vente chronologiquement
  for (const sale of sales) {
    const points = calculatePoints(sale.productType);
    cumulativePoints += points;
    
    // Déterminer la tranche applicable
    const tier = getCommissionTier(cumulativePoints);
    const tierIndex = COMMISSION_TIERS.findIndex(t => t === tier) + 1; // 1-based index
    
    // Calculer la commission pour cette vente
    const commission = calculateCommissionForSale(sale.productType, tier);
    totalCommission += commission;
    
    // Enregistrer les détails de la vente
    detailedSales.push({
      productType: sale.productType,
      points,
      commission,
      cumulativePoints,
      tier: tierIndex
    });
  }

  return {
    totalCommission,
    detailedSales
  };
}

/**
 * Calcule la commission pour une série de ventes par tranches
 * en additionnant les commissions de chaque tranche
 */
export function calculateCommissionsByTiers(totalPoints: number, sales: { productType: string }[]): number {
  let totalCommission = 0;

  // Compter le nombre de ventes par type de produit
  const salesByType: Record<string, number> = {};
  for (const sale of sales) {
    salesByType[sale.productType] = (salesByType[sale.productType] || 0) + 1;
  }

  // Points par tranche
  const pointsInTier: number[] = [
    Math.min(totalPoints, 25), // Tranche 1: 0-25 points
    totalPoints > 25 ? Math.min(totalPoints - 25, 25) : 0, // Tranche 2: 26-50 points
    totalPoints > 50 ? Math.min(totalPoints - 50, 50) : 0, // Tranche 3: 51-100 points
    totalPoints > 100 ? (totalPoints - 100) : 0 // Tranche 4: 101+ points
  ];

  // Pour chaque type de produit, calculer la commission par tranche et l'additionner
  Object.entries(salesByType).forEach(([productType, count]) => {
    COMMISSION_TIERS.forEach((tier, index) => {
      const pointsInCurrentTier = pointsInTier[index];
      if (pointsInCurrentTier > 0) {
        // Calculer la proportion des ventes de ce type dans cette tranche
        const productPoints = calculatePoints(productType);
        const totalProductPoints = productPoints * count;
        const productProportion = totalProductPoints / totalPoints;
        
        // Ventes de ce type dans cette tranche
        const salesInTier = productProportion * pointsInCurrentTier / productPoints;
        
        // Commission pour ces ventes
        const commissionPerSale = calculateCommissionForSale(productType, tier);
        totalCommission += salesInTier * commissionPerSale;
      }
    });
  });

  return Math.round(totalCommission);
}