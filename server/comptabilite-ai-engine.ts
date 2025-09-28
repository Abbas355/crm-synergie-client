/**
 * Moteur d'Intelligence Artificielle Comptable
 * Génération automatique des écritures comptables selon le PCG français
 * Conformité totale avec les normes fiscales et comptables
 */

import { db } from "@db";
import { 
  comptes, 
  ecrituresComptables, 
  journauxComptables,
  piecesComptables,
  exercicesComptables
} from "@shared/schema-comptabilite";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// Types de pièces comptables reconnus
export enum TypePieceComptable {
  FACTURE_ACHAT = "FACTURE_ACHAT",
  FACTURE_VENTE = "FACTURE_VENTE",
  NOTE_FRAIS = "NOTE_FRAIS",
  RELEVE_BANCAIRE = "RELEVE_BANCAIRE",
  TICKET_CAISSE = "TICKET_CAISSE",
  AVOIR_FOURNISSEUR = "AVOIR_FOURNISSEUR",
  AVOIR_CLIENT = "AVOIR_CLIENT",
  BULLETIN_SALAIRE = "BULLETIN_SALAIRE",
  DECLARATION_TVA = "DECLARATION_TVA",
  AMORTISSEMENT = "AMORTISSEMENT",
  PROVISION = "PROVISION",
  OPERATION_DIVERSE = "OPERATION_DIVERSE"
}

// Mapping intelligent des mots-clés vers les comptes comptables
const MAPPING_INTELLIGENT = {
  // ACHATS ET CHARGES
  achats: {
    mots_cles: ["achat", "fourniture", "marchandise", "stock", "approvisionnement"],
    comptes: {
      marchandises: "607",
      matieres_premieres: "601",
      fournitures_bureau: "6064",
      fournitures_informatiques: "6064",
      petit_equipement: "6063"
    }
  },
  
  // SERVICES EXTERNES
  services: {
    mots_cles: ["location", "loyer", "maintenance", "entretien", "assurance", "publicité"],
    comptes: {
      location_immobiliere: "6132",
      location_mobiliere: "6135",
      entretien_reparation: "6152",
      assurance: "616",
      publicite: "623",
      honoraires: "622",
      frais_bancaires: "627"
    }
  },
  
  // CHARGES DE PERSONNEL
  personnel: {
    mots_cles: ["salaire", "paie", "cotisation", "urssaf", "retraite", "mutuelle"],
    comptes: {
      salaires_bruts: "641",
      cotisations_urssaf: "6451",
      cotisations_retraite: "6453",
      mutuelle: "6454",
      formation: "6333"
    }
  },
  
  // VENTES ET PRODUITS
  ventes: {
    mots_cles: ["vente", "chiffre", "facture client", "prestation", "service rendu"],
    comptes: {
      ventes_marchandises: "707",
      prestations_services: "706",
      commissions: "7084",
      produits_annexes: "708"
    }
  },
  
  // TVA
  tva: {
    mots_cles: ["tva", "taxe valeur ajoutée"],
    comptes: {
      tva_deductible_20: "44566",
      tva_deductible_10: "44566",
      tva_deductible_55: "44566",
      tva_collectee_20: "44571",
      tva_collectee_10: "44571",
      tva_collectee_55: "44571",
      tva_a_payer: "44551",
      credit_tva: "44567"
    }
  },
  
  // IMMOBILISATIONS
  immobilisations: {
    mots_cles: ["ordinateur", "véhicule", "mobilier", "matériel", "logiciel", "brevet"],
    comptes: {
      logiciels: "205",
      materiel_info: "2183",
      mobilier: "2184",
      vehicules: "2182",
      installations: "2135"
    }
  },
  
  // CLIENTS ET FOURNISSEURS
  tiers: {
    mots_cles: ["client", "fournisseur", "créance", "dette"],
    comptes: {
      clients: "411",
      fournisseurs: "401",
      clients_douteux: "416",
      fournisseurs_immobilisations: "404"
    }
  },
  
  // BANQUE ET CAISSE
  tresorerie: {
    mots_cles: ["banque", "virement", "chèque", "espèces", "caisse", "carte bancaire"],
    comptes: {
      banque: "512",
      caisse: "531",
      virements_internes: "58"
    }
  }
};

