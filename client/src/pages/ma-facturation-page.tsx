import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Calculator, 
  Euro, 
  Calendar, 
  FileText, 
  Download, 
  Eye,
  Star,
  TrendingUp,
  BarChart3,
  PieChart, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Award,
  Target,
  History,
  Printer
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { CompactCard } from "@/components/ui/compact-card";
import HistoriqueCommissions from "@/components/commission/HistoriqueCommissions";

export default function MaFacturationPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fonction pour obtenir le mois actuel en français
  const getCurrentMonthYear = () => {
    const now = new Date();
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Hook pour récupérer les factures mensuelles de l'utilisateur connecté
  const { data: user } = useQuery<{ id: number; nom?: string; prenom?: string }>({
    queryKey: ['/api/auth/user']
  });

  // Utilisation du nouvel endpoint permanent avec vraies données de la base
  const { data: factureTemp, isLoading: facturesLoading, refetch: refetchFactures } = useQuery<any>({
    queryKey: ['/api/factures/generate-permanent', user?.id, 6, 2025], // Juin 2025 pour avoir des données
    queryFn: async () => {
      const response = await fetch(`/api/factures/generate-permanent/${user?.id}/6/2025`);
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Récupération des statistiques de ventes (même endpoint que page Ventes)
  const { data: ventesStats } = useQuery<{
    ventes: number;
    installations: number;
    totalPoints: number;
    commission: number;
    palier: number;
    pointsRestants: number;
    ventesEnAttente: number;
    freeboxCount: number;
    forfait5gCount: number;
  }>({
    queryKey: ['/api/ventes/stats'],
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Récupération des données de répartition et taux de conversion
  const { data: repartitionStats, isLoading: repartitionLoading, error: repartitionError } = useQuery<{
    tauxConversion: number;
    signaturesTotal: number;
    signaturesAvecInstallation: number;
    freeboxCount: number;
    forfait5gCount: number;
    totalVentes: number;
    freeboxPourcentage: number;
    forfait5gPourcentage: number;
  }>({
    queryKey: ['/api/facturation/repartition-stats'],
    enabled: !!user?.id,
    staleTime: 0, // Forcer le rechargement
    gcTime: 0, // Pas de cache (version 5 de React Query)
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Log de débogage pour voir l'état de la requête
  console.log('🔍 DEBUG RÉPARTITION STATS:', {
    repartitionStats,
    repartitionLoading,
    repartitionError,
    userExists: !!user?.id,
    userId: user?.id
  });

  // Récupération de la prochaine échéance dynamique
  const { data: nextPaymentData } = useQuery<{
    nextPayment: {
      type: string;
      date: string;
      montant: number;
      daysUntil: number;
      status: string;
      description: string;
      mois: string;
    } | null;
  }>({
    queryKey: ['/api/commissions/next-payment'],
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute - plus fréquent pour les échéances
  });

  // Transformer les données temporaires en format de factures pour l'affichage
  const facturesData = factureTemp ? [factureTemp] : [];

  // Fonction pour générer une facture pour le mois précédent
  const genererFactureMoisPrecedent = async () => {
    console.log('🔄 Clic sur bouton génération facture');
    console.log('User ID:', user?.id);
    
    if (!user?.id) {
      console.error('❌ Aucun utilisateur connecté');
      alert('Erreur: Aucun utilisateur connecté');
      return;
    }

    try {
      const maintenant = new Date();
      const moisPrecedent = maintenant.getMonth() === 0 ? 12 : maintenant.getMonth();
      const anneePrecedente = maintenant.getMonth() === 0 ? maintenant.getFullYear() - 1 : maintenant.getFullYear();

      console.log(`📅 Génération facture pour ${moisPrecedent}/${anneePrecedente}`);

      // Utilisation du nouvel endpoint public temporaire qui fonctionne
      const result = await fetch(`/api/public/factures/generate-temp/${user.id}/${moisPrecedent}`)
        .then(res => res.json());

      console.log('✅ Facture générée avec succès:', result);
      alert('Facture générée avec succès !');

      // Actualiser la liste des factures
      refetchFactures();
    } catch (error) {
      console.error('❌ Erreur lors de la génération de facture:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Erreur lors de la génération: ${errorMessage}`);
    }
  };

  // Fonction pour marquer une facture comme téléchargée
  const marquerCommeTelecharge = async (factureId: number) => {
    console.log('📥 Marquage facture comme téléchargée:', factureId);
    try {
      await apiRequest('PATCH', `/api/factures/${factureId}/telecharger`);
      console.log('✅ Facture marquée comme téléchargée');
      refetchFactures();
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de facture:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Erreur lors de la mise à jour: ${errorMessage}`);
    }
  };

  // Définir le titre de la page
  useEffect(() => {
    document.title = "Ma Facturation - SMG";
    return () => {
      document.title = "SMG";
    };
  }, []);

  // Récupérer les données CVD
  const { data: cvdData, isLoading: isLoadingCVD } = useQuery({
    queryKey: ["/api/ventes/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ventes/stats");
      return await response.json();
    }
  });

  // Utiliser uniquement les données Analytics ventes comme source de vérité

  // Récupérer les échéances de paiement
  const { data: paymentSchedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ["/api/commissions/payment-schedule"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/commissions/payment-schedule");
      return await response.json();
    }
  });

  // Récupérer les factures disponibles
  const { data: factures, isLoading: isLoadingFactures } = useQuery({
    queryKey: ["/api/factures/disponibles"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/factures/disponibles/16");
      return await response.json();
    }
  });

  // Utiliser EXCLUSIVEMENT les données temps réel de l'endpoint /api/ventes/stats (juillet 2025)
  const commissionTotale = ventesStats?.commission || 0; 
  const pointsCVD = ventesStats?.totalPoints || 0; 
  const installationsDuMois = ventesStats?.ventes || 0;
  
  // Calcul correct de la tranche basé sur les points cumulés (pas sur les paliers)
  const getTrancheFromPoints = (points: number) => {
    if (points >= 101) return 4; // Tranche 4: 101+ points
    if (points >= 51) return 3;  // Tranche 3: 51-100 points
    if (points >= 26) return 2;  // Tranche 2: 26-50 points
    return 1;                    // Tranche 1: 0-25 points
  };
  
  const tranche = getTrancheFromPoints(pointsCVD);
  const commissionEncaissable = commissionTotale;
  const datePaiement = "15/07/2025";
  const moisEnCours = "2025-06";

  // Calcul correct des points restants pour la tranche suivante
  const getPointsRestants = (pointsActuels: number) => {
    if (pointsActuels >= 101) return 0; // Déjà dans tranche 4 (maximum)
    if (pointsActuels >= 51) return 101 - pointsActuels; // Vers tranche 4
    if (pointsActuels >= 26) return 51 - pointsActuels;  // Vers tranche 3
    if (pointsActuels >= 0) return 26 - pointsActuels;   // Vers tranche 2
    return 0;
  };

  // Forcer le calcul correct, ignorer le calcul incorrect de l'endpoint
  const pointsRestants = getPointsRestants(pointsCVD);
  
  // Calculs des métriques de performance basés sur les vraies données
  // Utiliser les données de l'endpoint répartition pour le taux de conversion
  const tauxConversion = repartitionStats?.tauxConversion || 0;
  const objectifMensuel = 25;
  const progressionObjectif = Math.round((installationsDuMois / objectifMensuel) * 100);
  const moyenneQuotidienne = (installationsDuMois / new Date().getDate()).toFixed(1);
  const pointsQuotidiens = Math.round((pointsCVD / new Date().getDate()) * 10) / 10;
  const commissionQuotidienne = Math.round(commissionTotale / new Date().getDate());

  // Debug pour vérifier les valeurs en temps réel (juillet 2025)
  console.log('🔍 DEBUG MÉTRIQUES TEMPS RÉEL MA FACTURATION:', {
    source: 'ventesStats (juillet 2025)',
    ventesStats,
    commissionTotale,
    pointsCVD,
    installationsDuMois,
    tranche,
    pointsRestants,
    progressionObjectif: `${progressionObjectif}%`,
    freeboxCount: ventesStats?.freeboxCount,
    forfait5gCount: ventesStats?.forfait5gCount
  });

  const telechargerFacture = async (mois: string) => {
    try {
      const response = await fetch(`/api/factures/test-pdf/16/${mois}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `facture-commission-${mois}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  const voirApercu = async (mois: string) => {
    try {
      // Utiliser l'endpoint test-pdf existant pour l'aperçu
      const url = `/api/factures/test-pdf/16/${mois}`;
      window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    } catch (error) {
      console.error('Erreur aperçu:', error);
    }
  };

  if (isLoadingCVD || isLoadingSchedule || isLoadingFactures) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-2 sm:p-4 pb-24">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          
          {/* Header principal */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-4 sm:p-6">
            <div className="text-center sm:flex sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Ma Facturation Mensuelle
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                  Gestion complète de vos commissions, factures et échéances
                </p>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{commissionEncaissable}€</div>
                <div className="text-xs sm:text-sm text-gray-500">
                  Encaissable le {datePaiement}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Accumulation temps réel - {installationsDuMois} installations
                </div>
              </div>
            </div>
          </div>

          {/* Interface avec onglets */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-lg p-1 h-auto rounded-xl">
              <TabsTrigger 
                value="overview" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg border border-transparent data-[state=active]:border-blue-300"
              >
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Vue</span>
              </TabsTrigger>

              <TabsTrigger 
                value="facturation" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg border border-transparent data-[state=active]:border-blue-300"
              >
                <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Facturation</span>
                <span className="sm:hidden">Facturation</span>
              </TabsTrigger>

              <TabsTrigger 
                value="conditions" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg border border-transparent data-[state=active]:border-blue-300"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Conditions</span>
                <span className="sm:hidden">Conditions</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                {/* Performance mensuelle */}
                <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      Performance mensuelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Commission totale</span>
                        <span className="text-xl font-bold text-blue-600">{commissionTotale}€</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Points accumulés</span>
                        <span className="text-lg font-semibold text-green-600">{pointsCVD} pts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tranche active</span>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Tranche {tranche}
                        </Badge>
                      </div>
                      <Progress value={pointsRestants > 0 ? Math.min(100, (pointsCVD / (pointsCVD + pointsRestants)) * 100) : 100} className="h-2" />
                      <p className="text-xs text-gray-500">
                        {pointsRestants > 0 
                          ? `Progression vers la tranche suivante - ${pointsRestants} points restants`
                          : "Tranche maximale atteinte"
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Système de paiements complet avec messages motivants */}
                <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      Mes prochains paiements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {paymentSchedule?.nextPayments && paymentSchedule.nextPayments.length > 0 ? (
                        <>
                          {/* Affichage des paiements programmés */}
                          {paymentSchedule.nextPayments.map((payment: any, index: number) => (
                            <div key={index} className={`p-4 rounded-lg border-l-4 ${
                              payment.type.includes('CVD') ? 'bg-blue-50 border-blue-400' :
                              payment.type.includes('CCA') ? 'bg-green-50 border-green-400' :
                              payment.type.includes('CAE') ? 'bg-purple-50 border-purple-400' :
                              'bg-orange-50 border-orange-400'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className={`font-semibold ${
                                    payment.type.includes('CVD') ? 'text-blue-900' :
                                    payment.type.includes('CCA') ? 'text-green-900' :
                                    payment.type.includes('CAE') ? 'text-purple-900' :
                                    'text-orange-900'
                                  }`}>
                                    {payment.type}
                                  </div>
                                  <div className={`text-sm mt-1 ${
                                    payment.type.includes('CVD') ? 'text-blue-600' :
                                    payment.type.includes('CCA') ? 'text-green-600' :
                                    payment.type.includes('CAE') ? 'text-purple-600' :
                                    'text-orange-600'
                                  }`}>
                                    {payment.date}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-2">
                                    {payment.description}
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <div className={`text-lg font-bold ${
                                    payment.type.includes('CVD') ? 'text-blue-600' :
                                    payment.type.includes('CCA') ? 'text-green-600' :
                                    payment.type.includes('CAE') ? 'text-purple-600' :
                                    'text-orange-600'
                                  }`}>
                                    {payment.montant}€
                                  </div>
                                  <div className={`text-xs ${
                                    payment.daysUntil <= 7 ? 'text-red-600 font-semibold' :
                                    payment.daysUntil <= 14 ? 'text-orange-600' :
                                    'text-gray-500'
                                  }`}>
                                    {payment.daysUntil > 0 ? `Dans ${payment.daysUntil} jour${payment.daysUntil > 1 ? 's' : ''}` : 'Échéance atteinte'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Total des paiements programmés */}
                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-800">Total programmé</span>
                              <span className="text-xl font-bold text-green-600">
                                {paymentSchedule.totalProgrammed}€
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Messages motivants si aucune commission */
                        paymentSchedule?.motivationalMessage && (
                          <div className="space-y-4">
                            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                              <div className="text-2xl mb-3">{paymentSchedule.motivationalMessage.title}</div>
                              <p className="text-gray-700 mb-4 leading-relaxed">
                                {paymentSchedule.motivationalMessage.message}
                              </p>
                              
                              {paymentSchedule.motivationalMessage.nextGoal && (
                                <div className="bg-white/80 rounded-lg p-4 mt-4 border border-blue-200">
                                  <div className="font-semibold text-blue-900 mb-2">
                                    🎯 Prochain objectif : {paymentSchedule.motivationalMessage.nextGoal.type}
                                  </div>
                                  <div className="text-sm text-gray-700 space-y-1">
                                    <div>
                                      <span className="font-medium">Condition :</span> {paymentSchedule.motivationalMessage.nextGoal.requirement}
                                    </div>
                                    <div>
                                      <span className="font-medium">Avantage :</span> {paymentSchedule.motivationalMessage.nextGoal.benefit}
                                    </div>
                                    <div className="text-blue-600 font-medium mt-2">
                                      💪 {paymentSchedule.motivationalMessage.nextGoal.motivation}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Statistiques actuelles pour encourager */}
                            {paymentSchedule?.currentStats && (
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-200">
                                  <div className="text-lg font-bold text-blue-600">
                                    {paymentSchedule.currentStats.installations}
                                  </div>
                                  <div className="text-xs text-gray-600">Installations</div>
                                </div>
                                <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-200">
                                  <div className="text-lg font-bold text-green-600">
                                    {paymentSchedule.currentStats.points}
                                  </div>
                                  <div className="text-xs text-gray-600">Points CVD</div>
                                </div>
                                <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-200">
                                  <div className="text-lg font-bold text-orange-600">
                                    {paymentSchedule.currentStats.clientsARelancer}
                                  </div>
                                  <div className="text-xs text-gray-600">À relancer</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* Onglet Facturation - Système intégré de l'historique des commissions */}
            <TabsContent value="facturation" className="space-y-4 sm:space-y-6">
              
              {/* Titre de la section */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg">
                  <History className="h-5 w-5" />
                  <span className="font-semibold">Historique des commissions</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Consultez vos factures et générez vos documents de commission
                </p>
              </div>

              {/* Intégration du composant HistoriqueCommissions qui fonctionne */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
                <HistoriqueCommissions />
              </div>
            </TabsContent>

            {/* Onglet Conditions */}
            <TabsContent value="conditions" className="space-y-4 sm:space-y-6">
              <div className="space-y-4">

                {/* Barème CVD complet - Compact */}
                <Card className="bg-white/90 border border-gray-200 shadow-md">
                  <CardHeader className="p-3 border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2 text-base text-gray-800">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      Barème CVD complet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Tranche 1 (0-25 pts)</span>
                        <span className="text-sm font-medium text-gray-800">Freebox: 50-60€</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Tranche 2 (26-50 pts)</span>
                        <span className="text-sm font-medium text-gray-800">Freebox: 60-80€</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Tranche 3 (51-100 pts)</span>
                        <span className="text-sm font-medium text-gray-800">Freebox: 70-100€</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Tranche 4 (101+ pts)</span>
                        <span className="text-sm font-medium text-gray-800">Freebox: 90-120€</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calendrier des paiements - Alignement sur chaque ligne */}
                <Card className="bg-white/95 border border-gray-200 shadow-md">
                  <CardHeader className="p-3 border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2 text-base text-gray-800">
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      Calendrier des paiements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      {/* CVD - Ligne complète */}
                      <div className="flex items-center justify-between w-full py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-semibold text-blue-600">CVD - Commissions sur Ventes Directes:</span>
                        </div>
                        <div className="text-sm font-medium text-gray-700 text-right">
                          Le 15 N+1
                        </div>
                      </div>
                      
                      {/* CCA - Ligne complète */}
                      <div className="flex items-center justify-between w-full py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-semibold text-green-600">CCA - Commissions sur Chiffres d'Affaires:</span>
                        </div>
                        <div className="text-sm font-medium text-gray-700 text-right">
                          Le 22 N+1
                        </div>
                      </div>
                      
                      {/* CAE - Ligne complète */}
                      <div className="flex items-center justify-between w-full py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-semibold text-orange-600">CAE - Commissions Animations Equipe:</span>
                        </div>
                        <div className="text-sm font-medium text-gray-700 text-right">
                          Chaque vendredi
                        </div>
                      </div>
                      
                      {/* FSB - Ligne complète */}
                      <div className="flex items-center justify-between w-full py-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-semibold text-purple-600">FSB - Fast Start Bonus:</span>
                        </div>
                        <div className="text-sm font-medium text-gray-700 text-right">
                          Bonus mensuel
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

          </Tabs>

        </div>
      </div>
    </AppLayout>
  );
}