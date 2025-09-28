import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Activity, Network, Calculator } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { NetworkTreeViewSimple } from "@/components/mlm/network-tree-view-simple";

export default function MLMDashboardSimple() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Vérifier si l'utilisateur est admin
  const isAdmin = user && [1, 15].includes(user.id);

  // Récupérer les statistiques de base
  const { 
    data: statistics, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ["/api/mlm/statistics"],
    enabled: !!user
  });

  // Récupérer les données du distributeur
  const { 
    data: distributeur, 
    isLoading: isLoadingDistributeur 
  } = useQuery({
    queryKey: ["/api/mlm/distributeur"],
    enabled: !!user
  });

  // Récupérer les données du réseau MLM
  const { 
    data: networkData, 
    isLoading: isLoadingNetwork 
  } = useQuery({
    queryKey: ["/api/mlm/network"],
    enabled: !!user
  });

  // Transformer les données pour l'arbre hiérarchique
  const hierarchicalNetworkData = useMemo(() => {
    if (!networkData || !Array.isArray(networkData)) {
      // Données de démonstration basées sur Jacques Santoni
      return [{
        id: 1,
        nom: "Santoni",
        prenom: "Jacques",
        codeVendeur: "FR52796953",
        niveau: 1,
        parentId: undefined,
        enfants: [],
        stats: {
          totalClients: (statistics as any)?.totalClients || 0,
          commissionsGenerees: 0,
          recrutements: 0,
          performance: 'bon' as const
        }
      }];
    }

    // Transformer les données réelles en structure hiérarchique
    const transformedData = networkData.map((item: any, index: number) => ({
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
        performance: item.performance || 'moyen' as const
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

    return roots;
  }, [networkData, statistics]);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord MLM</h1>
            <p className="text-gray-600 mt-2">
              Gérez votre réseau de distributeurs et suivez vos performances
            </p>
          </div>
          {distributeur && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              {(distributeur as any)?.codeVendeur || (distributeur as any)?.codeVendeur || "N/A"}
            </Badge>
          )}
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : (statistics?.totalClients || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distributeurs Actifs</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : (statistics?.totalDistributeurs || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commissions</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : `${(statistics?.totalCommissions || 0).toFixed(2)}€`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant="secondary">
                  {isLoadingStats ? "..." : (statistics?.performance || "Bon")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="network">Mon réseau</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="tips">Conseils</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tableau de Bord Principal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Interface de gestion MLM en cours de développement.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Utilisez les onglets ci-dessus pour naviguer dans les différentes sections.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <NetworkTreeViewSimple 
              networkData={hierarchicalNetworkData}
              isLoading={isLoadingNetwork}
            />
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Gestion des Commissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Module de commissions en cours de développement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Conseils de Recrutement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Optimisez votre réseau
                    </h4>
                    <p className="text-blue-800 text-sm">
                      Concentrez-vous sur la formation et l'accompagnement de vos distributeurs 
                      pour maximiser les performances de votre réseau.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">
                      Suivi régulier
                    </h4>
                    <p className="text-green-800 text-sm">
                      Organisez des points réguliers avec vos distributeurs 
                      pour maintenir la motivation et identifier les opportunités.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}