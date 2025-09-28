import { db } from "../db";
import { eq, and, sql, asc, desc, gte, lte, like } from "drizzle-orm";
import { mlmDistributeurs, mlmReglesCommission, mlmTransactionsCommission, recruiters, users, clients } from "../shared/schema";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { COMMISSION_TIERS, calculatePoints, calculateCommissionsForMonth } from "./commissions/direct-sales";

/**
 * Vérifie si un utilisateur est déjà enregistré comme distributeur MLM
 */
export async function isDistributeur(userId: number): Promise<boolean> {
  const distributeur = await db.query.mlmDistributeurs.findFirst({
    where: eq(mlmDistributeurs.userId, userId),
  });
  return !!distributeur;
}

/**
 * Récupère les informations d'un distributeur par son ID utilisateur
 */
export async function getDistributeurByUserId(userId: number) {
  return await db.query.mlmDistributeurs.findFirst({
    where: eq(mlmDistributeurs.userId, userId),
    with: {
      user: true,
      parent: true,
    },
  });
}

/**
 * Récupère les informations d'un distributeur par son code vendeur
 */
export async function getDistributeurByCodeVendeur(codeVendeur: string) {
  return await db.query.mlmDistributeurs.findFirst({
    where: eq(mlmDistributeurs.codeVendeur, codeVendeur),
    with: {
      user: true,
      parent: true,
    },
  });
}

/**
 * Enregistre un nouveau distributeur dans le système MLM
 */
export async function enregistrerDistributeur(
  userId: number,
  codeVendeur: string,
  parentCodeVendeur?: string
) {
  // Vérifier si l'utilisateur est déjà distributeur
  const existingDistributeur = await getDistributeurByUserId(userId);
  if (existingDistributeur) {
    throw new Error("Cet utilisateur est déjà enregistré comme distributeur MLM");
  }

  // Vérifier si le code vendeur est déjà utilisé
  const existingCode = await getDistributeurByCodeVendeur(codeVendeur);
  if (existingCode) {
    throw new Error("Ce code vendeur est déjà utilisé");
  }

  // Trouver le parent si un code parrain est fourni
  let parentId = null;
  let niveau = 1;

  if (parentCodeVendeur) {
    const parent = await getDistributeurByCodeVendeur(parentCodeVendeur);
    if (!parent) {
      throw new Error("Code parrain invalide");
    }
    parentId = parent.id;
    niveau = parent.niveau + 1;
  }

  // Créer le distributeur
  const [newDistributeur] = await db.insert(mlmDistributeurs)
    .values({
      userId,
      codeVendeur,
      parentId,
      niveau,
      dateRecrutement: new Date(),
      actif: true,
    })
    .returning();

  return newDistributeur;
}

/**
 * Récupère tous les enfants directs d'un distributeur
 */
export async function getEnfantsDirests(distributeurId: number) {
  return await db.query.mlmDistributeurs.findMany({
    where: eq(mlmDistributeurs.parentId, distributeurId),
    with: {
      user: true,
    },
  });
}

/**
 * Récupère la structure complète du réseau d'un distributeur (tous ses descendants)
 */
export async function getReseauComplet(distributeurId: number) {
  // On utilise une requête récursive pour récupérer tous les descendants
  const query = sql`
    WITH RECURSIVE descendants AS (
      SELECT 
        id, 
        user_id, 
        codeVendeur, 
        parent_id, 
        niveau, 
        date_recrutement, 
        actif,
        taux_commission,
        1 AS depth
      FROM mlm_distributeurs 
      WHERE id = ${distributeurId}
      
      UNION ALL
      
      SELECT 
        d.id, 
        d.user_id, 
        d.codeVendeur, 
        d.parent_id, 
        d.niveau, 
        d.date_recrutement, 
        d.actif,
        d.taux_commission,
        ds.depth + 1
      FROM mlm_distributeurs d
      INNER JOIN descendants ds ON ds.id = d.parent_id
    )
    SELECT 
      d.*,
      u.username,
      r.prenom,
      r.nom,
      r.telephone,
      r.email
    FROM descendants d
    LEFT JOIN users u ON d.user_id = u.id
    LEFT JOIN recruiters r ON u.id = r.user_id
    ORDER BY depth, codeVendeur;
  `;

  return await db.execute(query);
}

