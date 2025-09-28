import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NetworkView } from "@/components/mlm/network-view";
import { NetworkTreeViewSimple } from "@/components/mlm/network-tree-view-simple";
import { CommissionsView } from "@/components/mlm/commissions-view";
import { RecruitmentTips } from "@/components/mlm/recruitment-tips";
import { DirectSalesView } from "@/components/mlm/direct-sales-view";
import { BarChart3, Users, Activity, Lightbulb, Loader2, UserPlus, CircleDollarSign, Network, Calculator } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/app-layout";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function MLMDashboardFixed() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Vérifier si l'utilisateur est admin
  const isAdmin = user && [1, 15].includes(user.id);

  // Vérifier si l'utilisateur est un distributeur MLM
  const { 
    data: distributeur, 
    isLoading: isLoadingDistributeur,
    error: distributeurError,
    isError: isDistributeurError
  } = useQuery({
    queryKey: ["/api/mlm/profile"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/mlm/profile");
        return await response.json();
      } catch (error) {
        // Si erreur 404, l'utilisateur n'est pas distributeur
        if ((error as any)?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: false
  });

  // Récupérer les statistiques - globales pour admin, personnelles pour distributeur
  const { 
    data: statistics, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ["/api/mlm/statistics", isAdmin ? "global" : "personal"],
    queryFn: async () => {
      const endpoint = isAdmin ? "/api/mlm/statistics/global" : "/api/mlm/statistics";
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: isAdmin || !!distributeur // Activer pour admin ou distributeur
  });

  // Récupérer les commissions du distributeur
  const { 
    data: commissions, 
    isLoading: isLoadingCommissions 
  } = useQuery({
    queryKey: ["/api/mlm/commissions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/commissions");
      return await response.json();
    },
    enabled: !!distributeur // Activer uniquement si l'utilisateur est distributeur
  });

  // Récupérer le réseau du distributeur
  const { 
    data: networkData, 
    isLoading: isLoadingNetwork 
  } = useQuery({
    queryKey: ["/api/mlm/network"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/network");
      const data = await response.json();
      // Transformer les données brutes en tableau
      return data && data.rows ? data.rows : [];
    },
    enabled: !!distributeur // Activer uniquement si l'utilisateur est distributeur
  });

  // Récupérer les règles de commission
  const { 
    data: rules, 
    isLoading: isLoadingRules 
  } = useQuery({
    queryKey: ["/api/mlm/rules"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/rules");
      return await response.json();
    },
    enabled: !!distributeur // Activer uniquement si l'utilisateur est distributeur
  });

  // Mutation pour s'enregistrer comme distributeur
  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/mlm/register", {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'enregistrement");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Vous êtes maintenant enregistré comme distributeur MLM",
      });
      // Rafraîchir les données
      queryClient.invalidateQueries({queryKey: ["/api/mlm/profile"]});
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fonction pour transformer les données du réseau en structure hiérarchique
  const transformNetworkToTree = (rawData: any): any[] => {
    console.log("Données brutes du réseau:", rawData);
    
    // Vérifier si rawData est un tableau ou un objet avec une propriété rows
    let dataArray = [];
    if (Array.isArray(rawData)) {
      dataArray = rawData;
    } else if (rawData && rawData.rows && Array.isArray(rawData.rows)) {
      dataArray = rawData.rows;
    } else if (rawData && typeof rawData === 'object') {
      // Si c'est un objet mais pas un tableau, le convertir en tableau avec un seul élément
      dataArray = [rawData];
    }

    console.log("Données transformées en tableau:", dataArray);

    if (!dataArray || dataArray.length === 0) {
      // Créer des données de démonstration pour l'arbre hiérarchique
      return [{
        id: 1,
        nom: distributeur?.nom || "Admin",
        prenom: distributeur?.prenom || "Principal",
        codeVendeur: distributeur?.codeVendeur || "FR52796953",
        niveau: 1,
        parentId: undefined,
        enfants: [],
        stats: {
          totalClients: statistics?.totalClients || 0,
          commissionsGenerees: 0,
          recrutements: 0,
          performance: 'bon' as 'excellent' | 'bon' | 'moyen' | 'faible'
        }
      }];
    }

    // Utiliser les données réelles avec enrichissement minimal
    const transformedData = dataArray.map((item: any, index: number) => ({
      id: item.id || index + 1,
      nom: item.nom || "Distributeur",
      prenom: item.prenom || "",
      codeVendeur: item.codeVendeur || item.codeVendeur || `CODE${index + 1}`,
      niveau: item.niveau || 1,
      parentId: item.parentId || item.parent_id,
      enfants: [],
      stats: {
        totalClients: item.totalClients || 0,
        commissionsGenerees: item.commissionsGenerees || 0,
        recrutements: item.recrutements || 0,
        performance: item.performance || 'moyen' as 'excellent' | 'bon' | 'moyen' | 'faible'
      }
    }));

    // Organiser en structure d'arbre
    const nodeMap = new Map();
    const roots: any[] = [];

    // Créer la map des nœuds
    transformedData.forEach((node: any) => {
      nodeMap.set(node.id, { ...node, enfants: [] });
    });

    // Construire l'arbre
    transformedData.forEach((node: any) => {
      const currentNode = nodeMap.get(node.id);
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId).enfants.push(currentNode);
      } else {
        roots.push(currentNode);
      }
    });

    console.log("Arbre hiérarchique final:", roots);
    return roots;
  };

  const hierarchicalNetworkData = transformNetworkToTree(networkData);

  // Fonction pour s'enregistrer comme distributeur
  const handleRegister = () => {
    registerMutation.mutate(undefined);
  };

  // Afficher une page de chargement
  if (isLoadingDistributeur) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Si l'utilisateur n'est pas distributeur ET n'est pas admin, afficher une page d'inscription
  if (!distributeur && !isAdmin) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="max-w-lg mx-auto text-center mt-8">
            <div className="flex justify-center mb-4">
              <Network className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Programme Multi-Level Marketing</h1>
            <p className="text-muted-foreground mb-6">
              Rejoignez notre réseau de distributeurs et développez votre équipe commerciale
            </p>
            
            <Card>
              <CardHeader>
                <CardTitle>Devenez distributeur</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  En tant que vendeur, vous pouvez vous inscrire au programme MLM pour recruter d'autres vendeurs et percevoir des commissions sur leurs ventes.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <CircleDollarSign className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">Commissions multiniveaux</h3>
                      <p className="text-xs text-muted-foreground">Gagnez des commissions sur les ventes de votre équipe jusqu'à 5 niveaux</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">Développez votre réseau</h3>
                      <p className="text-xs text-muted-foreground">Recrutez des vendeurs et construisez votre propre organisation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <UserPlus className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">Parrainez de nouveaux distributeurs</h3>
                      <p className="text-xs text-muted-foreground">Utilisez votre code vendeur pour parrainer d'autres membres</p>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6" 
                  onClick={handleRegister}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Inscription en cours...
                    </>
                  ) : (
                    "S'inscrire comme distributeur"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        {/* En-tête avec informations distributeur */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Tableau de bord MLM</h1>
              {isAdmin ? (
                <Badge variant="outline" className="bg-red-100 text-red-700">Vue Administrateur</Badge>
              ) : (
                <Badge variant="outline" className="bg-primary/10">Niveau {distributeur?.niveau}</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {isAdmin ? (
                "Vue d'ensemble du réseau complet"
              ) : (
                <>Code vendeur: <span className="font-mono">{distributeur?.codeVendeur}</span></>
              )}
            </p>
          </div>
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-center">
                {isAdmin ? "Total Vendeurs" : "Réseau"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3 text-center">
              <div className="text-lg sm:text-2xl font-bold text-primary">
                {isLoadingStats ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
                ) : (
                  isAdmin ? (statistics?.totalVendeurs || 0) : (statistics?.tailleReseau || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "vendeurs actifs" : "distributeurs"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-center">
                {isAdmin ? "Total Clients" : "Directs"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl sm:text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  isAdmin ? (statistics?.totalClients || 0) : (statistics?.nbEnfantsDirects || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {isAdmin ? "clients du réseau" : "Recrutés directement"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Ce mois</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl sm:text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  `${Number(statistics?.commissionsMoisCourant || 0).toFixed(2)} €`
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Commissions en cours
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl sm:text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  `${Number(statistics?.commissionsTotal || 0).toFixed(2)} €`
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Depuis inscription
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation mobile optimisée */}
        <div className="block sm:hidden mb-6">
          <div className="grid grid-cols-2 gap-3">
            {/* Cartes de navigation principales */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'overview' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium text-sm">Vue d'ensemble</h3>
                <p className="text-xs text-muted-foreground">Tableau de bord</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'network' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab('network')}
            >
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium text-sm">{isAdmin ? "Réseau" : "Mon réseau"}</h3>
                <p className="text-xs text-muted-foreground">Distributeurs</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'commissions' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab('commissions')}
            >
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium text-sm">Commissions</h3>
                <p className="text-xs text-muted-foreground">MLM</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'direct-sales' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab('direct-sales')}
            >
              <CardContent className="p-4 text-center">
                <Calculator className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium text-sm">Ventes directes</h3>
                <p className="text-xs text-muted-foreground">CVD</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'recruitment' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab('recruitment')}
            >
              <CardContent className="p-4 text-center">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium text-sm">Recrutement</h3>
                <p className="text-xs text-muted-foreground">Conseils</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => window.open('/documents', '_blank')}
            >
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium text-sm">Documents</h3>
                <p className="text-xs text-muted-foreground">Télécharger</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation desktop */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full hidden sm:grid grid-cols-5 mb-4">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Mon réseau</span>
            </TabsTrigger>
            <TabsTrigger value="commissions" className="text-xs sm:text-sm">
              <Activity className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Commissions MLM</span>
            </TabsTrigger>
            <TabsTrigger value="direct-sales" className="text-xs sm:text-sm">
              <Calculator className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ventes directes</span>
            </TabsTrigger>
            <TabsTrigger value="recruitment" className="text-xs sm:text-sm">
              <Lightbulb className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Recrutement</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Contenu des onglets */}
          <TabsContent value="overview" className="space-y-4">
            <Alert>
              <AlertDescription>
                <p className="text-sm font-medium">Bienvenue sur votre tableau de bord MLM</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Gérez votre réseau, suivez vos commissions et développez votre business.
                </p>
              </AlertDescription>
            </Alert>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Votre réseau</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingNetwork ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !networkData || networkData.length <= 1 ? (
                    <div className="text-center py-6">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">Aucun distributeur dans votre réseau</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Pour développer votre réseau, commencez par recruter des vendeurs.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab("recruitment")}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Conseils de recrutement
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 bg-muted/50 p-3 rounded-lg">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Réseau total</div>
                          <div className="text-lg font-bold">
                            {networkData ? networkData.length - 1 : 0}
                          </div>
                          <div className="text-xs text-muted-foreground">distributeurs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Niveau max</div>
                          <div className="text-lg font-bold">
                            {networkData && networkData.length > 0
                              ? Math.max(...networkData.map((m: any) => m.niveau || 0), 0)
                              : 0}
                          </div>
                          <div className="text-xs text-muted-foreground">profondeur</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Directs</div>
                          <div className="text-lg font-bold">
                            {networkData 
                              ? networkData.filter((m: any) => m.parent_id === distributeur.id).length
                              : 0}
                          </div>
                          <div className="text-xs text-muted-foreground">distributeurs</div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setActiveTab("network")}
                      >
                        Voir le détail du réseau
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vos commissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingCommissions ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : commissions?.length === 0 ? (
                    <div className="text-center py-6">
                      <CircleDollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">Aucune commission</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Les commissions sont calculées lorsque vos distributeurs réalisent des ventes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                          <div className="text-xs text-muted-foreground">En attente</div>
                          <div className="text-lg font-bold">
                            {commissions.filter((c: any) => c.statut === 'calculee').length}
                          </div>
                          <div className="text-xs text-muted-foreground">transactions</div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                          <div className="text-xs text-muted-foreground">Dernier mois</div>
                          <div className="text-lg font-bold">
                            {`${Number(statistics?.commissionsMoisCourant || 0).toFixed(2)} €`}
                          </div>
                          <div className="text-xs text-muted-foreground">de commissions</div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setActiveTab("commissions")}
                      >
                        Voir toutes les commissions
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="network">
            <NetworkTreeViewSimple 
              networkData={hierarchicalNetworkData}
              isLoading={isLoadingNetwork}
            />
          </TabsContent>
          
          <TabsContent value="commissions">
            {isLoadingCommissions || isLoadingRules ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommissionsView 
                commissions={commissions} 
                rules={rules} 
                distributeurId={distributeur?.id || 0}
                isLoading={isLoadingCommissions}
                isLoadingRules={isLoadingRules}
              />
            )}
          </TabsContent>
          
          <TabsContent value="direct-sales">
            <DirectSalesView />
          </TabsContent>
          
          <TabsContent value="recruitment">
            <RecruitmentTips 
              distributeurCode={distributeur?.codeVendeur || "ADMIN"} 
              nbDirects={statistics?.nbEnfantsDirects || 0}
              niveau={distributeur?.niveau || 1}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
