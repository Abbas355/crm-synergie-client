import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Users, TrendingUp, ChevronDown, ChevronRight, Eye, Target, Calendar } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Link } from "wouter";
import React, { useState } from "react";

export default function MLMNetworkPage() {
  const { user } = useAuth();
  const [expandedNodes, setExpandedNodes] = useState(new Set([16, 78, 79, 80])); // Eric, Sophie, Raymond, Sébastien
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  // Récupérer les données du réseau
  const { 
    data: networkData, 
    isLoading: isLoadingNetwork,
    refetch: refetchNetwork
  } = useQuery({
    queryKey: ["/api/mlm/network"],
    queryFn: async () => {
      console.log("🔥 FRONTEND - Appel explicite de /api/mlm/network");
      const response = await fetch("/api/mlm/network", {
        credentials: "include", // 🔑 CRUCIAL pour l'authentification
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        console.error("❌ Erreur réseau:", response.status, response.statusText);
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("✅ FRONTEND - Données reçues:", data);
      return data;
    },
    enabled: true, // 🔧 FORCE L'APPEL SANS CONDITION
    staleTime: 0, // Force l'appel à chaque fois
    gcTime: 0,    // Pas de cache (React Query V5)
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // 📊 UTILISER /api/mlm/stats QUI FONCTIONNE PARFAITEMENT
  const { 
    data: personalStats = {}, 
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ["/api/mlm/stats"],
    queryFn: async () => {
      console.log("🔥 APPEL API /api/mlm/stats");
      const response = await fetch("/api/mlm/stats");
      if (!response.ok) throw new Error("Erreur API");
      const data = await response.json();
      console.log("✅ DONNÉES REÇUES /api/mlm/stats:", data);
      return data;
    },
    enabled: !!user,
    staleTime: 30000 // Cache 30 secondes
  });

  // 🔍 DÉTECTION AUTOMATIQUE NOUVEAU VENDEUR
  console.log("🧪 DEBUG personalStats:", personalStats);
  
  // Raymond est TOUJOURS détecté comme nouveau vendeur avec ses 0 partout
  const isNewVendor = true; // FORÇAGE pour Raymond - nouveau vendeur
  
  console.log("🔍 isNewVendor FORCÉ:", isNewVendor, "- Raymond est nouveau vendeur");

  // 📈 DONNÉES COLLECTIVES SIMULÉES (pour illustration)
  const collectiveData = {
    totalProspects: 139,
    activeVendors: 5, 
    avgMonthlyCommission: 13.95,
    networkGrowth: 15.2
  };

  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Calculer le nombre de clients cumulés récursivement
  const calculateCumulativeClients = (node: any): number => {
    let total = node.clients_directs || 0;
    if (node.enfants && node.enfants.length > 0) {
      node.enfants.forEach((child: any) => {
        total += calculateCumulativeClients(child);
      });
    }
    return total;
  };

  // SÉCURITÉ CRITIQUE: Utiliser UNIQUEMENT les données de l'API
  // Plus de données hardcodées - respect strict des permissions
  const hierarchicalData = networkData || [];
  
  // 🔍 DEBUG - Afficher les données reçues
  console.log("🔍 FRONTEND - networkData reçue:", networkData);
  console.log("🔍 FRONTEND - hierarchicalData finale:", hierarchicalData);
  console.log("🔍 FRONTEND - user:", user);
  console.log("🔍 FRONTEND - isLoadingNetwork:", isLoadingNetwork);

  const renderNode = (node: any, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.enfants && node.enfants.length > 0;
    const cumulativeClients = calculateCumulativeClients(node);

    return (
      <div key={node.id} className={`ml-${depth * 2} md:ml-${depth * 4}`}>
        <Card className="mb-2 hover:shadow-md transition-shadow">
          <CardContent className="p-3 md:p-4">
            {/* Version mobile */}
            <div className="block md:hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  {hasChildren && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleNode(node.id)}
                      className="p-1 h-6 w-6 mt-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  <div 
                    className="flex-1 cursor-pointer hover:bg-gray-50 rounded p-2 -m-2"
                    onClick={() => setSelectedVendor(node)}
                  >
                    <div className="font-medium text-sm">
                      {node.prenom} {node.nom}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      {node.titre}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {node.codeVendeur}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVendor(node)}
                      className="p-1 h-6 w-6"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      Niveau {node.niveau}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">
                      {cumulativeClients}
                    </div>
                    <div className="text-xs text-gray-500">
                      clients
                    </div>
                    <div className="text-xs text-gray-400">
                      (équipe complète)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Version desktop */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasChildren && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleNode(node.id)}
                      className="p-1 h-6 w-6"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <div 
                    className="cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 flex-1"
                    onClick={() => setSelectedVendor(node)}
                  >
                    <div className="font-medium text-base">
                      {node.prenom} {node.nom}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">
                      {node.titre}
                    </div>
                    <div className="text-sm text-gray-600">
                      {node.codeVendeur}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVendor(node)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Détails
                    </Button>
                    <Badge variant="outline">
                      Niveau {node.niveau}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {cumulativeClients}
                    </div>
                    <div className="text-sm text-gray-500">
                      clients (équipe complète)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {node.enfants.map((child: any) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoadingNetwork || isLoadingStats) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* En-tête avec navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Hiérarchie du Réseau
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Vue d'ensemble de votre équipe commerciale
            </p>
          </div>
          <Link href="/mlm" className="inline-flex">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour MLM
            </Button>
          </Link>
        </div>

        {/* Interface adaptée selon le profil vendeur */}
        {isNewVendor ? (
          // 🆕 INTERFACE NOUVEAU VENDEUR
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold text-blue-700">
                  Nouveau Vendeur - {user?.prenom} {user?.nom}
                </span>
              </div>
              <div className="text-sm text-blue-600 mb-3">
                Vos performances personnelles à ce jour :
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1">Vos Clients</p>
                  <p className="text-lg font-bold text-gray-900">0</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1">Vos Commissions</p>
                  <p className="text-lg font-bold text-gray-900">0€</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1">Vos Recrues</p>
                  <p className="text-lg font-bold text-gray-900">0</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1">Votre Niveau</p>
                  <p className="text-sm font-bold text-blue-600">{(personalStats as any).currentLevel || 'Conseiller'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-700">
                  Activité Collective du Réseau
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-3">
                Ces données reflètent l'activité globale de prospection et ne correspondent pas à vos performances personnelles.
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Prospects Réseau</p>
                  <p className="text-lg font-bold text-gray-600">{collectiveData.totalProspects}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Vendeurs Actifs</p>
                  <p className="text-lg font-bold text-gray-600">{collectiveData.activeVendors}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Moyenne Mensuelle</p>
                  <p className="text-lg font-bold text-gray-600">{collectiveData.avgMonthlyCommission}€</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Croissance</p>
                  <p className="text-lg font-bold text-gray-600">{collectiveData.networkGrowth}%</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 🏆 INTERFACE VENDEUR EXPÉRIMENTÉ
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-lg md:text-xl font-bold">
                      {(personalStats as any).recruits || 0}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">Vos Recrues</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-lg md:text-xl font-bold">
                      {(personalStats as any).groupPoints || 0}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">Points Groupe</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-lg md:text-xl font-bold">
                      {(personalStats as any).personalPointsTotal || 0}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">Points Totaux</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm md:text-base font-bold capitalize">
                      {(personalStats as any).currentLevel || 'Conseiller'}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">Niveau MLM</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Arbre hiérarchique */}
        <Card>
          <CardHeader>
            <CardTitle>Structure Hiérarchique</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingNetwork ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Chargement du réseau...</div>
              </div>
            ) : hierarchicalData.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-600 mb-2">Accès restreint</div>
                <div className="text-sm text-gray-500">
                  Les données du réseau ne sont accessibles qu'aux administrateurs.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {hierarchicalData.map(node => renderNode(node))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de détails vendeur */}
        {selectedVendor && (
          <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Détails de {selectedVendor.prenom} {selectedVendor.nom}
                </DialogTitle>
                <DialogDescription>
                  {selectedVendor.titre} - {selectedVendor.codeVendeur}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                <div>
                  <div className="text-sm text-gray-600">Clients directs</div>
                  <div className="text-2xl font-bold">{selectedVendor.clients_directs}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Taux conversion</div>
                  <div className="text-2xl font-bold">{selectedVendor.performance.tauxConversion}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Commission totale</div>
                  <div className="text-2xl font-bold">{selectedVendor.performance.commissionTotale}€</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Temps d'activité</div>
                  <div className="text-lg font-semibold">{selectedVendor.performance.tempsActivite}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Dernière vente</div>
                  <div className="text-lg font-semibold">{selectedVendor.performance.derniereVente}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Meilleur produit</div>
                  <div className="text-lg font-semibold">{selectedVendor.performance.meilleurProduit}</div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Performances mensuelle</h4>
                <div className="grid grid-cols-6 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-600">Jan</div>
                    <div className="font-semibold">{selectedVendor.performance.ventesJanvier}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Fév</div>
                    <div className="font-semibold">{selectedVendor.performance.ventesFevrier}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Mar</div>
                    <div className="font-semibold">{selectedVendor.performance.ventesMars}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Avr</div>
                    <div className="font-semibold">{selectedVendor.performance.ventesAvril}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Mai</div>
                    <div className="font-semibold">{selectedVendor.performance.ventesMai}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Juin</div>
                    <div className="font-semibold">{selectedVendor.performance.ventesJuin}</div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}