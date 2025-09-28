/**
 * Script d'initialisation du système comptable
 * 
 * Ce script initialise toutes les données de base nécessaires pour une SAS française
 * évoluant en holding, conformément aux normes comptables françaises et européennes
 */

import { db } from "../../db";
import {
  planComptable,
  exercicesComptables,
  journauxComptables,
  tauxTVA,
  parametresComptables
} from "@shared/schema-comptabilite";

// Plan Comptable Général français pour SAS/Holding
const PLAN_COMPTABLE_SAS = [
  // CLASSE 1 - COMPTES DE CAPITAUX
  { numero: "101000", libelle: "Capital social", classe: "1", type: "PASSIF" as const, description: "Capital social de la SAS" },
  { numero: "104000", libelle: "Primes d'émission", classe: "1", type: "PASSIF" as const, description: "Primes liées aux augmentations de capital" },
  { numero: "106100", libelle: "Réserve légale", classe: "1", type: "PASSIF" as const, description: "Réserve légale obligatoire (5% du capital)" },
  { numero: "106800", libelle: "Autres réserves", classe: "1", type: "PASSIF" as const, description: "Réserves statutaires et facultatives" },
  { numero: "110000", libelle: "Report à nouveau", classe: "1", type: "PASSIF" as const, description: "Report à nouveau créditeur ou débiteur" },
  { numero: "120000", libelle: "Résultat de l'exercice", classe: "1", type: "PASSIF" as const, description: "Bénéfice ou perte de l'exercice" },
  { numero: "164000", libelle: "Emprunts auprès des établissements de crédit", classe: "1", type: "PASSIF" as const, description: "Emprunts bancaires" },
  { numero: "165000", libelle: "Dépôts et cautionnements reçus", classe: "1", type: "PASSIF" as const, description: "Cautions et dépôts de garantie reçus" },
  { numero: "166000", libelle: "Participation des salariés", classe: "1", type: "PASSIF" as const, description: "Participation et intéressement" },
  { numero: "167000", libelle: "Emprunts et dettes assorties de conditions particulières", classe: "1", type: "PASSIF" as const, description: "Emprunts obligataires, participatifs" },
  { numero: "168700", libelle: "Autres emprunts et dettes", classe: "1", type: "PASSIF" as const, description: "Autres dettes financières" },

  // CLASSE 2 - COMPTES D'IMMOBILISATIONS
  { numero: "201000", libelle: "Frais d'établissement", classe: "2", type: "ACTIF" as const, description: "Frais de constitution, d'augmentation de capital" },
  { numero: "203000", libelle: "Frais de recherche et développement", classe: "2", type: "ACTIF" as const, description: "Frais de R&D immobilisés" },
  { numero: "205000", libelle: "Concessions, brevets, licences", classe: "2", type: "ACTIF" as const, description: "Propriété intellectuelle" },
  { numero: "206000", libelle: "Droit au bail", classe: "2", type: "ACTIF" as const, description: "Droit au bail commercial" },
  { numero: "207000", libelle: "Fonds commercial", classe: "2", type: "ACTIF" as const, description: "Fonds de commerce acquis" },
  { numero: "208000", libelle: "Autres immobilisations incorporelles", classe: "2", type: "ACTIF" as const, description: "Logiciels, sites internet" },
  { numero: "211000", libelle: "Terrains", classe: "2", type: "ACTIF" as const, description: "Terrains nus ou aménagés" },
  { numero: "213000", libelle: "Constructions", classe: "2", type: "ACTIF" as const, description: "Bâtiments et aménagements" },
  { numero: "215000", libelle: "Installations techniques", classe: "2", type: "ACTIF" as const, description: "Matériel et outillage industriel" },
  { numero: "218000", libelle: "Autres immobilisations corporelles", classe: "2", type: "ACTIF" as const, description: "Mobilier, matériel de bureau, véhicules" },
  { numero: "261000", libelle: "Titres de participation", classe: "2", type: "ACTIF" as const, description: "Participations dans filiales (holding)" },
  { numero: "266000", libelle: "Autres formes de participation", classe: "2", type: "ACTIF" as const, description: "Parts sociales, actions" },
  { numero: "267000", libelle: "Créances rattachées à des participations", classe: "2", type: "ACTIF" as const, description: "Prêts aux filiales" },
  { numero: "271000", libelle: "Titres immobilisés", classe: "2", type: "ACTIF" as const, description: "Actions et obligations détenues durablement" },
  { numero: "274000", libelle: "Prêts", classe: "2", type: "ACTIF" as const, description: "Prêts accordés" },
  { numero: "275000", libelle: "Dépôts et cautionnements versés", classe: "2", type: "ACTIF" as const, description: "Cautions versées" },

  // CLASSE 3 - COMPTES DE STOCKS
  { numero: "310000", libelle: "Matières premières", classe: "3", type: "ACTIF" as const, description: "Matières premières et fournitures" },
  { numero: "320000", libelle: "Autres approvisionnements", classe: "3", type: "ACTIF" as const, description: "Matières consommables, emballages" },
  { numero: "331000", libelle: "Produits en cours", classe: "3", type: "ACTIF" as const, description: "Production en cours" },
  { numero: "335000", libelle: "Travaux en cours", classe: "3", type: "ACTIF" as const, description: "Prestations en cours" },
  { numero: "355000", libelle: "Produits finis", classe: "3", type: "ACTIF" as const, description: "Produits fabriqués" },
  { numero: "370000", libelle: "Stocks de marchandises", classe: "3", type: "ACTIF" as const, description: "Marchandises destinées à la revente" },

  // CLASSE 4 - COMPTES DE TIERS
  { numero: "401000", libelle: "Fournisseurs", classe: "4", type: "PASSIF" as const, description: "Dettes fournisseurs" },
  { numero: "404000", libelle: "Fournisseurs d'immobilisations", classe: "4", type: "PASSIF" as const, description: "Dettes sur immobilisations" },
  { numero: "408100", libelle: "Fournisseurs - Factures non parvenues", classe: "4", type: "PASSIF" as const, description: "Charges à payer" },
  { numero: "409000", libelle: "Fournisseurs débiteurs", classe: "4", type: "ACTIF" as const, description: "Avances et acomptes versés" },
  { numero: "411000", libelle: "Clients", classe: "4", type: "ACTIF" as const, description: "Créances clients" },
  { numero: "413000", libelle: "Clients - Effets à recevoir", classe: "4", type: "ACTIF" as const, description: "Traites acceptées" },
  { numero: "416000", libelle: "Clients douteux", classe: "4", type: "ACTIF" as const, description: "Créances douteuses" },
  { numero: "418100", libelle: "Clients - Factures à établir", classe: "4", type: "ACTIF" as const, description: "Produits à recevoir" },
  { numero: "419000", libelle: "Clients créditeurs", classe: "4", type: "PASSIF" as const, description: "Avances et acomptes reçus" },
  { numero: "421000", libelle: "Personnel - Rémunérations dues", classe: "4", type: "PASSIF" as const, description: "Salaires à payer" },
  { numero: "422000", libelle: "Comités d'entreprise", classe: "4", type: "PASSIF" as const, description: "Dettes envers le CSE" },
  { numero: "425000", libelle: "Personnel - Avances et acomptes", classe: "4", type: "ACTIF" as const, description: "Avances sur salaires" },
  { numero: "427000", libelle: "Personnel - Oppositions", classe: "4", type: "PASSIF" as const, description: "Saisies sur salaires" },
  { numero: "428000", libelle: "Personnel - Charges à payer", classe: "4", type: "PASSIF" as const, description: "Congés payés, primes à payer" },
  { numero: "431000", libelle: "Sécurité sociale", classe: "4", type: "PASSIF" as const, description: "Cotisations URSSAF" },
  { numero: "437000", libelle: "Autres organismes sociaux", classe: "4", type: "PASSIF" as const, description: "Caisses de retraite, prévoyance" },
  { numero: "441000", libelle: "État - Subventions à recevoir", classe: "4", type: "ACTIF" as const, description: "Subventions accordées" },
  { numero: "442000", libelle: "État - Impôts et taxes recouvrables", classe: "4", type: "PASSIF" as const, description: "Impôts à payer" },
  { numero: "444000", libelle: "État - Impôt sur les bénéfices", classe: "4", type: "PASSIF" as const, description: "IS à payer" },
  { numero: "445510", libelle: "TVA à décaisser", classe: "4", type: "PASSIF" as const, description: "TVA collectée" },
  { numero: "445620", libelle: "TVA déductible sur immobilisations", classe: "4", type: "ACTIF" as const, description: "TVA récupérable sur investissements" },
  { numero: "445660", libelle: "TVA déductible sur autres biens et services", classe: "4", type: "ACTIF" as const, description: "TVA récupérable sur charges" },
  { numero: "445670", libelle: "Crédit de TVA", classe: "4", type: "ACTIF" as const, description: "Crédit de TVA à reporter" },
  { numero: "445710", libelle: "TVA collectée", classe: "4", type: "PASSIF" as const, description: "TVA sur ventes" },
  { numero: "447000", libelle: "Autres impôts et taxes", classe: "4", type: "PASSIF" as const, description: "Taxes diverses" },
  { numero: "451000", libelle: "Groupe et associés", classe: "4", type: "ACTIF" as const, description: "Comptes courants d'associés" },
  { numero: "455000", libelle: "Associés - Comptes courants", classe: "4", type: "PASSIF" as const, description: "Apports en compte courant" },
  { numero: "456000", libelle: "Associés - Opérations sur le capital", classe: "4", type: "ACTIF" as const, description: "Capital souscrit non appelé" },
  { numero: "457000", libelle: "Associés - Dividendes à payer", classe: "4", type: "PASSIF" as const, description: "Dividendes votés" },
  { numero: "462000", libelle: "Créances sur cessions d'immobilisations", classe: "4", type: "ACTIF" as const, description: "Ventes d'actifs à encaisser" },
  { numero: "467000", libelle: "Autres comptes débiteurs ou créditeurs", classe: "4", type: "ACTIF" as const, description: "Comptes transitoires" },
  { numero: "471000", libelle: "Comptes d'attente", classe: "4", type: "ACTIF" as const, description: "Opérations en cours de régularisation" },
  { numero: "476000", libelle: "Différences de conversion - Actif", classe: "4", type: "ACTIF" as const, description: "Pertes latentes de change" },
  { numero: "477000", libelle: "Différences de conversion - Passif", classe: "4", type: "PASSIF" as const, description: "Gains latents de change" },
  { numero: "481000", libelle: "Charges à répartir", classe: "4", type: "ACTIF" as const, description: "Frais d'émission d'emprunts" },
  { numero: "486000", libelle: "Charges constatées d'avance", classe: "4", type: "ACTIF" as const, description: "Charges payées d'avance" },
  { numero: "487000", libelle: "Produits constatés d'avance", classe: "4", type: "PASSIF" as const, description: "Produits perçus d'avance" },
  { numero: "491000", libelle: "Provisions pour dépréciation des comptes clients", classe: "4", type: "PASSIF" as const, description: "Provisions sur créances douteuses" },

  // CLASSE 5 - COMPTES FINANCIERS
  { numero: "503000", libelle: "Actions", classe: "5", type: "ACTIF" as const, description: "Actions cotées (VMP)" },
  { numero: "506000", libelle: "Obligations", classe: "5", type: "ACTIF" as const, description: "Obligations (VMP)" },
  { numero: "508000", libelle: "Autres valeurs mobilières", classe: "5", type: "ACTIF" as const, description: "SICAV, FCP" },
  { numero: "511000", libelle: "Valeurs à l'encaissement", classe: "5", type: "ACTIF" as const, description: "Chèques à encaisser" },
  { numero: "512000", libelle: "Banques", classe: "5", type: "ACTIF" as const, description: "Comptes bancaires" },
  { numero: "514000", libelle: "Chèques postaux", classe: "5", type: "ACTIF" as const, description: "CCP" },
  { numero: "517000", libelle: "Autres organismes financiers", classe: "5", type: "ACTIF" as const, description: "Comptes sur livrets" },
  { numero: "518000", libelle: "Intérêts courus", classe: "5", type: "ACTIF" as const, description: "Intérêts à recevoir" },
  { numero: "519000", libelle: "Concours bancaires courants", classe: "5", type: "PASSIF" as const, description: "Découverts bancaires" },
  { numero: "531000", libelle: "Caisse", classe: "5", type: "ACTIF" as const, description: "Espèces en caisse" },
  { numero: "580000", libelle: "Virements internes", classe: "5", type: "ACTIF" as const, description: "Mouvements entre comptes" },

  // CLASSE 6 - COMPTES DE CHARGES
  { numero: "601000", libelle: "Achats stockés - Matières premières", classe: "6", type: "CHARGE" as const, description: "Achats de matières premières" },
  { numero: "602000", libelle: "Achats stockés - Autres approvisionnements", classe: "6", type: "CHARGE" as const, description: "Achats de fournitures" },
  { numero: "603000", libelle: "Variations de stocks", classe: "6", type: "CHARGE" as const, description: "Variation des stocks d'approvisionnements" },
  { numero: "604000", libelle: "Achats d'études et prestations", classe: "6", type: "CHARGE" as const, description: "Prestations de services" },
  { numero: "605000", libelle: "Achats de matériel et équipements", classe: "6", type: "CHARGE" as const, description: "Petit matériel" },
  { numero: "606000", libelle: "Achats non stockés", classe: "6", type: "CHARGE" as const, description: "Fournitures non stockables" },
  { numero: "606100", libelle: "Fournitures non stockables (eau, énergie)", classe: "6", type: "CHARGE" as const, description: "Eau, gaz, électricité" },
  { numero: "606300", libelle: "Fournitures d'entretien et petit équipement", classe: "6", type: "CHARGE" as const, description: "Fournitures d'entretien" },
  { numero: "606400", libelle: "Fournitures administratives", classe: "6", type: "CHARGE" as const, description: "Fournitures de bureau" },
  { numero: "607000", libelle: "Achats de marchandises", classe: "6", type: "CHARGE" as const, description: "Marchandises destinées à la revente" },
  { numero: "609000", libelle: "Rabais, remises et ristournes obtenus", classe: "6", type: "CHARGE" as const, description: "RRR sur achats (compte créditeur)" },
  { numero: "611000", libelle: "Sous-traitance générale", classe: "6", type: "CHARGE" as const, description: "Prestations sous-traitées" },
  { numero: "612000", libelle: "Redevances de crédit-bail", classe: "6", type: "CHARGE" as const, description: "Leasing mobilier et immobilier" },
  { numero: "613000", libelle: "Locations", classe: "6", type: "CHARGE" as const, description: "Loyers immobiliers" },
  { numero: "614000", libelle: "Charges locatives", classe: "6", type: "CHARGE" as const, description: "Charges de copropriété" },
  { numero: "615000", libelle: "Entretien et réparations", classe: "6", type: "CHARGE" as const, description: "Maintenance et réparations" },
  { numero: "616000", libelle: "Primes d'assurances", classe: "6", type: "CHARGE" as const, description: "Assurances diverses" },
  { numero: "617000", libelle: "Études et recherches", classe: "6", type: "CHARGE" as const, description: "Frais de R&D externalisés" },
  { numero: "618000", libelle: "Divers services extérieurs", classe: "6", type: "CHARGE" as const, description: "Documentation, colloques" },
  { numero: "621000", libelle: "Personnel extérieur", classe: "6", type: "CHARGE" as const, description: "Intérim, mise à disposition" },
  { numero: "622000", libelle: "Rémunérations d'intermédiaires", classe: "6", type: "CHARGE" as const, description: "Commissions, honoraires" },
  { numero: "622600", libelle: "Honoraires", classe: "6", type: "CHARGE" as const, description: "Avocats, experts-comptables" },
  { numero: "622700", libelle: "Frais d'actes et de contentieux", classe: "6", type: "CHARGE" as const, description: "Frais juridiques" },
  { numero: "623000", libelle: "Publicité et relations publiques", classe: "6", type: "CHARGE" as const, description: "Marketing et communication" },
  { numero: "624000", libelle: "Transports de biens", classe: "6", type: "CHARGE" as const, description: "Frais de transport" },
  { numero: "625000", libelle: "Déplacements et missions", classe: "6", type: "CHARGE" as const, description: "Frais de déplacement" },
  { numero: "626000", libelle: "Frais postaux et télécommunications", classe: "6", type: "CHARGE" as const, description: "Téléphone, internet, courrier" },
  { numero: "627000", libelle: "Services bancaires", classe: "6", type: "CHARGE" as const, description: "Frais bancaires" },
  { numero: "628000", libelle: "Divers services", classe: "6", type: "CHARGE" as const, description: "Cotisations, frais divers" },
  { numero: "631000", libelle: "Impôts et taxes sur rémunérations", classe: "6", type: "CHARGE" as const, description: "Taxe sur les salaires" },
  { numero: "633000", libelle: "Impôts et taxes sur rémunérations (autres)", classe: "6", type: "CHARGE" as const, description: "Formation, apprentissage" },
  { numero: "635000", libelle: "Autres impôts et taxes", classe: "6", type: "CHARGE" as const, description: "CET, taxes foncières" },
  { numero: "641000", libelle: "Rémunérations du personnel", classe: "6", type: "CHARGE" as const, description: "Salaires bruts" },
  { numero: "645000", libelle: "Charges de sécurité sociale", classe: "6", type: "CHARGE" as const, description: "Cotisations patronales URSSAF" },
  { numero: "647000", libelle: "Autres charges sociales", classe: "6", type: "CHARGE" as const, description: "Mutuelle, prévoyance" },
  { numero: "648000", libelle: "Autres charges de personnel", classe: "6", type: "CHARGE" as const, description: "Médecine du travail, CE" },
  { numero: "651000", libelle: "Redevances pour concessions, brevets", classe: "6", type: "CHARGE" as const, description: "Royalties" },
  { numero: "654000", libelle: "Pertes sur créances irrécouvrables", classe: "6", type: "CHARGE" as const, description: "Créances perdues" },
  { numero: "658000", libelle: "Charges diverses de gestion courante", classe: "6", type: "CHARGE" as const, description: "Charges de gestion diverses" },
  { numero: "661000", libelle: "Charges d'intérêts", classe: "6", type: "CHARGE" as const, description: "Intérêts des emprunts" },
  { numero: "665000", libelle: "Escomptes accordés", classe: "6", type: "CHARGE" as const, description: "Escomptes commerciaux" },
  { numero: "666000", libelle: "Pertes de change", classe: "6", type: "CHARGE" as const, description: "Différences de change négatives" },
  { numero: "667000", libelle: "Charges nettes sur cessions de VMP", classe: "6", type: "CHARGE" as const, description: "Moins-values sur VMP" },
  { numero: "668000", libelle: "Autres charges financières", classe: "6", type: "CHARGE" as const, description: "Charges financières diverses" },
  { numero: "671000", libelle: "Charges exceptionnelles sur opérations de gestion", classe: "6", type: "CHARGE" as const, description: "Pénalités, amendes" },
  { numero: "675000", libelle: "Valeurs comptables des éléments d'actif cédés", classe: "6", type: "CHARGE" as const, description: "VNC des immobilisations cédées" },
  { numero: "678000", libelle: "Autres charges exceptionnelles", classe: "6", type: "CHARGE" as const, description: "Charges exceptionnelles diverses" },
  { numero: "681000", libelle: "Dotations aux amortissements", classe: "6", type: "CHARGE" as const, description: "Amortissements des immobilisations" },
  { numero: "681100", libelle: "Dotations aux amortissements des immobilisations incorporelles", classe: "6", type: "CHARGE" as const, description: "Amortissement logiciels, brevets" },
  { numero: "681200", libelle: "Dotations aux amortissements des immobilisations corporelles", classe: "6", type: "CHARGE" as const, description: "Amortissement matériel, mobilier" },
  { numero: "686000", libelle: "Dotations aux provisions", classe: "6", type: "CHARGE" as const, description: "Provisions pour risques et charges" },
  { numero: "687000", libelle: "Dotations aux provisions exceptionnelles", classe: "6", type: "CHARGE" as const, description: "Provisions exceptionnelles" },
  { numero: "691000", libelle: "Participation des salariés", classe: "6", type: "CHARGE" as const, description: "Participation légale" },
  { numero: "695000", libelle: "Impôts sur les bénéfices", classe: "6", type: "CHARGE" as const, description: "Impôt sur les sociétés" },
  { numero: "698000", libelle: "Intégration fiscale", classe: "6", type: "CHARGE" as const, description: "Charges d'intégration fiscale (holding)" },
  { numero: "699000", libelle: "Produits - Report en arrière des déficits", classe: "6", type: "CHARGE" as const, description: "Carry-back (compte créditeur)" },

  // CLASSE 7 - COMPTES DE PRODUITS
  { numero: "701000", libelle: "Ventes de produits finis", classe: "7", type: "PRODUIT" as const, description: "Ventes de production" },
  { numero: "704000", libelle: "Travaux", classe: "7", type: "PRODUIT" as const, description: "Prestations de travaux" },
  { numero: "706000", libelle: "Prestations de services", classe: "7", type: "PRODUIT" as const, description: "Ventes de services" },
  { numero: "707000", libelle: "Ventes de marchandises", classe: "7", type: "PRODUIT" as const, description: "Revente de marchandises" },
  { numero: "708000", libelle: "Produits des activités annexes", classe: "7", type: "PRODUIT" as const, description: "Commissions, locations, redevances" },
  { numero: "708500", libelle: "Ports et frais accessoires facturés", classe: "7", type: "PRODUIT" as const, description: "Refacturation de frais" },
  { numero: "709000", libelle: "Rabais, remises et ristournes accordés", classe: "7", type: "PRODUIT" as const, description: "RRR sur ventes (compte débiteur)" },
  { numero: "713000", libelle: "Variation des stocks", classe: "7", type: "PRODUIT" as const, description: "Production stockée" },
  { numero: "721000", libelle: "Production immobilisée - Incorporelle", classe: "7", type: "PRODUIT" as const, description: "Logiciels créés en interne" },
  { numero: "722000", libelle: "Production immobilisée - Corporelle", classe: "7", type: "PRODUIT" as const, description: "Immobilisations produites" },
  { numero: "740000", libelle: "Subventions d'exploitation", classe: "7", type: "PRODUIT" as const, description: "Aides à l'exploitation" },
  { numero: "751000", libelle: "Redevances pour concessions, brevets", classe: "7", type: "PRODUIT" as const, description: "Royalties perçues" },
  { numero: "752000", libelle: "Revenus des immeubles", classe: "7", type: "PRODUIT" as const, description: "Loyers perçus" },
  { numero: "753000", libelle: "Jetons de présence", classe: "7", type: "PRODUIT" as const, description: "Rémunération d'administrateur" },
  { numero: "754000", libelle: "Ristournes perçues des coopératives", classe: "7", type: "PRODUIT" as const, description: "Ristournes coopératives" },
  { numero: "755000", libelle: "Quotes-parts de résultat sur opérations faites en commun", classe: "7", type: "PRODUIT" as const, description: "Résultats de GIE, SEP" },
  { numero: "758000", libelle: "Produits divers de gestion courante", classe: "7", type: "PRODUIT" as const, description: "Produits de gestion divers" },
  { numero: "761000", libelle: "Produits de participations", classe: "7", type: "PRODUIT" as const, description: "Dividendes reçus des filiales (holding)" },
  { numero: "762000", libelle: "Produits des autres immobilisations financières", classe: "7", type: "PRODUIT" as const, description: "Intérêts des prêts" },
  { numero: "763000", libelle: "Revenus des autres créances", classe: "7", type: "PRODUIT" as const, description: "Intérêts des créances" },
  { numero: "764000", libelle: "Revenus des valeurs mobilières", classe: "7", type: "PRODUIT" as const, description: "Dividendes et intérêts des VMP" },
  { numero: "765000", libelle: "Escomptes obtenus", classe: "7", type: "PRODUIT" as const, description: "Escomptes commerciaux" },
  { numero: "766000", libelle: "Gains de change", classe: "7", type: "PRODUIT" as const, description: "Différences de change positives" },
  { numero: "767000", libelle: "Produits nets sur cessions de VMP", classe: "7", type: "PRODUIT" as const, description: "Plus-values sur VMP" },
  { numero: "768000", libelle: "Autres produits financiers", classe: "7", type: "PRODUIT" as const, description: "Produits financiers divers" },
  { numero: "771000", libelle: "Produits exceptionnels sur opérations de gestion", classe: "7", type: "PRODUIT" as const, description: "Pénalités perçues, dégrèvements" },
  { numero: "775000", libelle: "Produits des cessions d'éléments d'actif", classe: "7", type: "PRODUIT" as const, description: "Prix de vente des immobilisations" },
  { numero: "777000", libelle: "Quote-part des subventions d'investissement", classe: "7", type: "PRODUIT" as const, description: "Reprise de subventions" },
  { numero: "778000", libelle: "Autres produits exceptionnels", classe: "7", type: "PRODUIT" as const, description: "Produits exceptionnels divers" },
  { numero: "781000", libelle: "Reprises sur amortissements et provisions", classe: "7", type: "PRODUIT" as const, description: "Reprises d'exploitation" },
  { numero: "786000", libelle: "Reprises sur provisions pour risques", classe: "7", type: "PRODUIT" as const, description: "Reprises de provisions" },
  { numero: "787000", libelle: "Reprises sur provisions exceptionnelles", classe: "7", type: "PRODUIT" as const, description: "Reprises exceptionnelles" },
  { numero: "791000", libelle: "Transferts de charges d'exploitation", classe: "7", type: "PRODUIT" as const, description: "Refacturation de charges" },
  { numero: "796000", libelle: "Transferts de charges financières", classe: "7", type: "PRODUIT" as const, description: "Transferts financiers" },
  { numero: "797000", libelle: "Transferts de charges exceptionnelles", classe: "7", type: "PRODUIT" as const, description: "Transferts exceptionnels" },
  { numero: "798000", libelle: "Produits d'intégration fiscale", classe: "7", type: "PRODUIT" as const, description: "Économie d'IS (holding)" }
];