// Analyse sémantique du libellé et du type de pièce
export function analyserPiece(
  typePiece: TypePieceComptable,
  libelle: string,
  description: string = ""
): { compteDebit: string; compteCredit: string; journal: string } {
  const texteComplet = `${libelle} ${description}`.toLowerCase();
  
  switch (typePiece) {
    case TypePieceComptable.FACTURE_ACHAT:
      return analyserFactureAchat(texteComplet);
    
    case TypePieceComptable.FACTURE_VENTE:
      return analyserFactureVente(texteComplet);
    
    case TypePieceComptable.NOTE_FRAIS:
      return analyserNoteFrais(texteComplet);
    
    case TypePieceComptable.RELEVE_BANCAIRE:
      return analyserReleveBancaire(texteComplet);
    
    case TypePieceComptable.BULLETIN_SALAIRE:
      return analyserBulletinSalaire(texteComplet);
    
    case TypePieceComptable.DECLARATION_TVA:
      return analyserDeclarationTVA(texteComplet);
    
    default:
      return analyserOperationDiverse(texteComplet);
  }
}

// Analyse spécifique pour facture d'achat
function analyserFactureAchat(texte: string): { compteDebit: string; compteCredit: string; journal: string } {
  let compteDebit = "607"; // Compte par défaut : achats de marchandises
  const compteCredit = "401"; // Fournisseurs
  const journal = "AC"; // Journal des achats
  
  // Recherche du type d'achat
  if (texte.includes("ordinateur") || texte.includes("informatique")) {
    compteDebit = "2183"; // Matériel informatique (immobilisation)
  } else if (texte.includes("fourniture") && texte.includes("bureau")) {
    compteDebit = "6064"; // Fournitures de bureau
  } else if (texte.includes("location") || texte.includes("loyer")) {
    compteDebit = "6132"; // Location immobilière
  } else if (texte.includes("assurance")) {
    compteDebit = "616"; // Primes d'assurance
  } else if (texte.includes("publicité") || texte.includes("marketing")) {
    compteDebit = "623"; // Publicité
  } else if (texte.includes("honoraire") || texte.includes("consultant")) {
    compteDebit = "622"; // Honoraires
  } else if (texte.includes("transport") || texte.includes("livraison")) {
    compteDebit = "624"; // Transport
  } else if (texte.includes("téléphone") || texte.includes("internet")) {
    compteDebit = "626"; // Frais postaux et télécommunications
  }
  
  return { compteDebit, compteCredit, journal };
}

// Analyse spécifique pour facture de vente
function analyserFactureVente(texte: string): { compteDebit: string; compteCredit: string; journal: string } {
  const compteDebit = "411"; // Clients
  let compteCredit = "707"; // Ventes de marchandises par défaut
  const journal = "VE"; // Journal des ventes
  
  if (texte.includes("prestation") || texte.includes("service")) {
    compteCredit = "706"; // Prestations de services
  } else if (texte.includes("commission")) {
    compteCredit = "7084"; // Commissions
  }
  
  return { compteDebit, compteCredit, journal };
}

// Analyse spécifique pour note de frais
function analyserNoteFrais(texte: string): { compteDebit: string; compteCredit: string; journal: string } {
  let compteDebit = "625"; // Déplacements par défaut
  const compteCredit = "421"; // Personnel - rémunérations dues
  const journal = "OD"; // Opérations diverses
  
  if (texte.includes("restaurant") || texte.includes("repas")) {
    compteDebit = "6256"; // Missions et réceptions
  } else if (texte.includes("hôtel") || texte.includes("hébergement")) {
    compteDebit = "6251"; // Voyages et déplacements
  } else if (texte.includes("essence") || texte.includes("carburant")) {
    compteDebit = "6061"; // Carburants
  } else if (texte.includes("train") || texte.includes("avion")) {
    compteDebit = "6251"; // Voyages et déplacements
  } else if (texte.includes("taxi") || texte.includes("uber")) {
    compteDebit = "6251"; // Voyages et déplacements
  }
  
  return { compteDebit, compteCredit, journal };
}

// Analyse spécifique pour relevé bancaire
function analyserReleveBancaire(texte: string): { compteDebit: string; compteCredit: string; journal: string } {
  const journal = "BQ"; // Journal de banque
  
  // Détection des frais bancaires
  if (texte.includes("frais") || texte.includes("commission bancaire")) {
    return {
      compteDebit: "627", // Frais bancaires
      compteCredit: "512", // Banque
      journal
    };
  }
  
  // Détection des intérêts
  if (texte.includes("intérêt") && texte.includes("crédit")) {
    return {
      compteDebit: "661", // Charges d'intérêts
      compteCredit: "512", // Banque
      journal
    };
  }
  
  // Détection des remboursements d'emprunt
  if (texte.includes("remboursement") && texte.includes("emprunt")) {
    return {
      compteDebit: "164", // Emprunts
      compteCredit: "512", // Banque
      journal
    };
  }
  
  // Par défaut : règlement fournisseur
  return {
    compteDebit: "401", // Fournisseurs
    compteCredit: "512", // Banque
    journal
  };
}

// Analyse spécifique pour bulletin de salaire
function analyserBulletinSalaire(texte: string): { compteDebit: string; compteCredit: string; journal: string } {
  return {
    compteDebit: "641", // Rémunérations du personnel
    compteCredit: "421", // Personnel - rémunérations dues
    journal: "OD" // Opérations diverses
  };
}

