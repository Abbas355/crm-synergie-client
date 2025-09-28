/**
 * SYSTÈME DE PARRAINAGE CLIENTS (CPC) - GAMIFICATION AVANCÉE
 * Mécanismes addictifs avec niveaux VIP, récompenses progressives et événements bonus
 */

// Configuration du système de parrainage
export const REFERRAL_CONFIG = {
  // Paliers de récompenses pour les clients qui parrainent
  RECOMPENSES_CLIENT: [
    { parrainage: 1, moisGratuits: 1, description: "Premier parrainage" },
    { parrainage: 2, moisGratuits: 2, description: "Deuxième ami recommandé" },
    { parrainage: 3, moisGratuits: 1, description: "Troisième parrainage" },
    { parrainage: 4, moisGratuits: 2, description: "Quatrième recommandation" },
    { parrainage: 5, moisGratuits: 3, description: "Cinquième parrainage - Bonus!" },
    { parrainage: 6, moisGratuits: 1, description: "Sixième ami" },
    { parrainage: 7, moisGratuits: 2, description: "Septième parrainage" },
    { parrainage: 8, moisGratuits: 1, description: "Huitième recommandation" },
    { parrainage: 9, moisGratuits: 2, description: "Neuvième parrainage" },
    { parrainage: 10, moisGratuits: 5, description: "Dixième parrainage - Méga Bonus!" },
    { parrainage: 12, moisGratuits: 3, description: "Une année de recommandations" },
    { parrainage: 15, moisGratuits: 4, description: "Parrain de l'année" },
    { parrainage: 20, moisGratuits: 6, description: "Champion du parrainage" },
    { parrainage: 25, moisGratuits: 12, description: "Maître parrain - Année gratuite!" }
  ],

  // Niveaux VIP basés sur le nombre de parrainages validés
  NIVEAUX_VIP: [
    {
      niveau: 'bronze',
      seuil: 0,
      couleur: '#cd7f32',
      avantages: [
        'Support prioritaire',
        'Récompenses de base'
      ]
    },
    {
      niveau: 'argent',
      seuil: 3,
      couleur: '#c0c0c0',
      avantages: [
        'Support VIP',
        'Récompenses majorées de 25%',
        'Accès aux événements exclusifs',
        'Équipement gratuit'
      ]
    },
    {
      niveau: 'or',
      seuil: 8,
      couleur: '#ffd700',
      avantages: [
        'Support premium 24/7',
        'Récompenses majorées de 50%',
        'Événements VIP exclusifs',
        'Équipement premium gratuit',
        'Consultant dédié'
      ]
    },
    {
      niveau: 'platine',
      seuil: 15,
      couleur: '#e5e4e2',
      avantages: [
        'Support ultra-premium',
        'Récompenses doublées',
        'Accès illimité aux événements',
        'Équipement haut de gamme gratuit',
        'Consultant personnel 24/7',
        'Invitations événements entreprise'
      ]
    }
  ],

  // Configuration des commissions vendeur (CPC)
  COMMISSIONS_VENDEUR: {
    // Seuil minimum de parrainages pour déclencher les commissions
    SEUIL_MINIMUM: 5,
    
    // Points par type de produit parrainé
    POINTS_PRODUITS: {
      'Freebox Ultra': 6,
      'Freebox Essentiel': 5,
      'Freebox Pop': 4,
      'Forfait 5G': 1
    },
    
    // Commission par point selon le niveau du vendeur
    COMMISSION_PAR_POINT: {
      'bronze': 10,    // 10€/point
      'argent': 12,    // 12€/point  
      'or': 15,        // 15€/point
      'platine': 20    // 20€/point
    }
  },

  // Seuil pour générer des points CVD (Commission Vente Directe)
  SEUIL_COMMISSIONS: 5,

  // Multiplicateurs temporels pour événements spéciaux
  MULTIPLICATEURS_TEMPORELS: {
    'weekend': 1.5,
    'fin_mois': 2.0,
    'black_friday': 3.0,
    'noel': 2.5
  }
};

/**
 * Calcule les récompenses totales pour un client parrain
 */
