import { z } from "zod";
import { isValid, parse, differenceInYears } from "date-fns";

// Fonction pour valider l'âge minimum (18 ans)
function validateAge(dateStr: string | null) {
  if (!dateStr) return false;
  
  try {
    const date = parse(dateStr, "dd/MM/yyyy", new Date());
    if (!isValid(date)) return false;
    
    const age = differenceInYears(new Date(), date);
    return age >= 18;
  } catch (e) {
    return false;
  }
}

// Format de validation pour l'identifiant Freebox
const freeboxIdRegex = /^FO\d{8}$/;

// Format de validation pour l'identifiant Forfait 5G
const forfait5GIdRegex = /^\d{8}$/;

// Options pour les types de civilité
export const civiliteOptions = ["M.", "Mme", "Mlle"] as const;

// Options pour les produits
export const produitOptions = ["Freebox Pop", "Freebox Essentiel", "Freebox Ultra", "Forfait 5G"] as const;

// Options pour les types de portabilité
export const portabiliteOptions = ["Création", "Portabilité"] as const;

// Options pour les sources
export const sourceOptions = [
  "Prospection direct",
  "Flyer",
  "Recommandation",
  "Réseaux sociaux",
  "Site Web",
  "Autocollant",
  "Autre"
] as const;

// Options pour le type de recommandation
export const typeRecommandationOptions = ["Client", "Prospect"] as const;

// Schéma de validation pour les informations de prospect
export const prospectSchema = z.object({
  civiliteProspect: z.enum(["M.", "Mme", "Mlle"] as const),
  prenomProspect: z.string().optional(),
  nomProspect: z.string().optional(),
  mobileProspect: z.string().min(10, "Le numéro de mobile doit comporter au moins 10 caractères"),
  codePostalProspect: z.string().min(5, "Le code postal doit comporter 5 caractères"),
  villeProspect: z.string().min(1, "La ville est requise"),
})
.refine(
  (data) => data.prenomProspect || data.nomProspect,
  {
    message: "Vous devez fournir au moins le prénom ou le nom du prospect",
    path: ["prenomProspect"],
  }
);

// Schéma principal de validation du client
export const clientFormSchema = z.object({
  // Informations personnelles (obligatoires)
  civilite: z.enum(civiliteOptions),
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  dateNaissance: z.string()
    .min(1, "La date de naissance est requise")
    .refine(
      (date) => {
        if (!date) return false;
        return validateAge(date);
      },
      {
        message: "Le client doit avoir au moins 18 ans",
      }
    ),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(10, "Le numéro de mobile doit comporter au moins 10 caractères"),
  
  // Informations personnelles (optionnelles)
  fixe: z.string().optional().nullable(),
  
  // Adresse (obligatoire)
  adresse: z.string().min(1, "L'adresse est requise"),
  codePostal: z.string().min(5, "Le code postal doit comporter 5 caractères"),
  ville: z.string().min(1, "La ville est requise"),
  
  // Informations sur le produit (obligatoire)
  produit: z.enum(produitOptions),
  identifiantContrat: z.string()
    .refine(
      (id) => {
        if (!id) return false;
        return true;
      },
      {
        message: "L'identifiant du contrat est requis",
      }
    ),
  
  // Champs conditionnels pour les forfaits 5G
  carteSim: z.string().optional().nullable(),
  portabilite: z.enum(portabiliteOptions).optional().nullable(),
  numeroPorter: z.string().optional().nullable(),
  
  // Source et recommandation
  source: z.enum(sourceOptions),
  typeRecommandation: z.enum(typeRecommandationOptions).optional().nullable(),
  clientId: z.number().optional().nullable(),
  
  // Prospect (conditionnel)
  civiliteProspect: z.enum(["M.", "Mme", "Mlle"] as const).optional().nullable(),
  prenomProspect: z.string().optional().nullable(),
  nomProspect: z.string().optional().nullable(),
  mobileProspect: z.string().optional().nullable(),
  codePostalProspect: z.string().optional().nullable(),
  villeProspect: z.string().optional().nullable(),
  
  // Champs additionnels
  commentaire: z.string().optional().nullable(),
  dateSignature: z.string().min(1, "La date de signature est requise"),
  
  // Champs système et état
  status: z.string().optional(),
  dateRendezVous: z.string().optional().nullable(),
  dateInstallation: z.string().optional().nullable(),
  codeVendeur: z.string().optional().nullable(),
  forfaitType: z.string().optional().nullable(),
  
  // Champs de validation
  contratSigne: z.boolean().optional().nullable(),
  identiteValidee: z.boolean().optional().nullable(),
  ribValide: z.boolean().optional().nullable(),
  justificatifDomicileValide: z.boolean().optional().nullable(),
})
.superRefine((data, ctx) => {
  // Validation conditionnelle pour l'identifiant de contrat
  if (data.produit) {
    if (!data.identifiantContrat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'identifiant du contrat est requis",
        path: ["identifiantContrat"],
      });
    } else {
      // Validation du format selon le type de produit
      if (
        ["Freebox Pop", "Freebox Essentiel", "Freebox Ultra"].includes(data.produit) &&
        !freeboxIdRegex.test(data.identifiantContrat)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'identifiant doit être au format FO + 8 chiffres",
          path: ["identifiantContrat"],
        });
      } else if (
        data.produit === "Forfait 5G" &&
        !forfait5GIdRegex.test(data.identifiantContrat)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'identifiant doit être au format 8 chiffres",
          path: ["identifiantContrat"],
        });
      }
    }
  }

  // Validation pour Forfait 5G - Carte SIM requise
  if (data.produit === "Forfait 5G" && !data.carteSim) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Une carte SIM est requise pour un forfait 5G",
      path: ["carteSim"],
    });
  }

  // Validation pour Portabilité - Numéro à porter requis
  if (data.portabilite === "Portabilité" && !data.numeroPorter) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le numéro à porter est requis",
      path: ["numeroPorter"],
    });
  }

  // Validation source = Recommandation
  if (data.source === "Recommandation") {
    if (!data.typeRecommandation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le type de recommandation est requis",
        path: ["typeRecommandation"],
      });
    } else {
      // Client sélectionné ou informations prospect
      if (data.typeRecommandation === "Client" && !data.clientId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Veuillez sélectionner un client",
          path: ["clientId"],
        });
      } else if (data.typeRecommandation === "Prospect") {
        // Vérification des champs pour un prospect
        if (!data.civiliteProspect) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La civilité du prospect est requise",
            path: ["civiliteProspect"],
          });
        }
        
        // Au moins un des deux (prénom ou nom) doit être fourni
        if (!data.prenomProspect && !data.nomProspect) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Vous devez fournir au moins le prénom ou le nom du prospect",
            path: ["prenomProspect"],
          });
        }
        
        if (!data.mobileProspect) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le mobile du prospect est requis",
            path: ["mobileProspect"],
          });
        }
        
        if (!data.codePostalProspect) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le code postal du prospect est requis",
            path: ["codePostalProspect"],
          });
        }
        
        if (!data.villeProspect) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La ville du prospect est requise",
            path: ["villeProspect"],
          });
        }
      }
    }
  }
});

// Type inféré à partir du schéma
export type ClientFormValues = z.infer<typeof clientFormSchema>;