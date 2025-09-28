import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MapPin, TrendingUp, TrendingDown, Users, Calendar, Target, BarChart3, Clock, Percent } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AnalyseData {
  ville: string;
  totalVisites: number;
  totalSignatures: number;
  totalRDV: number;
  totalAbsents: number;
  totalRefus: number;
  tauxSignature: number;
  tauxRDV: number;
  tauxAbsence: number;
  sessions: Array<{
    id: number;
    date: string;
    adresse: string;
    statut: string;
    visites: number;
    signatures: number;
    rdv: number;
    absents: number;
    refus: number;
  }>;
}

const COLORS = {
  signatures: '#22c55e',
  rdv: '#3b82f6', 
  absents: '#f59e0b',
  refus: '#ef4444',
  visites: '#8b5cf6'
};

export default function AnalyseVillePage() {
  const [selectedVille, setSelectedVille] = useState<string>("all");
  // Affichage uniquement en barres selon les spécifications

  const { data: analyseData, isLoading, error } = useQuery<AnalyseData[]>({
    queryKey: ["/api/analyse-ville", selectedVille],
    enabled: true
  });

  // Debug temporaire supprimé

  // Gestion d'erreur d'authentification
  if (error) {
    console.error("Erreur lors du chargement des données d'analyse:", error);
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur de chargement</h1>
              <p className="text-gray-600 mb-4">Impossible de charger les données d'analyse par ville.</p>
              <p className="text-sm text-gray-500">Erreur: {error.message}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const villes = analyseData ? Array.from(new Set(analyseData.map(item => item.ville))) : [];
  const dataToShow = selectedVille === "all" ? analyseData : analyseData?.filter(item => item.ville === selectedVille);

  // Si pas de données ou données vides
  if (!isLoading && (!analyseData || analyseData.length === 0)) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Aucune donnée d'analyse</h1>
              <p className="text-gray-600 mb-4">Il n'y a pas encore de sessions de prospection terrain enregistrées.</p>
              <p className="text-sm text-gray-500 mb-4">Créez des sessions de prospection pour voir les analyses par ville.</p>
              <button 
                onClick={() => window.location.href = '/prospection-terrain'} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Aller à Prospection Terrain
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Calcul des totaux
  const totaux = dataToShow?.reduce((acc, item) => ({
    visites: acc.visites + item.totalVisites,
    signatures: acc.signatures + item.totalSignatures,
    rdv: acc.rdv + item.totalRDV,
    absents: acc.absents + item.totalAbsents,
    refus: acc.refus + item.totalRefus
  }), { visites: 0, signatures: 0, rdv: 0, absents: 0, refus: 0 }) || { visites: 0, signatures: 0, rdv: 0, absents: 0, refus: 0 };

  // Calcul du taux de signature (nombre de visites nécessaires pour une signature)
  const tauxSignature = totaux.signatures > 0 ? (totaux.visites / totaux.signatures).toFixed(1) : "N/A";

  // Données pour graphique en barres uniquement
  const barData = dataToShow?.map(item => ({
    ville: item.ville,
    Visites: item.totalVisites,
    Signatures: item.totalSignatures,
    RDV: item.totalRDV,
    Absents: item.totalAbsents,
    Refus: item.totalRefus
  })) || [];

  // Calculs terminés, rendu principal

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Analyse par Ville
            </h1>
            <p className="text-gray-600 mt-1">Graphiques et analyses détaillées de performance</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={selectedVille} onValueChange={setSelectedVille}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Sélectionner une ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📊 Toutes les villes</SelectItem>
                {villes.map(ville => (
                  <SelectItem key={ville} value={ville}>
                    <MapPin className="h-4 w-4 inline mr-2" />
                    {ville}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Affichage uniquement en barres - sélecteur supprimé */}
          </div>
        </div>

        {/* Cartes de synthèse compactes - 6 cartes */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs">Total Visites</p>
                  <p className="text-xl font-bold">{totaux.visites}</p>
                </div>
                <Users className="h-6 w-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs">Signatures</p>
                  <p className="text-xl font-bold">{totaux.signatures}</p>
                </div>
                <Target className="h-6 w-6 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-xs">RDV</p>
                  <p className="text-xl font-bold">{totaux.rdv}</p>
                </div>
                <Calendar className="h-6 w-6 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs">Absents</p>
                  <p className="text-xl font-bold">{totaux.absents}</p>
                </div>
                <Clock className="h-6 w-6 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-xs">Refus</p>
                  <p className="text-xl font-bold">{totaux.refus}</p>
                </div>
                <TrendingDown className="h-6 w-6 text-red-200" />
              </div>
            </CardContent>
          </Card>

          {/* 6ème carte - Taux de signature */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs">Taux Signature</p>
                  <p className="text-xl font-bold">{tauxSignature}</p>
                  <p className="text-purple-200 text-xs">visites/signature</p>
                </div>
                <Percent className="h-6 w-6 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique principal */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Analyse des Performances
              {selectedVille !== "all" && (
                <Badge variant="secondary" className="ml-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  {selectedVille}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Répartition des résultats de prospection par ville
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="ville" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Visites" fill={COLORS.visites} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Signatures" fill={COLORS.signatures} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="RDV" fill={COLORS.rdv} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Absents" fill={COLORS.absents} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Refus" fill={COLORS.refus} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tableau détaillé par ville */}
        {selectedVille === "all" && dataToShow && dataToShow.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle>Détail par Ville</CardTitle>
              <CardDescription>Performance détaillée de chaque ville</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-semibold">Ville</th>
                      <th className="text-center p-3 font-semibold">Visites</th>
                      <th className="text-center p-3 font-semibold">Signatures</th>
                      <th className="text-center p-3 font-semibold">RDV</th>
                      <th className="text-center p-3 font-semibold">Absents</th>
                      <th className="text-center p-3 font-semibold">Taux Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataToShow.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.ville}</td>
                        <td className="p-3 text-center">{item.totalVisites}</td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {item.totalSignatures}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {item.totalRDV}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">{item.totalAbsents}</td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant={item.tauxSignature > 15 ? "default" : "secondary"}
                            className={item.tauxSignature > 15 ? "bg-green-600" : "bg-gray-400"}
                          >
                            {item.tauxSignature.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </AppLayout>
  );
}