export function calculerRecompensesClient(nombreParrainages: number) {
  let totalMoisGratuits = 0;
  let derniereMoisGratuits = 0;
  let prochainePalier: { parrainage: number; moisGratuits: number } | undefined;

  const recompenses = REFERRAL_CONFIG.RECOMPENSES_CLIENT;

  // Calculer les récompenses déjà obtenues
  for (const recompense of recompenses) {
    if (nombreParrainages >= recompense.parrainage) {
      totalMoisGratuits += recompense.moisGratuits;
      derniereMoisGratuits = recompense.moisGratuits;
    } else {
      // Premier palier non atteint = prochain objectif
      prochainePalier = {
        parrainage: recompense.parrainage,
        moisGratuits: recompense.moisGratuits
      };
      break;
    }
  }

  return {
    totalMoisGratuits,
    derniereMoisGratuits,
    prochainePalier
  };
}

/**
 * Détermine le niveau VIP d'un client selon ses parrainages validés
 */
export function calculerNiveauVip(parrainagesValides: number) {
  const niveaux = REFERRAL_CONFIG.NIVEAUX_VIP;
  let niveauActuel = niveaux[0]; // Bronze par défaut
  let prochainNiveau: any = null;

  // Trouver le niveau actuel
  for (let i = niveaux.length - 1; i >= 0; i--) {
    if (parrainagesValides >= niveaux[i].seuil) {
      niveauActuel = niveaux[i];
      
      // Calculer le prochain niveau s'il existe
      if (i < niveaux.length - 1) {
        const suivant = niveaux[i + 1];
        prochainNiveau = {
          nom: suivant.niveau,
          parrainagesRestants: suivant.seuil - parrainagesValides,
          avantages: suivant.avantages
        };
      }
      break;
    }
  }

  return {
    niveau: niveauActuel.niveau,
    couleur: niveauActuel.couleur,
    avantages: niveauActuel.avantages,
    prochainNiveau
  };
}

/**
 * Calcule les commissions CPC pour un vendeur basées sur ses parrainages
 */
export function calculerCommissionsCPC(parrainages: any[], vendeurId: number) {
  const parrainagesValides = parrainages.filter(p => p.statut === 'client_installe');
  
  // Vérifier le seuil minimum
  if (parrainagesValides.length < REFERRAL_CONFIG.COMMISSIONS_VENDEUR.SEUIL_MINIMUM) {
    return {
      seuilAtteint: false,
      parrainagesValides: parrainagesValides.length,
      seuilRequis: REFERRAL_CONFIG.COMMISSIONS_VENDEUR.SEUIL_MINIMUM,
      pointsFreebox: 0,
      commissionTotale: 0,
      niveauVendeur: 'bronze'
    };
  }

  // Calculer les points Freebox
  let pointsFreebox = 0;
  const pointsProduits = REFERRAL_CONFIG.COMMISSIONS_VENDEUR.POINTS_PRODUITS;
  
  parrainagesValides.forEach(parrainage => {
    const points = pointsProduits[parrainage.produitSouhaite as keyof typeof pointsProduits] || 0;
    pointsFreebox += points;
  });

  // Déterminer le niveau du vendeur (basé sur ses parrainages)
  const niveauVip = calculerNiveauVip(parrainagesValides.length);
  const commissionParPoint = REFERRAL_CONFIG.COMMISSIONS_VENDEUR.COMMISSION_PAR_POINT[niveauVip.niveau as keyof typeof REFERRAL_CONFIG.COMMISSIONS_VENDEUR.COMMISSION_PAR_POINT] || 10;

  // Si 5+ parrainages Freebox dans le mois = génère des points CVD
  const generePointsCVD = pointsFreebox >= REFERRAL_CONFIG.SEUIL_COMMISSIONS;

  return {
    seuilAtteint: true,
    parrainagesValides: parrainagesValides.length,
    seuilRequis: REFERRAL_CONFIG.COMMISSIONS_VENDEUR.SEUIL_MINIMUM,
    pointsFreebox,
    commissionTotale: pointsFreebox * commissionParPoint,
    niveauVendeur: niveauVip.niveau,
    commissionParPoint,
    generePointsCVD,
    pointsCVDGeneres: generePointsCVD ? pointsFreebox : 0
  };
}