// Analyse spécifique pour déclaration TVA
function analyserDeclarationTVA(texte: string): { compteDebit: string; compteCredit: string; journal: string } {
  if (texte.includes("crédit")) {
    return {
      compteDebit: "44567", // Crédit de TVA à reporter
      compteCredit: "44551", // TVA à décaisser
      journal: "OD"
    };
  }
  
  return {
    compteDebit: "44551", // TVA à décaisser
    compteCredit: "512", // Banque
    journal: "BQ"
  };
}

// Analyse pour opérations diverses
function analyserOperationDiverse(texte: string): { compteDebit: string; compteCredit: string; journal: string } {
  // Recherche par mots-clés
  for (const [categorie, config] of Object.entries(MAPPING_INTELLIGENT)) {
    for (const motCle of config.mots_cles) {
      if (texte.includes(motCle)) {
        // Retourne le premier compte trouvé de la catégorie
        const comptes = Object.values(config.comptes);
        if (comptes.length > 0) {
          return {
            compteDebit: comptes[0] as string,
            compteCredit: "512", // Banque par défaut
            journal: "OD"
          };
        }
      }
    }
  }
  
  // Par défaut : charges diverses
  return {
    compteDebit: "658", // Charges diverses de gestion courante
    compteCredit: "512", // Banque
    journal: "OD"
  };
}

// Génération automatique des écritures avec TVA
export async function genererEcrituresAutomatiques(
  pieceData: {
    typePiece: TypePieceComptable;
    libelle: string;
    description?: string;
    montantHT: number;
    montantTVA?: number;
    montantTTC?: number;
    tauxTVA?: number;
    dateOperation: Date;
    numeroPiece: string;
  }
) {
  try {
    // Calcul automatique de la TVA si nécessaire
    let { montantHT, montantTVA, montantTTC, tauxTVA = 20 } = pieceData;
    
    if (!montantTVA && montantHT) {
      montantTVA = montantHT * (tauxTVA / 100);
      montantTTC = montantHT + montantTVA;
    } else if (!montantHT && montantTTC && tauxTVA) {
      montantHT = montantTTC / (1 + tauxTVA / 100);
      montantTVA = montantTTC - montantHT;
    }
    
    // Analyse de la pièce
    const analyse = analyserPiece(
      pieceData.typePiece,
      pieceData.libelle,
      pieceData.description
    );
    
    // Récupération de l'exercice comptable actuel
    const exercice = await db.query.exercicesComptables.findFirst({
      where: and(
        lte(exercicesComptables.dateDebut, pieceData.dateOperation),
        gte(exercicesComptables.dateFin, pieceData.dateOperation)
      )
    });
    
    if (!exercice) {
      throw new Error("Aucun exercice comptable trouvé pour cette date");
    }
    
    // Création de la pièce comptable
    const [piece] = await db.insert(piecesComptables).values({
      numeroPiece: pieceData.numeroPiece,
      typePiece: pieceData.typePiece,
      dateOperation: pieceData.dateOperation,
      libelle: pieceData.libelle,
      description: pieceData.description,
      montantHT,
      montantTVA,
      montantTTC,
      statut: "VALIDE"
    }).returning();
    
    // Génération des écritures comptables
    const ecritures = [];
    
    // Écriture principale HT
    if (pieceData.typePiece === TypePieceComptable.FACTURE_ACHAT) {
      // Débit : Compte de charge HT
      ecritures.push({
        exerciceId: exercice.id,
        journalCode: analyse.journal,
        dateEcriture: pieceData.dateOperation,
        numeroCompte: analyse.compteDebit,
        libelle: pieceData.libelle,
        debit: montantHT,
        credit: 0,
        pieceRef: pieceData.numeroPiece,
        pieceComptableId: piece.id
      });
      
      // Débit : TVA déductible
      if (montantTVA > 0) {
        ecritures.push({
          exerciceId: exercice.id,
          journalCode: analyse.journal,
          dateEcriture: pieceData.dateOperation,
          numeroCompte: "44566", // TVA déductible
          libelle: `TVA ${tauxTVA}% - ${pieceData.libelle}`,
          debit: montantTVA,
          credit: 0,
          pieceRef: pieceData.numeroPiece,
          pieceComptableId: piece.id
        });
      }
      
      // Crédit : Fournisseur TTC
      ecritures.push({
        exerciceId: exercice.id,
        journalCode: analyse.journal,
        dateEcriture: pieceData.dateOperation,
        numeroCompte: analyse.compteCredit,
        libelle: pieceData.libelle,
        debit: 0,
        credit: montantTTC || montantHT,
        pieceRef: pieceData.numeroPiece,
        pieceComptableId: piece.id
      });
      
    } else if (pieceData.typePiece === TypePieceComptable.FACTURE_VENTE) {
      // Débit : Client TTC
      ecritures.push({
        exerciceId: exercice.id,
        journalCode: analyse.journal,
        dateEcriture: pieceData.dateOperation,
        numeroCompte: analyse.compteDebit,
        libelle: pieceData.libelle,
        debit: montantTTC || montantHT,
        credit: 0,
        pieceRef: pieceData.numeroPiece,
        pieceComptableId: piece.id
      });
      
      // Crédit : Produit HT
      ecritures.push({
        exerciceId: exercice.id,
        journalCode: analyse.journal,
        dateEcriture: pieceData.dateOperation,
        numeroCompte: analyse.compteCredit,
        libelle: pieceData.libelle,
        debit: 0,
        credit: montantHT,
        pieceRef: pieceData.numeroPiece,
        pieceComptableId: piece.id
      });
      
      // Crédit : TVA collectée
      if (montantTVA > 0) {
        ecritures.push({
          exerciceId: exercice.id,
          journalCode: analyse.journal,
          dateEcriture: pieceData.dateOperation,
          numeroCompte: "44571", // TVA collectée
          libelle: `TVA ${tauxTVA}% - ${pieceData.libelle}`,
          debit: 0,
          credit: montantTVA,
          pieceRef: pieceData.numeroPiece,
          pieceComptableId: piece.id
        });
      }
    } else {
      // Autres types de pièces : écriture simple
      ecritures.push({
        exerciceId: exercice.id,
        journalCode: analyse.journal,
        dateEcriture: pieceData.dateOperation,
        numeroCompte: analyse.compteDebit,
        libelle: pieceData.libelle,
        debit: montantTTC || montantHT,
        credit: 0,
        pieceRef: pieceData.numeroPiece,
        pieceComptableId: piece.id
      });
      
      ecritures.push({
        exerciceId: exercice.id,
        journalCode: analyse.journal,
        dateEcriture: pieceData.dateOperation,
        numeroCompte: analyse.compteCredit,
        libelle: pieceData.libelle,
        debit: 0,
        credit: montantTTC || montantHT,
        pieceRef: pieceData.numeroPiece,
        pieceComptableId: piece.id
      });
    }
    
    // Insertion des écritures en base
    const ecrituresInserted = await db.insert(ecrituresComptables).values(ecritures).returning();
    
    return {
      success: true,
      piece,
      ecritures: ecrituresInserted,
      message: `Écritures générées automatiquement : ${ecritures.length} lignes créées`
    };
    
  } catch (error) {
    console.error("Erreur génération écritures automatiques:", error);
    throw error;
  }
}