// Journaux comptables standard pour SAS
const JOURNAUX_COMPTABLES = [
  { code: "AC", libelle: "Achats", type: "ACHAT" as const, description: "Journal des achats et frais généraux" },
  { code: "VE", libelle: "Ventes", type: "VENTE" as const, description: "Journal des ventes et prestations" },
  { code: "BQ", libelle: "Banque", type: "BANQUE" as const, description: "Journal des opérations bancaires" },
  { code: "CA", libelle: "Caisse", type: "CAISSE" as const, description: "Journal des opérations de caisse" },
  { code: "OD", libelle: "Opérations diverses", type: "OD" as const, description: "Journal des opérations diverses" },
  { code: "AN", libelle: "À nouveaux", type: "AN" as const, description: "Journal des écritures d'à nouveaux" },
  { code: "PA", libelle: "Paie", type: "PAIE" as const, description: "Journal de paie et charges sociales" },
  { code: "IM", libelle: "Immobilisations", type: "IMMO" as const, description: "Journal des immobilisations et amortissements" },
  { code: "TV", libelle: "TVA", type: "TVA" as const, description: "Journal des déclarations de TVA" },
  { code: "FI", libelle: "Fiscalité", type: "FISCAL" as const, description: "Journal des opérations fiscales (IS, CET)" },
  { code: "GR", libelle: "Groupe", type: "GROUPE" as const, description: "Journal des opérations intra-groupe (holding)" }
];

