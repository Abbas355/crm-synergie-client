import { useState } from "react";
import { Calculator, AlertTriangle, CheckCircle, InfoIcon, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Liste des opérateurs mobiles français
const OPERATEURS = [
  { value: "orange", label: "Orange" },
  { value: "sfr", label: "SFR" },
  { value: "bouygues", label: "Bouygues Telecom" },
  { value: "free", label: "Free Mobile" },
  { value: "sosh", label: "Sosh (Orange)" },
  { value: "red", label: "RED by SFR" },
  { value: "b-and-you", label: "B&YOU (Bouygues)" },
  { value: "la-poste-mobile", label: "La Poste Mobile" },
  { value: "nrj-mobile", label: "NRJ Mobile" },
  { value: "auchan-telecom", label: "Auchan Telecom" },
  { value: "prixtel", label: "Prixtel" },
  { value: "lebara", label: "Lebara" },
  { value: "lycamobile", label: "Lycamobile" },
  { value: "autre", label: "Autre opérateur" }
];

interface SimulateurResiliationProps {
  onClose?: () => void;
}

export function SimulateurResiliation({ onClose }: SimulateurResiliationProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [operateur, setOperateur] = useState("");
  const [typeContrat, setTypeContrat] = useState("");
  const [dateFinEngagement, setDateFinEngagement] = useState("");
  const [mensualite, setMensualite] = useState("");
  const [resultat, setResultat] = useState<{
    frais: number;
    explication: string;
    cas: string;
    details: string;
    moisRestants: number;
    coutTotal: number;
    economieRealisee: number;
  } | null>(null);

  // RÈGLES OFFICIELLES RÉGLEMENTATION FRANÇAISE DE RÉSILIATION :
  // 📱 Forfaits sans engagement : Résiliation possible à tout moment sans frais (0€)
  // 📅 Engagement 12 mois (avant 1 an) : Totalité des mensualités restantes
  // 📊 Engagement 24 mois (après 1 an) : 25% des mensualités restantes jusqu'au 24ème mois
  // ⚖️ Engagement 24 mois (avant 1 an) : Mensualités restantes 1ère année + 25% de la 2ème année
  const calculerFraisResiliation = () => {
    if (!typeContrat || !dateFinEngagement || !mensualite) {
      return;
    }

    const montantMensuel = parseFloat(mensualite);
    const dateFinEngagementObj = new Date(dateFinEngagement);
    const maintenant = new Date();
    
    // Calculer les mois restants
    const diffTime = dateFinEngagementObj.getTime() - maintenant.getTime();
    const moisRestants = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    let frais = 0;
    let explication = "";
    let cas = "";
    let details = "";

    if (typeContrat === "sans-engagement") {
      // Cas 1: Forfait sans engagement
      frais = 0;
      cas = "Forfait sans engagement";
      explication = "Résiliation possible à tout moment sans frais.";
      details = "Aucun frais de résiliation ne s'applique pour les forfaits sans engagement.";
    } else if (typeContrat === "12-mois") {
      // Cas 2: Engagement de 12 mois
      if (moisRestants > 0) {
        frais = moisRestants * montantMensuel;
        cas = "Engagement 12 mois - Avant 1 an";
        explication = `Résiliation anticipée avant la fin d'engagement : ${moisRestants} mensualités restantes.`;
        details = `${moisRestants} mois × ${montantMensuel}€ = ${frais.toFixed(2)}€`;
      } else {
        frais = 0;
        cas = "Engagement 12 mois - Après 1 an";
        explication = "Engagement terminé, résiliation sans frais.";
        details = "Votre engagement est arrivé à terme.";
      }
    } else if (typeContrat === "24-mois") {
      // Calculer depuis quand le contrat existe (en partant du principe qu'il a commencé 24 mois avant la date de fin)
      const dateDebutContrat = new Date(dateFinEngagementObj);
      dateDebutContrat.setFullYear(dateDebutContrat.getFullYear() - 2);
      
      const diffDepuisDebut = maintenant.getTime() - dateDebutContrat.getTime();
      const moisDepuisDebut = Math.floor(diffDepuisDebut / (1000 * 60 * 60 * 24 * 30));

      if (moisDepuisDebut >= 12) {
        // Cas 3: Engagement de 24 mois - Après 1 an
        if (moisRestants > 0) {
          // CORRECTION CRITIQUE : 25% des mensualités restantes jusqu'au 24ème mois (PAS de mois au tarif plein)
          frais = Math.ceil(moisRestants * montantMensuel * 0.25);
          cas = "Engagement 24 mois - Après 1 an";
          explication = "25% des mensualités restantes jusqu'au 24ème mois.";
          details = `Tarif réduit: ${moisRestants} mois × ${montantMensuel}€ × 25% = ${frais.toFixed(2)}€\nTotal: ${frais.toFixed(2)}€`;
        } else {
          frais = 0;
          cas = "Engagement 24 mois - Terminé";
          explication = "Engagement terminé, résiliation sans frais.";
          details = "Votre engagement est arrivé à terme.";
        }
      } else {
        // Cas 4: Engagement de 24 mois - Avant 1 an
        // CORRECTION CRITIQUE : Si on est dans la première année MAIS qu'il ne reste plus de mois 
        // complets dans cette première année, alors TOUS les mois restants sont à 25%
        const moisRestantsPremierAnnee = Math.max(0, 12 - moisDepuisDebut);
        
        if (moisRestantsPremierAnnee === 0) {
          // Cas spécial : Plus de mois complets en 1ère année, tous les mois restants à 25%
          frais = Math.ceil(moisRestants * montantMensuel * 0.25);
          cas = "Engagement 24 mois - Après 1 an";
          explication = "25% des mensualités restantes jusqu'au 24ème mois.";
          details = `Tarif réduit: ${moisRestants} mois × ${montantMensuel}€ × 25% = ${frais.toFixed(2)}€\nTotal: ${frais.toFixed(2)}€`;
        } else {
          // Cas normal : Il reste encore des mois en 1ère année
          const moisDeuxiemeAnnee = Math.max(0, moisRestants - moisRestantsPremierAnnee);
          
          const fraisPremierAnnee = moisRestantsPremierAnnee * montantMensuel;
          const fraisDeuxiemeAnnee = Math.ceil(moisDeuxiemeAnnee * montantMensuel * 0.25);
          
          frais = fraisPremierAnnee + fraisDeuxiemeAnnee;
          cas = "Engagement 24 mois - Avant 1 an";
          explication = "Mensualités restantes 1ère année + 25% des mensualités 2ème année.";
          details = `1ère année: ${moisRestantsPremierAnnee} × ${montantMensuel}€ = ${fraisPremierAnnee.toFixed(2)}€\n2ème année: ${moisDeuxiemeAnnee} × ${montantMensuel}€ × 25% = ${fraisDeuxiemeAnnee.toFixed(2)}€\nTotal: ${frais.toFixed(2)}€`;
        }
      }
    }

    // Calculs économiques
    const coutTotal = moisRestants * montantMensuel;
    const economieRealisee = coutTotal - frais;

    setResultat({
      frais,
      explication,
      cas,
      details,
      moisRestants,
      coutTotal,
      economieRealisee
    });
  };

  const resetSimulateur = () => {
    setOperateur("");
    setTypeContrat("");
    setDateFinEngagement("");
    setMensualite("");
    setResultat(null);
  };

  const getFraisColor = (frais: number) => {
    if (frais === 0) return "text-green-600";
    if (frais < 50) return "text-yellow-600";
    if (frais < 150) return "text-orange-600";
    return "text-red-600";
  };

  const getFraisBadgeColor = (frais: number) => {
    if (frais === 0) return "bg-green-500";
    if (frais < 50) return "bg-yellow-500";
    if (frais < 150) return "bg-orange-500";
    return "bg-red-500";
  };

  const sauvegarderCommentaire = () => {
    console.log("🔥 BOUTON CLIQUÉ - sauvegarderCommentaire");
    console.log("📋 Données:", { resultat, operateur, typeContrat });
    
    if (!resultat || !operateur || !typeContrat) {
      console.log("❌ Simulation incomplète");
      toast({
        title: "Simulation incomplète",
        description: "Veuillez d'abord effectuer une simulation complète",
        variant: "destructive",
      });
      return;
    }

    // Générer le texte du commentaire formaté
    const dateSimulation = new Date().toLocaleDateString('fr-FR');
    const operateurLabel = OPERATEURS.find(op => op.value === operateur)?.label || operateur;
    
    const commentaire = `📊 SIMULATION RÉSILIATION
📅 ${dateSimulation}

━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CONTRAT ACTUEL:
━━━━━━━━━━━━━━━━━━━━━━━━━

• Opérateur actuel:
  ${operateurLabel}

• Type de contrat:
  ${typeContrat}

• Mensualité:
  ${mensualite}€

• Mois restants:
  ${resultat.moisRestants}

━━━━━━━━━━━━━━━━━━━━━━━━━
💰 ANALYSE ÉCONOMIQUE:
━━━━━━━━━━━━━━━━━━━━━━━━━

• Frais de résiliation:
  ${resultat.frais.toFixed(2)}€
  (${resultat.cas})

• Coût si maintien contrat:
  ${resultat.coutTotal.toFixed(2)}€

• ÉCONOMIE RÉALISÉE:
  +${resultat.economieRealisee.toFixed(2)}€ 🎯

━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DÉTAILS CALCUL:
━━━━━━━━━━━━━━━━━━━━━━━━━

${resultat.explication}

━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ARGUMENT COMMERCIAL:
━━━━━━━━━━━━━━━━━━━━━━━━━

Le client économise ${resultat.economieRealisee.toFixed(2)}€ en résiliant maintenant pour passer chez Free Mobile (sans engagement).

━━━━━━━━━━━━━━━━━━━━━━━━━
Simulation générée automatiquement
À conserver pour suivi prospect
━━━━━━━━━━━━━━━━━━━━━━━━━`;

    console.log("📝 Commentaire généré:", commentaire.substring(0, 100) + "...");

    // Navigation directe vers la page prospect avec commentaire via paramètre URL
    toast({
      title: "Simulation sauvegardée ✅",
      description: "Redirection vers la page prospects avec le commentaire pré-rempli...",
    });
    
    // Navigation vers la page prospect avec le commentaire en paramètre
    const commentaireEncoded = encodeURIComponent(commentaire);
    const urlNavigation = `/prospects?comment=${commentaireEncoded}`;
    
    console.log("🚀 Navigation vers:", urlNavigation.substring(0, 100) + "...");
    console.log("🔧 setLocation function:", setLocation);
    
    setLocation(urlNavigation);
    console.log("✅ setLocation appelée");
  };

  return (
    <div className="space-y-3 sm:space-y-6 pb-20 px-1 sm:px-0">
      {/* En-tête optimisé mobile */}
      <div className="text-center px-2">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 sm:p-3 rounded-xl shadow-lg">
            <Calculator className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
          </div>
          <h2 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent text-center">
            Simulateur de Frais de Résiliation
          </h2>
        </div>
        <p className="text-xs sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
          Calculez les frais de résiliation anticipée selon la réglementation française. 
          Outil indispensable pour négocier efficacement avec vos prospects.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Formulaire de saisie optimisé mobile */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-lg text-blue-800 font-semibold">Informations du contrat actuel</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-6">
            {/* Opérateur actuel */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="operateur" className="text-xs sm:text-sm font-medium text-gray-700">
                Opérateur actuel
              </Label>
              <Select value={operateur} onValueChange={setOperateur}>
                <SelectTrigger className="bg-white border-gray-200 focus:border-blue-300 h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Sélectionnez l'opérateur actuel" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATEURS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type de contrat */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="typeContrat" className="text-xs sm:text-sm font-medium text-gray-700">
                Type de contrat
              </Label>
              <Select value={typeContrat} onValueChange={setTypeContrat}>
                <SelectTrigger className="bg-white border-gray-200 focus:border-blue-300 h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Sélectionnez le type d'engagement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans-engagement">Forfait sans engagement</SelectItem>
                  <SelectItem value="12-mois">Contrat 12 mois</SelectItem>
                  <SelectItem value="24-mois">Contrat 24 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date de fin d'engagement */}
            {typeContrat && typeContrat !== "sans-engagement" && (
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="dateFinEngagement" className="text-xs sm:text-sm font-medium text-gray-700">
                  Date de fin d'engagement
                </Label>
                <Input
                  id="dateFinEngagement"
                  type="date"
                  value={dateFinEngagement}
                  onChange={(e) => setDateFinEngagement(e.target.value)}
                  className="bg-white border-gray-200 focus:border-blue-300 h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            )}

            {/* Mensualité actuelle */}
            {typeContrat && typeContrat !== "sans-engagement" && (
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="mensualite" className="text-xs sm:text-sm font-medium text-gray-700">
                  Mensualité actuelle (€)
                </Label>
                <Input
                  id="mensualite"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 29.99"
                  value={mensualite}
                  onChange={(e) => setMensualite(e.target.value)}
                  className="bg-white border-gray-200 focus:border-blue-300 h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            )}

            {/* Boutons d'action optimisés mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Button 
                onClick={calculerFraisResiliation} 
                disabled={!typeContrat || (!dateFinEngagement && typeContrat !== "sans-engagement") || (!mensualite && typeContrat !== "sans-engagement")}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Calculer les frais
              </Button>
              <Button 
                variant="outline" 
                onClick={resetSimulateur}
                className="border-gray-200 hover:bg-gray-50 h-9 sm:h-10 text-xs sm:text-sm"
              >
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Résultats optimisés mobile */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-lg text-green-800 font-semibold">Résultat de la simulation</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {!resultat ? (
              <div className="text-center py-6 sm:py-12 text-gray-500">
                <InfoIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-gray-300" />
                <p className="text-xs sm:text-base px-4">Remplissez le formulaire pour voir les frais de résiliation</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-6">
                {/* Montant principal optimisé mobile */}
                <div className="text-center p-3 sm:p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mb-2">
                    {resultat.frais === 0 ? (
                      <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-orange-500" />
                    )}
                    <Badge className={`${getFraisBadgeColor(resultat.frais)} text-white px-2 sm:px-3 py-1 text-xs sm:text-sm`}>
                      {resultat.cas}
                    </Badge>
                  </div>
                  <div className={`text-2xl sm:text-4xl font-bold ${getFraisColor(resultat.frais)} mb-1 sm:mb-2`}>
                    {resultat.frais.toFixed(2)}€
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Frais de résiliation estimés</p>
                </div>

                {/* Explication optimisée mobile */}
                <div className="space-y-2 sm:space-y-3">
                  <h4 className="font-semibold text-gray-800 text-xs sm:text-base">Explication :</h4>
                  <p className="text-gray-700 bg-blue-50 p-2 sm:p-4 rounded-lg border-l-4 border-blue-400 text-xs sm:text-base">
                    {resultat.explication}
                  </p>
                </div>

                {/* Détails du calcul optimisés mobile */}
                {resultat.details && (
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="font-semibold text-gray-800 text-xs sm:text-base">Détail du calcul :</h4>
                    <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 sm:p-4 rounded-lg font-mono whitespace-pre-line">
                      {resultat.details}
                    </div>
                  </div>
                )}

                {/* Analyse économique complète */}
                {resultat.moisRestants > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-3 sm:p-6 rounded-xl border border-emerald-200">
                    <h4 className="font-semibold text-emerald-800 mb-2 sm:mb-4 text-xs sm:text-lg flex items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-base">💰</span> Analyse économique
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
                      {/* Coût total du contrat */}
                      <div className="bg-white/60 p-2 sm:p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Coût total si contrat maintenu :</p>
                        <p className="text-sm sm:text-lg font-bold text-gray-800">
                          {resultat.coutTotal.toFixed(2)}€
                        </p>
                        <p className="text-xs text-gray-500">
                          {resultat.moisRestants} mois × {parseFloat(mensualite || "0").toFixed(2)}€
                        </p>
                      </div>
                      
                      {/* Économie réalisée */}
                      <div className="bg-white/60 p-2 sm:p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Économie réalisée :</p>
                        <p className="text-sm sm:text-lg font-bold text-green-600">
                          +{resultat.economieRealisee.toFixed(2)}€
                        </p>
                        <p className="text-xs text-gray-500">
                          Coût total - Frais résiliation
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-emerald-100 p-2 sm:p-3 rounded-lg">
                      <p className="text-xs sm:text-sm text-emerald-800 font-medium">
                        {resultat.frais === 0 ? (
                          <>✅ Résiliation gratuite ! Vous économisez {resultat.economieRealisee.toFixed(2)}€ en passant chez Free Mobile (sans engagement).</>
                        ) : (
                          <>✅ En résiliant maintenant, vous économisez {resultat.economieRealisee.toFixed(2)}€ par rapport au maintien de votre contrat jusqu'à échéance.</>
                        )}
                      </p>
                    </div>
                    
                    {/* Bouton de sauvegarde */}
                    <div className="pt-2 sm:pt-3 border-t border-emerald-200">
                      <Button 
                        onClick={() => sauvegarderCommentaire()}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Sauvegarder dans les commentaires
                      </Button>
                    </div>
                  </div>
                )}

                {/* Avantage Free optimisé mobile */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 sm:p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-1 sm:mb-2 text-xs sm:text-base">💡 Avec Free Mobile :</h4>
                  <ul className="text-xs sm:text-sm text-green-700 space-y-1">
                    <li>• Forfaits sans engagement disponibles</li>
                    <li>• Résiliation gratuite à tout moment</li>
                    <li>• Économie potentielle de {resultat.frais.toFixed(2)}€ en frais de résiliation</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Guide des règles légales ultra-compact */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="p-2 sm:p-3">
          <CardTitle className="text-amber-800 flex items-center gap-1 text-sm sm:text-base">
            <InfoIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            Règles légales de résiliation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-amber-700 p-2 sm:p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span>📱</span><span className="font-medium">Sans engagement :</span><span>0€</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📅</span><span className="font-medium">12 mois :</span><span>totalité restante</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📊</span><span className="font-medium">24 mois (après 1 an) :</span><span>25%</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚖️</span><span className="font-medium">24 mois (avant 1 an) :</span><span>1ère année + 25% 2ème</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}