// Validation des écritures (équilibre débit/crédit)
export async function validerEquilibreEcritures(pieceComptableId: number): Promise<boolean> {
  const ecritures = await db.query.ecrituresComptables.findMany({
    where: eq(ecrituresComptables.pieceComptableId, pieceComptableId)
  });
  
  const totalDebit = ecritures.reduce((sum, e) => sum + Number(e.debit || 0), 0);
  const totalCredit = ecritures.reduce((sum, e) => sum + Number(e.credit || 0), 0);
  
  // Vérification de l'équilibre avec tolérance de 0.01€ pour les arrondis
  return Math.abs(totalDebit - totalCredit) < 0.01;
}

// Suggestions intelligentes basées sur l'historique
export async function obtenirSuggestions(
  typePiece: TypePieceComptable,
  libelle: string
): Promise<{ compte: string; libelleSuggere: string; frequence: number }[]> {
  // Recherche dans l'historique des pièces similaires
  const historique = await db
    .select({
      numeroCompte: ecrituresComptables.numeroCompte,
      libelle: ecrituresComptables.libelle,
      count: sql<number>`count(*)`.as('count')
    })
    .from(ecrituresComptables)
    .innerJoin(
      piecesComptables,
      eq(ecrituresComptables.pieceComptableId, piecesComptables.id)
    )
    .where(
      and(
        eq(piecesComptables.typePiece, typePiece),
        sql`lower(${ecrituresComptables.libelle}) LIKE lower('%${libelle}%')`
      )
    )
    .groupBy(ecrituresComptables.numeroCompte, ecrituresComptables.libelle)
    .orderBy(desc(sql`count(*)`))
    .limit(5);
  
  return historique.map(h => ({
    compte: h.numeroCompte,
    libelleSuggere: h.libelle,
    frequence: Number(h.count)
  }));
}

// Export des fonctions principales
export default {
  TypePieceComptable,
  analyserPiece,
  genererEcrituresAutomatiques,
  validerEquilibreEcritures,
  obtenirSuggestions
};