// Taux de TVA en vigueur en France
const TAUX_TVA_FRANCE = [
  { taux: 20.00, libelle: "Taux normal", typeOperation: "NORMAL" as const, defaut: true },
  { taux: 10.00, libelle: "Taux intermédiaire", typeOperation: "INTERMEDIAIRE" as const, defaut: false },
  { taux: 5.50, libelle: "Taux réduit", typeOperation: "REDUIT" as const, defaut: false },
  { taux: 2.10, libelle: "Taux super réduit", typeOperation: "SUPER_REDUIT" as const, defaut: false },
  { taux: 0.00, libelle: "Exonéré", typeOperation: "EXONERE" as const, defaut: false },
  { taux: 0.00, libelle: "Non assujetti", typeOperation: "NON_ASSUJETTI" as const, defaut: false }
];

// Paramètres comptables pour SAS française
const PARAMETRES_COMPTABLES = {
  societe: "Free Sales Management SAS",
  formeJuridique: "SAS - Société par Actions Simplifiée",
  siret: "À RENSEIGNER",
  naf: "6201Z", // Programmation informatique
  numeroTVA: "À RENSEIGNER",
  regimeTVA: "REEL_NORMAL" as const, // Réel normal mensuel
  regimeFiscal: "IS" as const, // Impôt sur les sociétés
  exerciceOuverture: new Date(new Date().getFullYear(), 0, 1), // 1er janvier
  exerciceCloture: new Date(new Date().getFullYear(), 11, 31), // 31 décembre
  dureeAmortissement: {
    fraisEtablissement: 5,
    brevetsLicences: 5,
    logiciels: 3,
    siteWeb: 3,
    materielBureau: 5,
    mobilier: 10,
    materielInformatique: 3,
    vehicules: 5,
    amenagements: 10
  },
  seuilsComptables: {
    immobilisation: 500, // Seuil d'immobilisation en euros HT
    provisionCreance: 180, // Délai pour provision en jours
    escompte: 2, // Taux d'escompte standard en %
    penalitesRetard: 10 // Taux de pénalités de retard en %
  },
  integrationFiscale: false, // Activation quand passage en holding
  consolidation: false // Activation quand filiales créées
};

