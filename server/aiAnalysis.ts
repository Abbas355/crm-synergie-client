import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface VendorProfile {
  experience?: string;
  availability?: string;
  financialGoal?: string;
  motivation?: string;
  additionalComments?: string;
}

export async function analyzeVendorProfile(profile: VendorProfile): Promise<string> {
  try {
    console.log("🤖 Début analyse IA pour profil:", profile);
    
    if (!profile.experience && !profile.availability && !profile.financialGoal && !profile.motivation) {
      return "Profil incomplet - Analyse impossible sans informations de base.";
    }

    // Vérifier que la clé API Gemini est disponible
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY non disponible");
      return generateBasicAnalysis(profile);
    }

    const prompt = `En tant qu'expert en coaching commercial et développement des ventes, analysez ce profil vendeur et proposez un plan d'accompagnement personnalisé :

PROFIL VENDEUR :
- Expérience en vente : ${profile.experience || "Non renseignée"}
- Disponibilité : ${profile.availability || "Non renseignée"}  
- Objectif financier : ${profile.financialGoal || "Non renseigné"}
- Motivation principale : ${profile.motivation || "Non renseignée"}
- Commentaires additionnels : ${profile.additionalComments || "Aucun"}

MISSION : Générez une proposition d'accompagnement structurée et actionnable qui inclut :

1. ANALYSE DU PROFIL (2-3 lignes)
   - Forces identifiées
   - Points d'attention

2. PLAN D'ACCOMPAGNEMENT RECOMMANDÉ
   - Formation prioritaire suggérée
   - Durée d'intégration estimée
   - Objectifs intermédiaires

3. STRATÉGIE DE DÉMARRAGE
   - Première action concrète
   - Support nécessaire
   - Outils recommandés

Rédigez votre réponse de manière professionnelle, motivante et actionnable. Adaptez le niveau de support selon l'expérience déclarée.`;

    console.log("🤖 Envoi prompt à Gemini...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("🤖 Réponse Gemini reçue:", response);
    
    const analysis = response.text;
    
    if (!analysis || analysis.trim() === '') {
      console.error("❌ Réponse Gemini vide, utilisation du fallback");
      return generateBasicAnalysis(profile);
    }
    
    // Ajouter un en-tête et une date à l'analyse
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const finalAnalysis = `🤖 ANALYSE IA AUTOMATIQUE - ${currentDate}\n\n${analysis}\n\n---\nCette analyse peut être modifiée selon vos observations complémentaires.`;
    
    console.log("✅ Analyse IA générée avec succès");
    return finalAnalysis;

  } catch (error) {
    console.error("❌ Erreur lors de l'analyse IA:", error);
    return generateBasicAnalysis(profile);
  }
}

function generateBasicAnalysis(profile: VendorProfile): string {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const expMap: Record<string, string> = {
    "aucune": "débutant sans expérience",
    "moins_1_an": "débutant avec quelques bases", 
    "1_3_ans": "intermédiaire avec bonnes bases",
    "plus_3_ans": "expérimenté avec solide expertise"
  };

  const availMap: Record<string, string> = {
    "temps_plein": "disponibilité complète",
    "temps_partiel": "disponibilité partielle", 
    "weekends": "disponibilité week-ends",
    "flexible": "horaires flexibles"
  };

  const goalMap: Record<string, string> = {
    "complement_revenu": "objectif de complément de revenus",
    "revenu_principal": "objectif de revenus principaux",
    "independance_financiere": "objectif d'indépendance financière"
  };

  const expLevel = expMap[profile.experience || ""] || profile.experience;
  const availability = availMap[profile.availability || ""] || profile.availability;
  const goal = goalMap[profile.financialGoal || ""] || profile.financialGoal;

  return `📊 ANALYSE AUTOMATIQUE - ${currentDate}

1. ANALYSE DU PROFIL
Profil ${expLevel} avec ${availability} et ${goal}.
${profile.motivation ? `Motivation claire : "${profile.motivation}".` : 'Motivation à approfondir.'}

2. PLAN D'ACCOMPAGNEMENT RECOMMANDÉ
- Formation : Parcours adapté au niveau ${profile.experience?.includes('aucune') ? 'débutant' : 'intermédiaire'}
- Durée d'intégration : ${profile.experience?.includes('plus_3_ans') ? '2-3 semaines' : '4-6 semaines'}
- Objectifs : Progression par étapes avec suivi personnalisé

3. STRATÉGIE DE DÉMARRAGE
- Première action : Entretien d'évaluation approfondi
- Support : Mentorat adapté au profil
- Outils : Formation digitale + accompagnement terrain

---
Analyse générée automatiquement - À personnaliser selon les besoins spécifiques.`;
}

export async function enhanceAnalysis(currentAnalysis: string, newObservations: string): Promise<string> {
  try {
    const prompt = `En tant qu'expert en coaching commercial, améliorez cette analyse existante avec les nouvelles observations :

ANALYSE ACTUELLE :
${currentAnalysis}

NOUVELLES OBSERVATIONS :
${newObservations}

MISSION : Intégrez harmonieusement les nouvelles observations dans l'analyse existante. Gardez la structure mais enrichissez le contenu. Maintenez un ton professionnel et actionnable.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
    });

    const enhancedAnalysis = response.text || currentAnalysis;
    
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric', 
      hour: '2-digit',
      minute: '2-digit'
    });

    return `🤖 ANALYSE IA MISE À JOUR - ${currentDate}\n\n${enhancedAnalysis}`;

  } catch (error) {
    console.error("Erreur lors de l'amélioration de l'analyse:", error);
    return currentAnalysis;
  }
}