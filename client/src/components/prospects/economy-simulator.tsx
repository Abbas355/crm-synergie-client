import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, TrendingDown, TrendingUp, Euro, Wifi, Phone, Tv, Plus, Minus, Zap } from "lucide-react";

interface EconomySimulatorProps {
  onEconomyCalculated: (economyData: EconomyResult) => void;
}

interface EconomyResult {
  currentCost: number;
  freeCost: number;
  monthlySavings: number;
  annualSavings: number;
  products: string[];
  details: string;
  mobileDetails?: { count: number; costs: number[] };
  tvDetails?: { services: string[]; costs: { [key: string]: number } };
}

const freeProducts = {
  freebox_pop: { name: "Freebox Pop", price: 29.99, internet: true, tv: true, phone: true },
  freebox_essential: { name: "Freebox Essentiel", price: 39.99, internet: true, tv: true, phone: true },
  freebox_ultra: { name: "Freebox Ultra", price: 49.99, internet: true, tv: true, phone: true },
  forfait_5g_2go: { name: "Forfait 5G 2Go", price: 2, internet: false, tv: false, phone: true },
  forfait_5g_50go: { name: "Forfait 5G 50Go", price: 8.99, internet: false, tv: false, phone: true },
  forfait_5g_150go: { name: "Forfait 5G 150Go", price: 15.99, internet: false, tv: false, phone: true },
  forfait_5g_300go: { name: "Forfait 5G 300Go", price: 19.99, internet: false, tv: false, phone: true },
};

const tvServices = [
  { key: "netflix", name: "Netflix" },
  { key: "canal_plus", name: "Canal +" },
  { key: "amazon", name: "Amazon Prime Video" },
  { key: "disney", name: "Disney +" },
  { key: "canal_satellite", name: "Canal satellite" },
  { key: "universal", name: "Universal" },
];

const userProfiles = [
  { key: "internet_only", name: "Internet uniquement", freebox: "Freebox Pop", price: 29.99 },
  { key: "gaming", name: "Gaming", freebox: "Freebox Essentiel", price: 39.99 },
  { key: "streaming", name: "Streaming", freebox: "Freebox Ultra", price: 49.99 },
  { key: "gaming_streaming", name: "Gaming + Streaming", freebox: "Freebox Ultra", price: 49.99 },
];

// Liste des opérateurs avec leurs numéros de téléphone
const operateurs = [
  { key: "orange", name: "Orange", telephone: "0800 00 3179" },
  { key: "sfr", name: "SFR", telephone: "0800 97 3179" },
  { key: "bouygues", name: "Bouygues Telecom", telephone: "0800 943 943" },
  { key: "numericable", name: "Numericable", telephone: "0805 85 89 85" },
  { key: "virgin", name: "Virgin", telephone: "0800 71 3179" },
  { key: "darty", name: "Darty Telecom", telephone: "0801 010 102" },
  { key: "acn", name: "ACN Communications", telephone: "0800 71 3179" },
  { key: "afone", name: "Afone", telephone: "0805 16 3179" },
  { key: "akeo", name: "Akeo Telecom", telephone: "0800 71 3179" },
  { key: "budget", name: "Budget Telecom", telephone: "0800 71 3179" },
  { key: "ciel", name: "Ciel Telecom", telephone: "0800 71 3179" },
  { key: "coriolis", name: "Coriolis", telephone: "0800 71 3179" },
  { key: "france_telephony", name: "France Telephony", telephone: "0800 71 3179" },
  { key: "ip_directions", name: "IP Directions", telephone: "0805 28 3179" },
  { key: "keyyo", name: "Keyyo", telephone: "0805 031 790" },
  { key: "legos", name: "Legos", telephone: "0805 08 41 98" },
  { key: "ovh", name: "OVH", telephone: "0805 69 3179" },
  { key: "prixtel", name: "Prixtel", telephone: "0800 71 3179" },
  { key: "rss", name: "Réseau Santé Social", telephone: "0800 71 3179" },
  { key: "sosh", name: "Sosh", telephone: "0800 00 3179" },
  { key: "uktelecom", name: "UKtelecom", telephone: "0800 71 3179" },
];