export async function initComptabilite() {
  console.log("🚀 Initialisation du système comptable pour SAS française...");
  
  try {
    // 1. Créer l'exercice comptable en cours
    const exerciceActuel = new Date().getFullYear();
    console.log(`📅 Création de l'exercice comptable ${exerciceActuel}...`);
    
    const [exercice] = await db.insert(exercicesComptables).values({
      annee: exerciceActuel,
      dateDebut: new Date(exerciceActuel, 0, 1).toISOString(),
      dateFin: new Date(exerciceActuel, 11, 31).toISOString(),
      statut: "OUVERT",
      cloture: false
    }).returning();
    
    console.log(`✅ Exercice ${exerciceActuel} créé`);
    
    // 2. Insérer le plan comptable
    console.log("📊 Installation du Plan Comptable Général français...");
    
    for (const compte of PLAN_COMPTABLE_SAS) {
      await db.insert(planComptable).values({
        ...compte,
        actif: true,
        exerciceId: exercice.id
      }).onConflictDoNothing();
    }
    
    console.log(`✅ ${PLAN_COMPTABLE_SAS.length} comptes créés`);
    
    // 3. Créer les journaux comptables
    console.log("📚 Création des journaux comptables...");
    
    for (const journal of JOURNAUX_COMPTABLES) {
      await db.insert(journauxComptables).values({
        ...journal,
        actif: true,
        exerciceId: exercice.id,
        dernierNumero: 0
      }).onConflictDoNothing();
    }
    
    console.log(`✅ ${JOURNAUX_COMPTABLES.length} journaux créés`);
    
    // 4. Configurer les taux de TVA
    console.log("💶 Configuration des taux de TVA...");
    
    for (const tva of TAUX_TVA_FRANCE) {
      await db.insert(tauxTVA).values({
        ...tva,
        dateDebut: new Date(exerciceActuel, 0, 1).toISOString(),
        actif: true
      }).onConflictDoNothing();
    }
    
    console.log(`✅ ${TAUX_TVA_FRANCE.length} taux de TVA configurés`);
    
    // 5. Enregistrer les paramètres comptables
    console.log("⚙️ Configuration des paramètres comptables...");
    
    await db.insert(parametresComptables).values({
      cle: "SOCIETE",
      valeur: JSON.stringify(PARAMETRES_COMPTABLES),
      description: "Paramètres généraux de la société"
    }).onConflictDoNothing();
    
    console.log("✅ Paramètres comptables configurés");
    
    // 6. Message de succès avec informations importantes
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SYSTÈME COMPTABLE INITIALISÉ AVEC SUCCÈS !");
    console.log("=".repeat(60));
    console.log("\n📋 Configuration:");
    console.log(`   • Forme juridique: ${PARAMETRES_COMPTABLES.formeJuridique}`);
    console.log(`   • Régime TVA: ${PARAMETRES_COMPTABLES.regimeTVA}`);
    console.log(`   • Régime fiscal: ${PARAMETRES_COMPTABLES.regimeFiscal}`);
    console.log(`   • Exercice: du 01/01/${exerciceActuel} au 31/12/${exerciceActuel}`);
    console.log("\n⚠️  IMPORTANT:");
    console.log("   • Renseigner le SIRET et le numéro de TVA intracommunautaire");
    console.log("   • Configurer les coordonnées bancaires");
    console.log("   • Paramétrer les comptes de charges et produits spécifiques");
    console.log("   • Activer l'intégration fiscale lors du passage en holding");
    console.log("\n✨ Le système est prêt pour:");
    console.log("   • Saisie des écritures comptables");
    console.log("   • Gestion de la TVA (déclarations CA3/CA12)");
    console.log("   • Calcul de l'IS et établissement des liasses fiscales");
    console.log("   • Export FEC pour l'administration fiscale");
    console.log("   • Consolidation future avec les filiales");
    console.log("=".repeat(60) + "\n");
    
    return { success: true, message: "Système comptable initialisé" };
    
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    throw error;
  }
}

// Fonction pour vérifier si l'initialisation est nécessaire
export async function checkInitRequired(): Promise<boolean> {
  const exercices = await db.select().from(exercicesComptables).limit(1);
  return exercices.length === 0;
}

// Exécution directe si appelé en ligne de commande
if (import.meta.url === `file://${process.argv[1]}`) {
  initComptabilite()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}