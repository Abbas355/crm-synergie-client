import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompactCard } from "@/components/ui/compact-card";
import { 
  Crown, 
  Users, 
  Euro, 
  Calendar, 
  TrendingUp,
  Award,
  Target,
  Clock,
  UserPlus,
  CheckCircle,
  ArrowRight,
  Banknote,
  ArrowLeft
} from "lucide-react";

interface CAEStats {
  positionActuelle: string;
  nouveauxCQCeMois: number;
  bonusTotal: number;
  prochainPaiement: Date;
  historiqueMois: Array<{
    mois: string;
    nouveauxCQ: number;
    bonus: number;
  }>;
  equipeActive: Array<{
    nom: string;
    pointsCeMois: number;
    statut: string;
    bonusGenere: number;
  }>;
  tableauCommissions: Record<string, {
    '1ere_generation': number;
    '2eme_generation': number | null;
  }>;
}

export default function CAECommissionPage() {
  const [, setLocation] = useLocation();

  // Définir le titre de la page
  useEffect(() => {
    document.title = "Commission Animation Equipe (CAE) - SMG";
    return () => {
      document.title = "SMG";
    };
  }, []);

  // Récupérer les données CAE
  const { data: caeData, isLoading } = useQuery({
    queryKey: ["/api/mlm/cae-commission"],
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const handleRetour = () => {
    setLocation("/mlm/commissions");
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const stats: CAEStats = (caeData as any)?.stats || {
    positionActuelle: 'ETT',
    nouveauxCQCeMois: 0,
    bonusTotal: 0,
    prochainPaiement: new Date(),
    historiqueMois: [],
    equipeActive: [],
    tableauCommissions: {}
  };
  
  // Correction temporaire pour l'erreur TypeScript
  const caeDataTyped = caeData as any;
  const tableauCommissions = stats.tableauCommissions || {};

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header avec titre et informations principales */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-4 md:p-6">
            {/* Bouton retour mobile */}
            <div className="flex items-center mb-4 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetour}
                className="p-2 h-auto"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <span className="text-sm text-gray-500 ml-2">Retour aux commissions</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent leading-tight">
                  Commission Animation Equipe (CAE)
                </h1>
                <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
                  Bonus Leadership pour nouveaux partenaires atteignant 25 points
                </p>
                
                {/* Badges responsive */}
                <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-3">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs md:text-sm">
                    <Crown className="h-3 w-3 mr-1" />
                    Position: {stats.positionActuelle}
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs md:text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    Paiement: Vendredi N+1
                  </Badge>
                </div>
              </div>
              
              {/* Montant responsive */}
              <div className="text-right flex-shrink-0">
                <div className="text-xl md:text-2xl font-bold text-orange-600">{stats.bonusTotal}€</div>
                <div className="text-xs md:text-sm text-gray-500">Ce mois-ci</div>
              </div>
            </div>

            {/* Bouton retour desktop */}
            <div className="hidden md:flex items-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetour}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux commissions MLM
              </Button>
            </div>
          </div>

          {/* Statistiques principales - 4 cartes compactes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <CompactCard
              title="Nouveaux CQ"
              value={stats.nouveauxCQCeMois}
              subtitle="Ce mois-ci"
              icon={<UserPlus className="h-5 w-5 text-orange-600" />}
              valueClassName="text-orange-600"
            />

            <CompactCard
              title="Bonus Total"
              value={`${stats.bonusTotal}€`}
              subtitle="Juin 2025"
              icon={<Euro className="h-5 w-5 text-green-600" />}
              valueClassName="text-green-600"
            />

            <CompactCard
              title="Équipe Active"
              value={stats.equipeActive?.length || 0}
              subtitle="Vendeurs"
              icon={<Users className="h-5 w-5 text-blue-600" />}
              valueClassName="text-blue-600"
            />

            <CompactCard
              title="Paiement"
              value={stats.prochainPaiement ? new Date(stats.prochainPaiement).toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'short' 
              }) : 'N/A'}
              subtitle="Vendredi N+1"
              icon={<Calendar className="h-5 w-5 text-purple-600" />}
              valueClassName="text-purple-600"
            />
          </div>

          {/* Tabs avec détails */}
          <Tabs defaultValue="bareme" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-orange-50/90 to-yellow-50/90 backdrop-blur-md border border-orange-200/60 shadow-xl rounded-2xl p-1.5 md:p-2 gap-1 md:gap-2">
              <TabsTrigger 
                value="bareme" 
                className="group flex flex-col items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-1 md:px-4 py-3 md:py-5 rounded-xl bg-white/40 transition-all duration-300 ease-in-out hover:bg-white/70 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:via-orange-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/25 data-[state=active]:scale-105 data-[state=active]:-translate-y-1 border border-white/30 data-[state=active]:border-orange-300"
              >
                <Award className="h-4 w-4 md:h-6 md:w-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold leading-tight text-center text-[10px] md:text-sm">
                  <span className="hidden lg:inline">Barème CAE</span>
                  <span className="lg:hidden">Barème</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="equipe" 
                className="group flex flex-col items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-1 md:px-4 py-3 md:py-5 rounded-xl bg-white/40 transition-all duration-300 ease-in-out hover:bg-white/70 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:via-orange-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/25 data-[state=active]:scale-105 data-[state=active]:-translate-y-1 border border-white/30 data-[state=active]:border-orange-300"
              >
                <Users className="h-4 w-4 md:h-6 md:w-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold leading-tight text-center text-[10px] md:text-sm">
                  <span className="hidden lg:inline">Mon Équipe</span>
                  <span className="lg:hidden">Équipe</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="historique" 
                className="group flex flex-col items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-1 md:px-4 py-3 md:py-5 rounded-xl bg-white/40 transition-all duration-300 ease-in-out hover:bg-white/70 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:via-orange-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/25 data-[state=active]:scale-105 data-[state=active]:-translate-y-1 border border-white/30 data-[state=active]:border-orange-300"
              >
                <Calendar className="h-4 w-4 md:h-6 md:w-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold leading-tight text-center text-[10px] md:text-sm">Historique</span>
              </TabsTrigger>
              <TabsTrigger 
                value="exemple" 
                className="group flex flex-col items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-1 md:px-4 py-3 md:py-5 rounded-xl bg-white/40 transition-all duration-300 ease-in-out hover:bg-white/70 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:via-orange-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/25 data-[state=active]:scale-105 data-[state=active]:-translate-y-1 border border-white/30 data-[state=active]:border-orange-300"
              >
                <Target className="h-4 w-4 md:h-6 md:w-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold leading-tight text-center text-[10px] md:text-sm">Exemples</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Barème CAE */}
            <TabsContent value="bareme">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-600" />
                    Tableau des Commissions Animation Equipe
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Bonus généré quand un nouveau partenaire atteint 25 points dans un mois calendaire
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left p-3 font-semibold text-gray-700">Position</th>
                          <th className="text-center p-3 font-semibold text-gray-700">1ère Génération</th>
                          <th className="text-center p-3 font-semibold text-gray-700">2ème Génération</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(tableauCommissions).map(([position, commissions]) => (
                          <tr key={position} className={`border-b border-gray-100 ${position === stats.positionActuelle ? 'bg-orange-50' : ''}`}>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={position === stats.positionActuelle ? "default" : "secondary"}
                                  className={position === stats.positionActuelle ? "bg-orange-600" : ""}
                                >
                                  {position}
                                </Badge>
                                {position === stats.positionActuelle && (
                                  <span className="text-xs text-orange-600 font-medium">Votre position</span>
                                )}
                              </div>
                            </td>
                            <td className="text-center p-3">
                              <span className="font-bold text-green-600">
                                {commissions['1ere_generation']}€
                              </span>
                            </td>
                            <td className="text-center p-3">
                              {commissions['2eme_generation'] ? (
                                <span className="font-bold text-blue-600">
                                  {commissions['2eme_generation']}€
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-2">Conditions d'activation</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Le nouveau vendeur doit atteindre <strong>25 points minimum</strong> dans son mois de démarrage</li>
                      <li>• Le bonus est versé <strong>chaque mois</strong> tant que le vendeur maintient 25 points</li>
                      <li>• Paiement effectué <strong>chaque vendredi N+1</strong></li>
                      <li>• Application de la règle de <strong>ligne ouverte</strong> pour la distribution</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Mon Équipe */}
            <TabsContent value="equipe">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Mon Équipe Active
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Vendeurs de votre équipe et leurs performances ce mois-ci
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.equipeActive?.map((membre, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {membre.nom.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{membre.nom}</p>
                            <p className="text-sm text-gray-600">{membre.pointsCeMois} points ce mois</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={membre.statut === 'CQ' ? "default" : "secondary"}
                            className={membre.statut === 'CQ' ? "bg-green-600" : ""}
                          >
                            {membre.statut}
                          </Badge>
                          <p className="text-sm font-semibold text-green-600 mt-1">
                            +{membre.bonusGenere}€
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Historique */}
            <TabsContent value="historique">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Historique des Bonus CAE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.historiqueMois?.map((mois, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">{mois.mois}</p>
                          <p className="text-sm text-gray-600">{mois.nouveauxCQ} nouveaux CQ</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{mois.bonus}€</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Exemples */}
            <TabsContent value="exemple">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    Exemples de Distribution CAE
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Comment fonctionne la répartition selon la hiérarchie
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    
                    {/* Exemple 1 */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3">Exemple 1: Parrainage Direct</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Un nouveau vendeur démarre dans l'équipe d'un ETT et fait 25 points
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>ETT (parrain direct)</span>
                          <Badge className="bg-blue-600">40€</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>ETL (upline)</span>
                          <Badge className="bg-green-600">100€</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Manager (upline)</span>
                          <Badge className="bg-yellow-600">150€</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>RC (upline)</span>
                          <Badge className="bg-purple-600">100€</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Exemple 2 */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-3">Exemple 2: Uplines de Même Niveau</h4>
                      <p className="text-sm text-green-700 mb-3">
                        Avec deux Managers dans la ligne upline
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>ETT (parrain direct)</span>
                          <Badge className="bg-blue-600">40€</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>ETL (upline)</span>
                          <Badge className="bg-green-600">100€</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Manager 1 (upline)</span>
                          <Badge className="bg-yellow-600">150€</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Manager 2 (upline)</span>
                          <Badge className="bg-orange-600">60€</Badge>
                          <span className="text-xs text-gray-600">(2ème génération)</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </AppLayout>
  );
}