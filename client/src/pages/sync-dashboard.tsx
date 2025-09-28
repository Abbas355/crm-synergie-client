import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Upload, AlertCircle, CheckCircle } from "lucide-react";

interface SyncReport {
  timestamp: string;
  local: {
    clients: number;
    simCards: number;
  };
  remote: {
    clients: number;
    simCards: number;
  };
  differences: {
    clientsDiff: number;
    simCardsDiff: number;
  };
  recommendations: string[];
}

export default function SyncDashboard() {
  const [remoteUrl, setRemoteUrl] = useState("https://crm.synergiemarketingroup.fr");
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les statistiques locales
  const { data: localStats, isLoading: loadingLocal } = useQuery({
    queryKey: ["/api/sync/export"],
    queryFn: async () => {
      const response = await fetch("/api/sync/export");
      if (!response.ok) throw new Error("Erreur récupération données locales");
      return response.json();
    }
  });

  // Mutation pour générer un rapport de synchronisation
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      // Récupérer les données distantes
      const remoteResponse = await fetch(`${remoteUrl}/api/sync/export`);
      if (!remoteResponse.ok) {
        throw new Error(`Impossible de se connecter à ${remoteUrl}`);
      }
      const remoteData = await remoteResponse.json();

      // Générer le rapport
      const reportResponse = await fetch("/api/sync/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(remoteData)
      });
      
      if (!reportResponse.ok) {
        throw new Error("Erreur génération rapport");
      }
      
      return reportResponse.json();
    },
    onSuccess: (report) => {
      setSyncReport(report);
      toast({
        title: "Rapport généré",
        description: "Analyse des différences terminée"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur rapport",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation pour synchronisation bidirectionnelle
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/sync/bidirectional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remoteEndpoint: remoteUrl })
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la synchronisation");
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sync/export"] });
      
      toast({
        title: "Synchronisation réussie",
        description: result.message
      });
      
      // Regénérer le rapport après sync
      generateReportMutation.mutate();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur synchronisation",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerateReport = () => {
    generateReportMutation.mutate();
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Synchronisation des Données</h1>
          <p className="text-gray-600">Synchronisation entre versions Admin et Vendeur</p>
        </div>
      </div>

      {/* Configuration de l'URL distante */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>URL de la version distante à synchroniser</CardDescription>
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
            onClick={handleGenerateReport}
            disabled={generateReportMutation.isPending}
          >
            {generateReportMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Analyser les Différences
          </Button>
        </CardContent>
      </Card>

      {/* Statistiques locales */}
      <Card>
        <CardHeader>
          <CardTitle>Données Locales</CardTitle>
          <CardDescription>État actuel de cette version</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLocal ? (
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Chargement...
            </div>
          ) : localStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{localStats.stats?.totalClients || 0}</div>
                <div className="text-sm text-gray-600">Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{localStats.stats?.totalSimCards || 0}</div>
                <div className="text-sm text-gray-600">Cartes SIM</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Aucune donnée disponible</div>
          )}
        </CardContent>
      </Card>

      {/* Rapport de synchronisation */}
      {syncReport && (
        <Card>
          <CardHeader>
            <CardTitle>Rapport d'Analyse</CardTitle>
            <CardDescription>
              Analyse effectuée le {new Date(syncReport.timestamp).toLocaleString('fr-FR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Version Locale</h4>
                <div className="space-y-1 text-sm">
                  <div>Clients: {syncReport.local.clients}</div>
                  <div>Cartes SIM: {syncReport.local.simCards}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Version Distante</h4>
                <div className="space-y-1 text-sm">
                  <div>Clients: {syncReport.remote.clients}</div>
                  <div>Cartes SIM: {syncReport.remote.simCards}</div>
                </div>
              </div>
            </div>

            {/* Différences détectées */}
            <div>
              <h4 className="font-semibold mb-2">Différences Détectées</h4>
              <div className="space-y-2">
                {syncReport.differences.clientsDiff > 0 && (
                  <Badge variant="outline" className="mr-2">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {syncReport.differences.clientsDiff} clients de différence
                  </Badge>
                )}
                {syncReport.differences.simCardsDiff > 0 && (
                  <Badge variant="outline" className="mr-2">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {syncReport.differences.simCardsDiff} cartes SIM de différence
                  </Badge>
                )}
                {syncReport.differences.clientsDiff === 0 && syncReport.differences.simCardsDiff === 0 && (
                  <Badge variant="default">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Données synchronisées
                  </Badge>
                )}
              </div>
            </div>

            {/* Recommandations */}
            <div>
              <h4 className="font-semibold mb-2">Recommandations</h4>
              <ul className="space-y-1 text-sm">
                {syncReport.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bouton de synchronisation */}
            {(syncReport.differences.clientsDiff > 0 || syncReport.differences.simCardsDiff > 0) && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleSync}
                  disabled={syncMutation.isPending}
                  className="w-full"
                >
                  {syncMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Synchroniser les Données
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}