/**
 * Récupère tous les ascendants d'un distributeur (sa lignée)
 */
export async function getLigneeAscendante(distributeurId: number) {
  // On utilise une requête récursive pour récupérer tous les ascendants
  const query = sql`
    WITH RECURSIVE ascendants AS (
      SELECT 
        id, 
        user_id, 
        codeVendeur, 
        parent_id, 
        niveau, 
        date_recrutement, 
        actif,
        taux_commission,
        1 AS depth
      FROM mlm_distributeurs 
      WHERE id = ${distributeurId}
      
      UNION ALL
      
      SELECT 
        d.id, 
        d.user_id, 
        d.codeVendeur, 
        d.parent_id, 
        d.niveau, 
        d.date_recrutement, 
        d.actif,
        d.taux_commission,
        a.depth + 1
      FROM mlm_distributeurs d
      INNER JOIN ascendants a ON d.id = a.parent_id
    )
    SELECT 
      a.*,
      u.username,
      r.prenom,
      r.nom,
      r.telephone,
      r.email
    FROM ascendants a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN recruiters r ON u.id = r.user_id
    ORDER BY depth, codeVendeur;
  `;

  return await db.execute(query);
}

/**
 * Récupère les règles de commission pour un niveau et un type de produit donnés
 */
export async function getRegleCommission(niveau: number, produitType: string) {
  return await db.query.mlmReglesCommission.findFirst({
    where: and(
      eq(mlmReglesCommission.niveau, niveau),
      eq(mlmReglesCommission.produitType, produitType),
      eq(mlmReglesCommission.actif, true),
    ),
  });
}

/**
 * Récupère toutes les transactions de commission d'un distributeur
 */
export async function getTransactionsCommission(distributeurId: number) {
  return await db.query.mlmTransactionsCommission.findMany({
    where: eq(mlmTransactionsCommission.distributeurId, distributeurId),
    with: {
      client: true,
    },
    orderBy: (tc) => [desc(tc.createdAt)],
  });
}

/**
 * Récupère les statistiques globales d'un distributeur
 */
export async function getStatistiquesDistributeur(distributeurId: number) {
  // Nombre d'enfants directs
  const enfantsDirects = await db.query.mlmDistributeurs.findMany({
    where: eq(mlmDistributeurs.parentId, distributeurId),
  });

  // Commissions du mois courant
  const dateCourante = new Date();
  const moisCourant = `${dateCourante.getFullYear()}-${(dateCourante.getMonth() + 1).toString().padStart(2, '0')}`;
  
  const commissionsQuery = sql`
    SELECT 
      SUM(montant) as total_mois_courant
    FROM mlm_transactions_commission
    WHERE distributeur_id = ${distributeurId} AND mois_calcul = ${moisCourant}
  `;
  const commissionsResult = await db.execute(commissionsQuery);
  
  // Total des commissions historiques
  const totalCommissionsQuery = sql`
    SELECT 
      SUM(montant) as total_global
    FROM mlm_transactions_commission
    WHERE distributeur_id = ${distributeurId}
  `;
  const totalCommissionsResult = await db.execute(totalCommissionsQuery);
  
  // Nombre total de descendants (tous niveaux confondus)
  const reseauComplet = await getReseauComplet(distributeurId);
  
  return {
    nbEnfantsDirects: enfantsDirects.length,
    commissionsMoisCourant: commissionsResult[0]?.total_mois_courant || 0,
    commissionsTotal: totalCommissionsResult[0]?.total_global || 0,
    tailleReseau: reseauComplet.length - 1, // On soustrait le distributeur lui-même
  };
}

/**
 * Récupère les statistiques globales du réseau complet (pour les administrateurs)
 */