/**
 * Génère des événements bonus actifs (simulation)
 */
export function getEventsBonusActifs() {
  const maintenant = new Date();
  const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);
  
  // Événements de fin de mois
  if (maintenant.getDate() >= 25) {
    return [
      {
        id: 1,
        nom: "Rush de Fin de Mois",
        description: "Récompenses x2 jusqu'au " + finMois.toLocaleDateString('fr-FR'),
        typeBonus: "multiplicateur",
        valeurBonus: 2,
        dateDebut: new Date(maintenant.getFullYear(), maintenant.getMonth(), 25).toISOString(),
        dateFin: finMois.toISOString(),
        couleurTheme: "orange",
        icone: "🔥"
      }
    ];
  }

  // Événements de weekend
  const jourSemaine = maintenant.getDay();
  if (jourSemaine === 5 || jourSemaine === 6 || jourSemaine === 0) { // Vendredi, Samedi, Dimanche
    return [
      {
        id: 2,
        nom: "Weekend Boost",
        description: "Bonus parrainage weekend actif",
        typeBonus: "multiplicateur",
        valeurBonus: 1.5,
        dateDebut: new Date().toISOString(),
        dateFin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        couleurTheme: "purple",
        icone: "⚡"
      }
    ];
  }

  return [];
}

/**
 * Génère des statistiques de performance pour un vendeur
 */
export async function genererStatsPerformance(vendeurId: number) {
  // Pour l'instant, générer des stats simulées
  // Dans une vraie implémentation, ceci interrogerait la base de données
  
  const statsSimulees = {
    vendeur: {
      totalParrainages: Math.floor(Math.random() * 15) + 5,
      tauxConversion: Math.floor(Math.random() * 30) + 60, // 60-90%
      moyenneParMois: Math.floor(Math.random() * 5) + 2,
      classementGeneral: Math.floor(Math.random() * 20) + 1,
      tendance: Math.random() > 0.5 ? 'hausse' : 'stable'
    },
    reseau: {
      totalVendeurs: 45,
      parrainagesMois: 127,
      topPerformeur: 'Eric Rostand',
      croissanceMensuelle: '+23%'
    }
  };

  return statsSimulees;
}

/**
 * Valide si un parrainage peut générer des commissions
 */
export function validerParrainageCommissionnable(parrainage: any) {
  // Le filleul doit être devenu client (installé)
  if (parrainage.statut !== 'client_installe') {
    return { valide: false, raison: 'Client non installé' };
  }

  // Le produit doit être éligible aux commissions
  const produitsEligibles = Object.keys(REFERRAL_CONFIG.COMMISSIONS_VENDEUR.POINTS_PRODUITS);
  if (!produitsEligibles.includes(parrainage.produitSouhaite)) {
    return { valide: false, raison: 'Produit non éligible' };
  }

  // La date d'installation doit être dans les 3 mois suivant le parrainage
  const dateParrainage = new Date(parrainage.dateParrainage);
  const dateInstallation = new Date(parrainage.dateInstallation);
  const delaiMaximum = 3 * 30 * 24 * 60 * 60 * 1000; // 3 mois en ms

  if (dateInstallation.getTime() - dateParrainage.getTime() > delaiMaximum) {
    return { valide: false, raison: 'Délai d\'installation dépassé' };
  }

  return { valide: true, raison: 'Parrainage valide' };
}

/**
 * Applique les multiplicateurs d'événements aux récompenses
 */
export function appliquerMultiplicateursEvenements(recompenseBase: number, dateParrainage: Date) {
  let multiplicateur = 1;
  const eventsActifs = getEventsBonusActifs();
  
  for (const event of eventsActifs) {
    const debut = new Date(event.dateDebut);
    const fin = new Date(event.dateFin);
    
    if (dateParrainage >= debut && dateParrainage <= fin) {
      multiplicateur = Math.max(multiplicateur, event.valeurBonus);
    }
  }

  return Math.floor(recompenseBase * multiplicateur);
}