export function EconomySimulator({ onEconomyCalculated }: EconomySimulatorProps) {
  const [operateurActuel, setOperateurActuel] = useState<string>("");
  const [currentInternet, setCurrentInternet] = useState<number>(0);
  const [nombreMobiles, setNombreMobiles] = useState<number>(1);
  const [mobileCosts, setMobileCosts] = useState<number[]>([0]);
  const [selectedTvServices, setSelectedTvServices] = useState<string[]>([]);
  const [tvServiceCosts, setTvServiceCosts] = useState<{ [key: string]: number }>({});

  const [economyResult, setEconomyResult] = useState<EconomyResult | null>(null);
  const [showSimulation, setShowSimulation] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<string>("");

  const calculateEconomy = () => {
    const totalMobileCost = mobileCosts.reduce((sum, cost) => sum + cost, 0);
    const totalTvCost = Object.values(tvServiceCosts).reduce((sum, cost) => sum + cost, 0);
    const currentTotal = currentInternet + totalMobileCost + totalTvCost;

    const result: EconomyResult = {
      currentCost: currentTotal,
      freeCost: 0,
      monthlySavings: 0,
      annualSavings: 0,
      products: [],
      details: `Coût mensuel actuel : ${currentTotal.toFixed(2)}€`,
      mobileDetails: { count: nombreMobiles, costs: mobileCosts },
      tvDetails: { services: selectedTvServices, costs: tvServiceCosts },
    };

    setEconomyResult(result);
    // ❌ SUPPRIMÉ: onEconomyCalculated(result); - Ne plus appeler automatiquement
  };

  // Mettre à jour les données économiques quand le profil change
  useEffect(() => {
    if (showSimulation && userProfile && isSimulationReady()) {
      const economyData = calculateEconomyWithProfile();
      onEconomyCalculated(economyData);
    }
  }, [userProfile, showSimulation]);

  // ❌ SUPPRIMÉ: useEffect qui appelait automatiquement calculateEconomy et fermait le formulaire
  // useEffect(() => {
  //   if (currentInternet > 0 || mobileCosts.some(cost => cost > 0) || Object.values(tvServiceCosts).some(cost => cost > 0)) {
  //     calculateEconomy();
  //   }
  // }, [currentInternet, mobileCosts, tvServiceCosts]);

  // Gestion du nombre de mobiles
  const handleNombreMobilesChange = (newCount: number) => {
    if (newCount < 1) newCount = 1;
    if (newCount > 10) newCount = 10; // Limite raisonnable
    
    setNombreMobiles(newCount);
    
    // Ajuster le tableau des coûts mobiles
    const newMobileCosts = [...mobileCosts];
    if (newCount > mobileCosts.length) {
      // Ajouter des éléments
      while (newMobileCosts.length < newCount) {
        newMobileCosts.push(0);
      }
    } else if (newCount < mobileCosts.length) {
      // Supprimer des éléments
      newMobileCosts.splice(newCount);
    }
    setMobileCosts(newMobileCosts);
  };

  const updateMobileCost = (index: number, cost: number) => {
    const newCosts = [...mobileCosts];
    newCosts[index] = cost;
    setMobileCosts(newCosts);
  };

  // Gestion des services TV
  const toggleTvService = (serviceKey: string) => {
    if (selectedTvServices.includes(serviceKey)) {
      // Supprimer le service
      setSelectedTvServices(selectedTvServices.filter(s => s !== serviceKey));
      const newCosts = { ...tvServiceCosts };
      delete newCosts[serviceKey];
      setTvServiceCosts(newCosts);
    } else {
      // Ajouter le service
      setSelectedTvServices([...selectedTvServices, serviceKey]);
      setTvServiceCosts({ ...tvServiceCosts, [serviceKey]: 0 });
    }
  };

  const updateTvServiceCost = (serviceKey: string, cost: number) => {
    setTvServiceCosts({ ...tvServiceCosts, [serviceKey]: cost });
  };

  // Calculer le coût Free selon le profil utilisateur
  const calculateFreeCost = () => {
    if (!userProfile) return 0;
    
    const profile = userProfiles.find(p => p.key === userProfile);
    if (!profile) return 0;
    
    let totalFreeCost = profile.price; // Prix de la box
    
    // Calcul des mobiles : 10€ pour les 4 premiers, 15.99€ au-delà
    if (nombreMobiles > 0) {
      const mobilesUpTo4 = Math.min(nombreMobiles, 4);
      const mobilesAbove4 = Math.max(nombreMobiles - 4, 0);
      
      totalFreeCost += (mobilesUpTo4 * 10) + (mobilesAbove4 * 15.99);
    }
    
    return totalFreeCost;
  };

  // Calculer les économies avec le profil utilisateur
  const calculateEconomyWithProfile = () => {
    const totalMobileCost = mobileCosts.reduce((sum, cost) => sum + cost, 0);
    const totalTvCost = Object.values(tvServiceCosts).reduce((sum, cost) => sum + cost, 0);
    const currentTotal = currentInternet + totalMobileCost + totalTvCost;
    
    const freeCost = calculateFreeCost();
    const monthlySavings = currentTotal - freeCost;
    const annualSavings = monthlySavings * 12;

    const profile = userProfiles.find(p => p.key === userProfile);
    
    return {
      currentCost: currentTotal,
      freeCost,
      monthlySavings,
      annualSavings,
      products: profile ? [profile.freebox] : [],
      details: `Économie potentielle de ${monthlySavings.toFixed(2)}€/mois avec ${profile?.freebox || 'profil sélectionné'}`,
      profileDetails: {
        profile: profile?.name || '',
        freebox: profile?.freebox || '',
        boxPrice: profile?.price || 0,
        mobileCount: nombreMobiles,
        mobileCost: freeCost - (profile?.price || 0)
      }
    };
  };

  // Vérifier si toutes les informations nécessaires sont renseignées
  const isSimulationReady = () => {
    const hasInternet = currentInternet > 0;
    const hasMobile = mobileCosts.some(cost => cost > 0);
    const hasTv = selectedTvServices.length > 0 && selectedTvServices.every(service => tvServiceCosts[service] > 0);
    
    return hasInternet || hasMobile || hasTv; // Au moins une information renseignée
  };

  // Vérifier si le calcul d'économie est prêt
  const isEconomyCalculationReady = () => {
    return isSimulationReady() && userProfile !== "";
  };

  const handleShowSimulation = () => {
    if (isSimulationReady()) {
      calculateEconomy();
      setShowSimulation(true);
    }
  };

  // Fonction de sauvegarde dans les notes du prospect
  const saveToProspectNotes = (economyData: any) => {
    console.log("🚀 saveToProspectNotes appelée avec:", economyData);
    console.log("🔧 onEconomyCalculated disponible:", typeof onEconomyCalculated);
    
    const profileData = userProfiles.find(p => p.key === userProfile);
    
    // Création du résumé de simulation formaté pour mobile
    const simulationSummary = `🎯 SIMULATION ÉCONOMIQUE FREE
📅 ${new Date().toLocaleDateString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SITUATION ACTUELLE:
━━━━━━━━━━━━━━━━━━━━━━━━━

• Opérateur actuel:
  ${operateurActuel ? operateurs.find(op => op.key === operateurActuel)?.name : 'Non renseigné'}

• Internet actuel:
  ${currentInternet.toFixed(2)}€/mois

• Mobiles (${nombreMobiles}):
  ${mobileCosts.reduce((sum, cost) => sum + cost, 0).toFixed(2)}€/mois
${selectedTvServices.map(service => {
  const serviceName = tvServices.find(s => s.key === service)?.name;
  return `\n• ${serviceName}:\n  ${tvServiceCosts[service]?.toFixed(2) || '0.00'}€/mois`;
}).join('')}

• TOTAL ACTUEL:
  ${economyData.currentCost.toFixed(2)}€/mois
  (${(economyData.currentCost * 12).toFixed(2)}€/an) 💸

━━━━━━━━━━━━━━━━━━━━━━━━━
💡 PROPOSITION FREE:
━━━━━━━━━━━━━━━━━━━━━━━━━

• Profil client:
  ${profileData?.name}

• ${profileData?.freebox}:
  ${profileData?.price}€/mois
${nombreMobiles > 0 ? `\n• Mobiles (${nombreMobiles}):\n  ${(economyData.freeCost - (profileData?.price || 0)).toFixed(2)}€/mois` : ''}

• TOTAL FREE:
  ${economyData.freeCost.toFixed(2)}€/mois 🟢

━━━━━━━━━━━━━━━━━━━━━━━━━
💰 ÉCONOMIES RÉALISÉES:
━━━━━━━━━━━━━━━━━━━━━━━━━

• Mensuelle:
  ${economyData.monthlySavings > 0 ? '+' : ''}${economyData.monthlySavings.toFixed(2)}€

• Annuelle:
  ${economyData.annualSavings > 0 ? '+' : ''}${economyData.annualSavings.toFixed(0)}€ ${economyData.monthlySavings > 0 ? '🎯' : '⚠️'}

${economyData.monthlySavings > 0 ? 
`━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ARGUMENT COMMERCIAL:
━━━━━━━━━━━━━━━━━━━━━━━━━

"Économisez ${economyData.monthlySavings.toFixed(2)}€/mois avec Free, soit ${economyData.annualSavings.toFixed(0)}€ d'économies sur l'année !"` 
: `━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ATTENTION:
━━━━━━━━━━━━━━━━━━━━━━━━━

Free serait plus cher de ${Math.abs(economyData.monthlySavings).toFixed(2)}€/mois`}

━━━━━━━━━━━━━━━━━━━━━━━━━
Simulation générée automatiquement
À conserver pour suivi prospect
━━━━━━━━━━━━━━━━━━━━━━━━━`.trim();

    const finalData = {
      ...economyData,
      simulationSummary,
      simulationDate: new Date().toISOString(),
      profileSelected: profileData
    };

    console.log("💾 Données finales à sauvegarder:", finalData);

    // Appel à la fonction onEconomyCalculated avec les données complètes
    if (onEconomyCalculated && typeof onEconomyCalculated === 'function') {
      console.log("✅ Appel onEconomyCalculated");
      onEconomyCalculated(finalData);
    } else {
      console.error("❌ onEconomyCalculated n'est pas disponible ou n'est pas une fonction");
    }
  };



  return (
    <div className="space-y-4">
      <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-800 text-lg sm:text-xl">
            <div className="bg-blue-100 p-2 rounded-full">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            Simulateur d'économie Free
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Situation actuelle */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Situation actuelle du prospect
            </h4>
            
            {/* Opérateur actuel - Nouveau */}
            <div className="bg-white/70 p-3 sm:p-4 rounded-lg border border-blue-100 shadow-sm">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                Opérateur actuel
              </Label>
              <Select value={operateurActuel} onValueChange={setOperateurActuel}>
                <SelectTrigger className="bg-white border-gray-200 text-sm sm:text-base h-10 sm:h-11 focus:border-blue-400 focus:ring-blue-400/20">
                  <SelectValue placeholder="Sélectionnez l'opérateur actuel..." />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm max-h-60 overflow-y-auto">
                  {operateurs.map((operateur) => (
                    <SelectItem key={operateur.key} value={operateur.key} className="hover:bg-blue-50">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{operateur.name}</span>
                        <span className="text-xs text-gray-500">{operateur.telephone}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {operateurActuel && (
                <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                  📞 Service client : {operateurs.find(op => op.key === operateurActuel)?.telephone}
                </p>
              )}
            </div>

            {/* Internet actuel - Mobile Optimisé */}
            <div className="bg-white/70 p-3 sm:p-4 rounded-lg border border-blue-100 shadow-sm">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                Internet actuel (€/mois)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={currentInternet || ""}
                onChange={(e) => setCurrentInternet(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 29.99"
                className="bg-white border-gray-200 text-sm sm:text-base h-10 sm:h-11 focus:border-blue-400 focus:ring-blue-400/20"
              />
            </div>

            {/* Mobiles - Mobile Optimisé */}
            <div className="bg-white/70 p-3 sm:p-4 rounded-lg border border-blue-100 shadow-sm space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                Mobiles actuels
              </Label>
              
              {/* Nombre de mobiles - Compact */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <span className="text-sm font-medium text-gray-700">Nombre de mobiles:</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleNombreMobilesChange(nombreMobiles - 1)}
                    disabled={nombreMobiles <= 1}
                    className="h-7 w-7 p-0 border-blue-200 hover:bg-blue-100"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-bold text-blue-700 bg-white px-2 py-1 rounded border">{nombreMobiles}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleNombreMobilesChange(nombreMobiles + 1)}
                    disabled={nombreMobiles >= 10}
                    className="h-7 w-7 p-0 border-blue-200 hover:bg-blue-100"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Champs dynamiques pour chaque mobile - Grid Responsive */}
              <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
                {mobileCosts.map((cost, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <Label className="text-xs sm:text-sm font-medium text-gray-600 mb-1.5 block">
                      Mobile {index + 1} actuel (€/mois)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cost || ""}
                      onChange={(e) => updateMobileCost(index, parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 15.99"
                      className="bg-white border-gray-200 text-sm h-9 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Offres TV actuelles - Mobile Optimisé */}
            <div className="bg-white/70 p-3 sm:p-4 rounded-lg border border-blue-100 shadow-sm space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <Tv className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                Offre TV actuelle
              </Label>
              
              {/* Sélection des services TV - Grid Compact */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tvServices.map((service) => (
                  <div key={service.key} className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                    <Checkbox
                      id={service.key}
                      checked={selectedTvServices.includes(service.key)}
                      onCheckedChange={() => toggleTvService(service.key)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor={service.key} className="text-xs sm:text-sm cursor-pointer font-medium text-gray-700">
                      {service.name}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Champs de prix pour les services sélectionnés */}
              {selectedTvServices.length > 0 && (
                <div className="space-y-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                  <p className="text-xs text-gray-600 text-center">Renseignez le coût de chaque service sélectionné</p>
                  <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
                    {selectedTvServices.map((serviceKey) => {
                      const service = tvServices.find(s => s.key === serviceKey);
                      return (
                        <div key={serviceKey} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                          <Label className="text-xs sm:text-sm font-medium text-gray-600 mb-1.5 block">
                            {service?.name} (€/mois)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={tvServiceCosts[serviceKey] || ""}
                            onChange={(e) => updateTvServiceCost(serviceKey, parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 9.99"
                            className="bg-white border-gray-200 text-sm h-9 focus:border-blue-400 focus:ring-blue-400/20"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bouton Simulation - Mobile Optimisé */}
          <div className="flex justify-center pt-4 pb-2">
            <Button
              type="button"
              onClick={handleShowSimulation}
              disabled={!isSimulationReady()}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-sm sm:text-base">Lancer la simulation</span>
              </div>
            </Button>
          </div>

          {/* Profil utilisateur - affiché après simulation - Mobile Optimisé */}
          {showSimulation && (
            <div className="mt-4 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50 shadow-lg backdrop-blur-sm">
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🎯</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-1 sm:mb-2">Proposition personnalisée</h3>
                <p className="text-sm sm:text-base text-green-600">Sélectionnez le profil qui correspond le mieux au prospect</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <Label className="text-sm sm:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Profil utilisateur
                </Label>
                <Select value={userProfile} onValueChange={setUserProfile}>
                  <SelectTrigger className="bg-white/90 border-green-300 h-11 sm:h-12 text-sm sm:text-base shadow-sm hover:shadow-md transition-shadow">
                    <SelectValue placeholder="Choisissez le profil du prospect..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm">
                    {userProfiles.map((profile) => (
                      <SelectItem key={profile.key} value={profile.key} className="hover:bg-green-50">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm sm:text-base">{profile.name}</span>
                          <span className="text-xs sm:text-sm text-gray-600 ml-2 sm:ml-4 bg-green-100 px-2 py-1 rounded">
                            {profile.freebox} - {profile.price}€
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Calcul des économies avec profil */}
              {userProfile && (
                <div className="mt-6 space-y-6">
                  {(() => {
                    const economyData = calculateEconomyWithProfile();
                    return (
                      <>
                        {/* 1. Analyse des coûts actuels - Version Mobile Optimisée */}
                        <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-lg backdrop-blur-sm">
                          <div className="text-center mb-4">
                            <div className="flex items-center gap-2 justify-center mb-1">
                              <span className="text-2xl">📊</span>
                              <h3 className="text-lg font-bold text-blue-800">Analyse des coûts actuels</h3>
                            </div>
                            <p className="text-sm text-blue-600">Situation financière du prospect</p>
                          </div>

                          {/* Scroll horizontal avec cartes compactes */}
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
                            {/* Coût mensuel actuel - Version étroite */}
                            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow border-l-4 border-blue-500 min-w-[160px] flex-shrink-0">
                              <div className="text-center mb-2">
                                <div className="bg-blue-100 p-1.5 rounded-full mx-auto w-8 h-8 flex items-center justify-center mb-1">
                                  <Euro className="h-3 w-3 text-blue-600" />
                                </div>
                                <h4 className="text-xs font-semibold text-gray-700 leading-tight">Coût mensuel<br/>actuel</h4>
                              </div>
                              <div className="text-xl font-bold text-blue-600 mb-1 text-center">
                                {economyData.currentCost.toFixed(2)}€
                              </div>
                              <p className="text-xs text-gray-500 mb-2 text-center">Dépenses mensuelles</p>
                              
                              {/* Détail des coûts compact */}
                              <div className="space-y-0.5 text-xs">
                                {currentInternet > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Internet:</span>
                                    <span className="font-semibold text-blue-700">{currentInternet.toFixed(2)}€</span>
                                  </div>
                                )}
                                {mobileCosts.some(cost => cost > 0) && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Mobiles ({nombreMobiles}):</span>
                                    <span className="font-semibold text-blue-700">{mobileCosts.reduce((sum, cost) => sum + cost, 0).toFixed(2)}€</span>
                                  </div>
                                )}
                                {selectedTvServices.length > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Services TV:</span>
                                    <span className="font-semibold text-blue-700">{Object.values(tvServiceCosts).reduce((sum, cost) => sum + cost, 0).toFixed(2)}€</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Coût annuel actuel - Version étroite */}
                            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow border-l-4 border-indigo-500 min-w-[160px] flex-shrink-0">
                              <div className="text-center mb-2">
                                <div className="bg-indigo-100 p-1.5 rounded-full mx-auto w-8 h-8 flex items-center justify-center mb-1">
                                  <TrendingUp className="h-3 w-3 text-indigo-600" />
                                </div>
                                <h4 className="text-xs font-semibold text-gray-700 leading-tight">Coût annuel<br/>actuel</h4>
                              </div>
                              <div className="text-xl font-bold text-indigo-600 mb-1 text-center">
                                {(economyData.currentCost * 12).toFixed(2)}€
                              </div>
                              <p className="text-xs text-gray-500 mb-2 text-center">Dépenses sur 12 mois</p>
                              
                              <div className="p-2 bg-gradient-to-r from-gray-50 to-indigo-50 rounded border border-gray-100">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <span className="text-xs">💡</span>
                                  </div>
                                  <p className="text-xs font-medium text-gray-700">Argument commercial</p>
                                </div>
                                <p className="text-xs text-gray-600 leading-tight">
                                  Le prospect dépense actuellement{" "}
                                  <span className="font-bold text-indigo-600 bg-indigo-100 px-1 py-0.5 rounded text-xs">
                                    {(economyData.currentCost * 12).toFixed(0)}€ par an
                                  </span>{" "}
                                  pour ses services télécoms.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section Proposition Free + Économies - Scroll horizontal */}
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-100">
                          {/* 2. Proposition Free - Version étroite */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg shadow border border-green-200/50 min-w-[160px] flex-shrink-0">
                            <div className="text-center mb-2">
                              <div className="bg-green-100 p-1.5 rounded-full mx-auto w-8 h-8 flex items-center justify-center mb-1">
                                <Euro className="h-3 w-3 text-green-600" />
                              </div>
                              <h4 className="text-xs font-bold text-green-800 leading-tight">Proposition<br/>Free</h4>
                            </div>

                            <div className="text-center mb-2">
                              <div className="text-xl font-bold text-green-600">
                                {economyData.freeCost.toFixed(2)}€
                              </div>
                              <p className="text-xs text-gray-600">Coût mensuel</p>
                            </div>
                            
                            {/* Détail compact */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-gray-700">{economyData.profileDetails?.freebox}</span>
                              </div>
                              <div className="text-right text-xs font-bold text-green-700">
                                {economyData.profileDetails?.boxPrice.toFixed(2)}€
                              </div>
                              
                              {nombreMobiles > 0 && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span className="text-xs text-gray-700">Mobiles ({nombreMobiles})</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {nombreMobiles <= 4 ? 'à 10€ chacun' : `${Math.min(nombreMobiles, 4)} à 10€ + ${nombreMobiles - 4} à 15.99€`}
                                  </div>
                                  <div className="text-right text-xs font-bold text-blue-700">
                                    {economyData.profileDetails?.mobileCost.toFixed(2)}€
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* 3. Économies réalisées - Version étroite */}
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-3 rounded-lg shadow border border-emerald-200/50 min-w-[160px] flex-shrink-0">
                            <div className="text-center mb-2">
                              <div className="bg-emerald-100 p-1.5 rounded-full mx-auto w-8 h-8 flex items-center justify-center mb-1">
                                <TrendingDown className="h-3 w-3 text-emerald-600" />
                              </div>
                              <h4 className="text-xs font-bold text-emerald-800 leading-tight">Économies<br/>réalisées</h4>
                            </div>

                            <div className="text-center">
                              <div className={`text-xl font-bold ${
                                economyData.monthlySavings > 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {economyData.monthlySavings > 0 ? '+' : ''}{economyData.monthlySavings.toFixed(2)}€
                              </div>
                              <p className="text-xs text-gray-600 mb-2">par mois</p>
                              
                              <div className="text-xs text-emerald-700 mb-1">Économie annuelle</div>
                              <div className={`text-sm font-bold ${
                                economyData.annualSavings > 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {economyData.annualSavings > 0 ? '+' : ''}{economyData.annualSavings.toFixed(0)}€
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Argument de vente après économies - Mobile optimisé */}
                        {economyData.monthlySavings > 0 && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl border border-emerald-200 shadow-inner">
                            <div className="text-center">
                              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-white text-lg">🎉</span>
                              </div>
                              <p className="text-sm font-bold text-emerald-800 mb-2">
                                Argument de vente puissant
                              </p>
                              <div className="bg-white/50 p-3 rounded-lg border border-emerald-200">
                                <p className="text-sm text-emerald-700 leading-relaxed">
                                  "Économisez <span className="font-bold bg-emerald-200 px-2 py-1 rounded text-emerald-800">{economyData.monthlySavings.toFixed(2)}€/mois</span> avec Free !<br/>
                                  Soit <span className="font-bold bg-emerald-200 px-2 py-1 rounded text-emerald-800">{economyData.annualSavings.toFixed(0)}€</span> d'économies sur l'année."
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bouton de sauvegarde et validation */}
                        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-0 sm:flex sm:justify-center sm:gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowSimulation(false);
                              setUserProfile("");
                            }}
                            className="w-full sm:w-auto border-blue-300 text-blue-600 hover:bg-blue-50 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 hover:shadow-md"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Modifier les informations
                            </div>
                          </Button>

                          <Button
                            type="button"
                            onClick={() => {
                              console.log("🔥 Bouton sauvegarde cliqué", economyData);
                              saveToProspectNotes(economyData);
                            }}
                            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <div className="bg-white/20 p-1 rounded-full">
                                <span className="text-xs">💾</span>
                              </div>
                              Sauvegarder dans les notes
                            </div>
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}





          {/* Résultat de l'économie */}
          {!showSimulation && economyResult && economyResult.monthlySavings !== 0 && (
            <div className={`p-4 rounded-lg border-2 ${
              economyResult.monthlySavings > 0 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className={`h-5 w-5 ${
                  economyResult.monthlySavings > 0 ? 'text-green-600' : 'text-red-600'
                }`} />
                <h4 className={`font-bold ${
                  economyResult.monthlySavings > 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {economyResult.monthlySavings > 0 ? 'Économies potentielles' : 'Coût supplémentaire'}
                </h4>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Coût actuel</p>
                  <p className="font-bold text-lg">{economyResult.currentCost.toFixed(2)}€</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Coût Free</p>
                  <p className="font-bold text-lg text-blue-600">{economyResult.freeCost.toFixed(2)}€</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Économie/mois</p>
                  <p className={`font-bold text-lg ${
                    economyResult.monthlySavings > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {economyResult.monthlySavings > 0 ? '+' : ''}{economyResult.monthlySavings.toFixed(2)}€
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Économie/an</p>
                  <p className={`font-bold text-lg ${
                    economyResult.annualSavings > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {economyResult.annualSavings > 0 ? '+' : ''}{economyResult.annualSavings.toFixed(2)}€
                  </p>
                </div>
              </div>

              {economyResult.monthlySavings > 0 && (
                <div className="mt-3 p-3 bg-green-100 rounded text-center">
                  <p className="text-green-800 font-medium">
                    🎯 Argument de vente : Économisez {economyResult.monthlySavings.toFixed(2)}€ par mois, 
                    soit {economyResult.annualSavings.toFixed(2)}€ sur l'année !
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}