export async function getStatistiquesGlobales() {
  // Nombre total de distributeurs
  const totalDistributeursQuery = sql`
    SELECT COUNT(*) as total
    FROM mlm_distributeurs
  `;
  const totalDistributeursResult = await db.execute(totalDistributeursQuery);
  
  // Nombre total de clients dans le réseau
  const totalClientsQuery = sql`
    SELECT COUNT(*) as total
    FROM clients c
    INNER JOIN mlm_distributeurs d ON c.codeVendeur = d.codeVendeur
  `;
  const totalClientsResult = await db.execute(totalClientsQuery);
  
  // Commissions du mois courant
  const dateCourante = new Date();
  const moisCourant = `${dateCourante.getFullYear()}-${(dateCourante.getMonth() + 1).toString().padStart(2, '0')}`;
  
  const commissionsQuery = sql`
    SELECT 
      SUM(montant) as total_mois_courant
    FROM mlm_transactions_commission
    WHERE mois_calcul = ${moisCourant}
  `;
  const commissionsResult = await db.execute(commissionsQuery);
  
  // Total des commissions historiques
  const totalCommissionsQuery = sql`
    SELECT 
      SUM(montant) as total_global
    FROM mlm_transactions_commission
  `;
  const totalCommissionsResult = await db.execute(totalCommissionsQuery);
  
  // Performance moyenne (pourcentage de croissance par exemple)
  const performanceQuery = sql`
    SELECT 
      COUNT(CASE WHEN DATE_PART('month', createdAt) = DATE_PART('month', CURRENT_DATE) THEN 1 END) as clients_mois_courant,
      COUNT(CASE WHEN DATE_PART('month', createdAt) = DATE_PART('month', CURRENT_DATE - INTERVAL '1 month') THEN 1 END) as clients_mois_precedent
    FROM clients c
    INNER JOIN mlm_distributeurs d ON c.codeVendeur = d.codeVendeur
    WHERE DATE_PART('year', createdAt) = DATE_PART('year', CURRENT_DATE)
  `;
  const performanceResult = await db.execute(performanceQuery);
  
  const clientsMoisCourant = performanceResult[0]?.clients_mois_courant || 0;
  const clientsMoisPrecedent = performanceResult[0]?.clients_mois_precedent || 0;
  const performance = clientsMoisPrecedent > 0 ? 
    Math.round(((clientsMoisCourant - clientsMoisPrecedent) / clientsMoisPrecedent) * 100) : 0;
  
  return {
    totalVendeurs: totalDistributeursResult[0]?.total || 0,
    totalClients: totalClientsResult[0]?.total || 0,
    commissionsMoisCourant: commissionsResult[0]?.total_mois_courant || 0,
    commissionsTotal: totalCommissionsResult[0]?.total_global || 0,
    performance: performance
  };
}

/**
 * Convertit un vendeur existant en distributeur MLM
 */
export async function convertirVendeurEnDistributeur(userId: number, parentCodeVendeur?: string) {
  // Vérifier si l'utilisateur est un vendeur
  const recruiter = await db.query.recruiters.findFirst({
    where: eq(recruiters.userId, userId),
  });
  
  if (!recruiter) {
    throw new Error("L'utilisateur n'est pas un vendeur enregistré");
  }
  
  // Enregistrer le vendeur comme distributeur MLM
  return await enregistrerDistributeur(userId, recruiter.codeVendeur, parentCodeVendeur);
}

/**
 * Calcule et enregistre les commissions pour une vente
 */
