import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, BarChart3, CheckCircle, AlertCircle } from "lucide-react";

export default function DeploymentSync() {
  const [remoteUrl, setRemoteUrl] = useState("https://crm.synergiemarketingroup.fr");
  const [comparison, setComparison] = useState<any>(null);
  const { toast } = useToast();

  // Récupérer les données locales
  const { data: localData, isLoading } = useQuery({
    queryKey: ["/api/deployment-sync/export"],
    queryFn: async () => {
      const response = await fetch("/api/deployment-sync/export");
      if (!response.ok) throw new Error("Erreur récupération données");
      return response.json();
    }
  });

  // Mutation pour comparer avec la version distante
  const compareMutation = useMutation({
    mutationFn: async () => {
      // Récupérer les données de la version distante
      const remoteResponse = await fetch(`${remoteUrl}/api/deployment-sync/export`);
      if (!remoteResponse.ok) {
        throw new Error(`Impossible de se connecter à ${remoteUrl}`);
      }
      const remoteData = await remoteResponse.json();

      // Comparer avec les données locales
      const compareResponse = await fetch("/api/deployment-sync/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(remoteData)
      });
      
      if (!compareResponse.ok) {
        throw new Error("Erreur comparaison données");
      }
      
      return compareResponse.json();
    },
    onSuccess: (result) => {
      setComparison(result);
      toast({
        title: "Comparaison terminée",
        description: "Analyse des données entre versions Admin et Vendeur"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur comparaison",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Synchronisation Versions Déployées</h1>
          <p className="text-gray-600">Comparaison entre tableaux Admin et Vendeur</p>
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Synchronisation</CardTitle>
          <CardDescription>URL de la version distante (Admin ou Vendeur)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="remote-url">URL Version Distante</Label>
            <Input
              id="remote-url"
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="https://crm.synergiemarketingroup.fr"
            />
          </div>
          <Button 
            onClick={() => compareMutation.mutate()}
            disabled={compareMutation.isPending}
          >
            {compareMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4 mr-2" />
            )}
            Comparer les Versions
          </Button>
        </CardContent>
      </Card>

      {/* Données version locale */}
      <Card>
        <CardHeader>
          <CardTitle>Version Locale</CardTitle>
          <CardDescription>Données authentiques de cette version</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Chargement des données authentiques...
            </div>
          ) : localData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{localData.stats.totalClients}</div>
                <div className="text-sm text-gray-600">Clients Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{localData.stats.totalSimCards}</div>
                <div className="text-sm text-gray-600">Cartes SIM</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{localData.stats.activatedSimCards}</div>
                <div className="text-sm text-gray-600">Activées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{localData.stats.availableSimCards}</div>
                <div className="text-sm text-gray-600">Disponibles</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Chargement des données authentiques...</div>
          )}
        </CardContent>
      </Card>

      {/* Résultats de comparaison */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats de Comparaison</CardTitle>
            <CardDescription>
              Analyse effectuée le {new Date(comparison.timestamp).toLocaleString('fr-FR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Version Locale</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Clients:</span>
                    <span className="font-medium">{comparison.local.totalClients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cartes SIM:</span>
                    <span className="font-medium">{comparison.local.totalSimCards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activées:</span>
                    <span className="font-medium">{comparison.local.activatedSimCards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disponibles:</span>
                    <span className="font-medium">{comparison.local.availableSimCards}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Version Distante</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Clients:</span>
                    <span className="font-medium">{comparison.remote.totalClients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cartes SIM:</span>
                    <span className="font-medium">{comparison.remote.totalSimCards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activées:</span>
                    <span className="font-medium">{comparison.remote.activatedSimCards || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disponibles:</span>
                    <span className="font-medium">{comparison.remote.availableSimCards || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* État de synchronisation */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">État de Synchronisation</h4>
              <div className="space-y-2">
                {comparison.differences.clientsDiff === 0 && comparison.differences.simCardsDiff === 0 ? (
                  <Badge variant="default" className="text-green-700 bg-green-100">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Données parfaitement synchronisées
                  </Badge>
                ) : (
                  <div className="space-y-2">
                    {comparison.differences.clientsDiff > 0 && (
                      <Badge variant="outline" className="text-orange-700 bg-orange-50">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Différence de {comparison.differences.clientsDiff} clients
                      </Badge>
                    )}
                    {comparison.differences.simCardsDiff > 0 && (
                      <Badge variant="outline" className="text-orange-700 bg-orange-50">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Différence de {comparison.differences.simCardsDiff} cartes SIM
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Informations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Information</h5>
              <p className="text-sm text-blue-800">
                Cette comparaison utilise uniquement les données authentiques stockées dans les bases de données. 
                Les différences peuvent indiquer une désynchronisation entre les versions Admin et Vendeur déployées.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}