export async function calculerCommissionsSurVente(clientId: number, produitType: string, montantVente: number) {
  // Récupérer le client pour trouver son vendeur
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });
  
  if (!client || !client.codeVendeur) {
    throw new Error("Client introuvable ou sans vendeur associé");
  }
  
  // Trouver le distributeur direct
  const distributeurDirect = await getDistributeurByCodeVendeur(client.codeVendeur);
  
  if (!distributeurDirect) {
    console.log(`Le vendeur ${client.codeVendeur} n'est pas dans le réseau MLM`);
    return [];
  }
  
  // Récupérer la lignée ascendante
  const lignee = await getLigneeAscendante(distributeurDirect.id);
  
  // Pour chaque distributeur dans la lignée, calculer et enregistrer la commission
  const transactionsPromises = lignee.map(async (distributeur: any) => {
    // Récupérer la règle de commission applicable
    const regle = await getRegleCommission(distributeur.niveau, produitType);
    
    if (!regle) {
      return null; // Pas de règle, pas de commission
    }
    
    // Calculer le montant de la commission
    const montantCommission = montantVente * Number(regle.tauxCommission) / 100;
    
    if (montantCommission <= 0) {
      return null; // Pas de commission
    }
    
    // Définir le mois de calcul (YYYY-MM)
    const dateCourante = new Date();
    const moisCalcul = `${dateCourante.getFullYear()}-${(dateCourante.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Enregistrer la transaction
    const [transaction] = await db.insert(mlmTransactionsCommission)
      .values({
        distributeurId: distributeur.id,
        clientId,
        montant: montantCommission,
        taux: regle.tauxCommission,
        niveau: distributeur.niveau,
        produitType,
        statut: 'calculee',
        moisCalcul,
      })
      .returning();
    
    return transaction;
  });
  
  // Attendre que toutes les transactions soient enregistrées
  const transactions = await Promise.all(transactionsPromises);
  
  // Filtrer les transactions nulles (celles qui n'ont pas pu être enregistrées)
  return transactions.filter(t => t !== null);
}

/**
 * Valide les commissions d'un mois donné pour un distributeur
 * Change le statut de 'calculee' à 'validee'
 */
export async function validerCommissionsMensuelles(distributeurId: number, moisCalcul: string) {
  // Vérifier que le format du mois est correct (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(moisCalcul)) {
    throw new Error("Format de mois incorrect. Utilisez YYYY-MM");
  }
  
  // Mise à jour des transactions pour ce distributeur et ce mois
  const updateResult = await db.update(mlmTransactionsCommission)
    .set({
      statut: 'validee',
      dateValidation: new Date(),
    })
    .where(
      and(
        eq(mlmTransactionsCommission.distributeurId, distributeurId),
        eq(mlmTransactionsCommission.moisCalcul, moisCalcul),
        eq(mlmTransactionsCommission.statut, 'calculee')
      )
    )
    .returning();
  
  return updateResult;
}

/**
 * Marque les commissions comme payées
 */
export async function payerCommissions(distributeurId: number, moisCalcul: string, methodePaiement: string) {
  // Vérifier que le format du mois est correct (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(moisCalcul)) {
    throw new Error("Format de mois incorrect. Utilisez YYYY-MM");
  }
  
  // Mise à jour des transactions pour ce distributeur et ce mois
  const updateResult = await db.update(mlmTransactionsCommission)
    .set({
      statut: 'payee',
      datePaiement: new Date(),
      methodePaiement,
    })
    .where(
      and(
        eq(mlmTransactionsCommission.distributeurId, distributeurId),
        eq(mlmTransactionsCommission.moisCalcul, moisCalcul),
        eq(mlmTransactionsCommission.statut, 'validee')
      )
    )
    .returning();
  
  return updateResult;
}

/**
 * Génère un rapport de commissions mensuel pour un distributeur
 */
export async function genererRapportMensuel(distributeurId: number, moisCalcul: string) {
  // Vérifier que le format du mois est correct (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(moisCalcul)) {
    throw new Error("Format de mois incorrect. Utilisez YYYY-MM");
  }
  
  // Récupérer toutes les transactions pour ce mois
  const transactions = await db.query.mlmTransactionsCommission.findMany({
    where: and(
      eq(mlmTransactionsCommission.distributeurId, distributeurId),
      eq(mlmTransactionsCommission.moisCalcul, moisCalcul)
    ),
    with: {
      client: true,
    },
  });
  
  // Récupérer les informations du distributeur
  const distributeur = await getDistributeurByUserId(distributeurId);
  
  if (!distributeur) {
    throw new Error("Distributeur introuvable");
  }
  
  // Calculer les totaux
  const totalCommissions = transactions.reduce((sum, t) => sum + Number(t.montant), 0);
  const commissionsParProduit = transactions.reduce((acc: Record<string, number>, t) => {
    const produit = t.produitType;
    acc[produit] = (acc[produit] || 0) + Number(t.montant);
    return acc;
  }, {});
  
  const commissionsParStatut = transactions.reduce((acc: Record<string, number>, t) => {
    const statut = t.statut;
    acc[statut] = (acc[statut] || 0) + Number(t.montant);
    return acc;
  }, {});
  
  return {
    distributeur,
    moisCalcul,
    transactions,
    totalCommissions,
    commissionsParProduit,
    commissionsParStatut,
    dateGeneration: new Date(),
  };
}

/**
 * Récupère les tranches de commission CVD (Commission sur Vente Directe)
 */
export function getCommissionTiers() {
  return COMMISSION_TIERS;
}

/**
 * Récupère les clients installés par un vendeur au cours d'un mois donné
 * @param codeVendeur Code du vendeur
 * @param month Mois au format YYYY-MM (optionnel, par défaut mois courant)
 */
export async function getClientsInstallationByVendeur(codeVendeur: string, month?: string) {
  // Déterminer la période à rechercher
  let startDate: Date, endDate: Date;
  
  if (month) {
    // Format attendu: YYYY-MM
    const [year, monthNum] = month.split('-').map(n => parseInt(n));
    startDate = startOfMonth(new Date(year, monthNum - 1));
    endDate = endOfMonth(startDate);
  } else {
    // Mois courant
    const now = new Date();
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  }
  
  // Récupérer les clients en statut "installation" ayant ce vendeur
  return await db.query.clients.findMany({
    where: and(
      eq(clients.codeVendeur, codeVendeur),
      eq(clients.statut, 'installation'),
      // Date d'installation dans le mois
      sql`dateInstallation >= ${startDate.toISOString()} AND dateInstallation <= ${endDate.toISOString()}`
    ),
    orderBy: [asc(clients.dateInstallation)]
  });
}

/**
 * Calcule les commissions CVD pour un vendeur sur un mois donné
 */
export async function calculateDirectSalesCommissions(codeVendeur: string, month?: string) {
  // Récupérer les clients installés durant le mois
  const clientsInstallation = await getClientsInstallationByVendeur(codeVendeur, month);
  
  if (clientsInstallation.length === 0) {
    return {
      totalCommission: 0,
      detailedSales: []
    };
  }
  
  // Préparer les données pour le calcul des commissions
  const sales = clientsInstallation.map(client => ({
    id: client.id,
    clientId: client.id,
    clientName: `${client.prenom} ${client.nom}`,
    productType: client.forfaitType || '',
    date: client.dateInstallation?.toISOString() || new Date().toISOString(),
  }));
  
  // Filtrer les ventes sans type de produit valide
  const validSales = sales.filter(sale => sale.productType && calculatePoints(sale.productType) > 0);
  
  // Calculer les commissions selon le système de tranches progressives
  const result = calculateCommissionsForMonth(validSales);
  
  return {
    ...result,
    // Ajouter les détails du client à chaque vente
    detailedSales: result.detailedSales.map((sale, index) => ({
      ...sale,
      id: validSales[index].id,
      clientId: validSales[index].clientId,
      clientName: validSales[index].clientName,
      date: validSales[index].date,
    }))
  };
}

/**
 * Déclenche automatiquement le calcul des commissions lors du changement de statut d'un client
 */
export async function demarrerCalculCommissionsClient(clientId: number) {
  // Récupérer les informations du client
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });
  
  if (!client) {
    throw new Error("Client introuvable");
  }
  
  // Vérifier si le client a un forfait associé
  if (!client.forfaitType) {
    console.log(`Client ${client.id} sans forfait, pas de commission à calculer`);
    return [];
  }
  
  // Définir le montant de vente en fonction du type de forfait
  let montantVente = 0;
  switch (client.forfaitType) {
    case 'freebox_ultra':
      montantVente = 49.99;
      break;
    case 'freebox_pop':
      montantVente = 39.99;
      break;
    case 'freebox_essentiel':
      montantVente = 29.99;
      break;
    case 'forfait_5g':
      montantVente = 19.99;
      break;
    default:
      montantVente = 0;
  }
  
  if (montantVente <= 0) {
    console.log(`Type de forfait inconnu pour le client ${client.id}, pas de commission`);
    return [];
  }
  
  // Vérifier si le client est en statut permettant le calcul des commissions
  // Uniquement pour les clients en installation (après période d'essai)
  if (client.statut !== 'installation') {
    console.log(`Client ${client.id} en statut ${client.statut}, pas de commission à calculer pour l'instant`);
    return [];
  }
  
  // Calculer et enregistrer les commissions
  try {
    const commissions = await calculerCommissionsSurVente(clientId, client.forfaitType, montantVente);
    console.log(`${commissions.length} commissions calculées pour le client ${client.id}`);
    return commissions;
  } catch (error) {
    console.error(`Erreur lors du calcul des commissions pour le client ${client.id}:`, error);
    throw error;
  }
}