import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Activity, Target } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AnalyticsDashboard() {
  // Récupérer les données analytiques
  const { data: analytics = {}, isLoading } = useQuery({
    queryKey: ["/api/mlm/analytics"],
  });

  // Données par défaut si aucune donnée n'est disponible
  const ventes = (analytics as any)?.ventes || [];
  const commissions = (analytics as any)?.commissions || [];
  const distribution = (analytics as any)?.distribution || [];
  const performance = (analytics as any)?.performance || [];

  // Données de démonstration pour les graphiques
  const ventesData = ventes.length > 0 ? ventes : [
    { mois: 'Jan', ventes: 45, objectif: 50 },
    { mois: 'Fév', ventes: 52, objectif: 55 },
    { mois: 'Mar', ventes: 61, objectif: 60 },
    { mois: 'Avr', ventes: 58, objectif: 65 },
    { mois: 'Mai', ventes: 67, objectif: 70 },
    { mois: 'Jun', ventes: 73, objectif: 75 }
  ];

  const commissionsData = commissions.length > 0 ? commissions : [
    { mois: 'Jan', montant: 2400 },
    { mois: 'Fév', montant: 3200 },
    { mois: 'Mar', montant: 2800 },
    { mois: 'Avr', montant: 3500 },
    { mois: 'Mai', montant: 4100 },
    { mois: 'Jun', montant: 3800 }
  ];

  const distributionData = distribution.length > 0 ? distribution : [
    { niveau: 'Niveau 1', nombre: 12, pourcentage: 35 },
    { niveau: 'Niveau 2', nombre: 8, pourcentage: 25 },
    { niveau: 'Niveau 3', nombre: 6, pourcentage: 20 },
    { niveau: 'Niveau 4', nombre: 4, pourcentage: 15 },
    { niveau: 'Niveau 5', nombre: 2, pourcentage: 5 }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des données analytiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium">Total Distributeurs</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">32</div>
            <div className="text-xs text-green-600">+12% ce mois</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium">Ventes Totales</div>
            </div>
            <div className="text-2xl font-bold text-green-600">356</div>
            <div className="text-xs text-green-600">+8% ce mois</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div className="text-sm font-medium">Commissions</div>
            </div>
            <div className="text-2xl font-bold text-purple-600">€15,240</div>
            <div className="text-xs text-green-600">+15% ce mois</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-orange-600" />
              <div className="text-sm font-medium">Objectifs</div>
            </div>
            <div className="text-2xl font-bold text-orange-600">87%</div>
            <div className="text-xs text-orange-600">Atteints</div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Évolution des ventes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Évolution des Ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ventes" fill="#3B82F6" name="Ventes réelles" />
                <Bar dataKey="objectif" fill="#E5E7EB" name="Objectif" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Évolution des commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Commissions Mensuelles</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={commissionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip formatter={(value) => [`€${value}`, 'Commission']} />
                <Line type="monotone" dataKey="montant" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribution par niveau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribution par Niveau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Vue compacte en grille pour gérer jusqu'à 70 niveaux */}
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg">
              {distributionData.map((item, index) => {
                const color = COLORS[index % COLORS.length];
                const niveau = parseInt(item.niveau.replace('Niveau ', ''));
                
                return (
                  <div 
                    key={item.niveau} 
                    className="group relative"
                  >
                    <div 
                      className="w-full aspect-square rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold shadow-sm transition-all hover:shadow-md hover:scale-110 cursor-pointer"
                      style={{ 
                        backgroundColor: color,
                        background: `linear-gradient(135deg, ${color}, ${color}cc)`
                      }}
                    >
                      <div className="text-lg font-bold">{niveau}</div>
                      <div className="text-xs opacity-90">{item.nombre}</div>
                    </div>
                    
                    {/* Tooltip au hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Niveau {niveau}: {item.nombre} distributeur{item.nombre > 1 ? 's' : ''} ({item.pourcentage}%)
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Légende compacte */}
            <div className="flex items-center justify-between text-xs text-gray-600 px-2">
              <span>Niveaux 1-{distributionData.length}</span>
              <span>Distributeurs par niveau</span>
            </div>

            {/* Statistiques résumées */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-blue-900">
                  {distributionData.reduce((sum: number, item: any) => sum + item.nombre, 0)}
                </div>
                <div className="text-xs text-blue-700">Vendeurs</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-green-900">
                  {distributionData.length}
                </div>
                <div className="text-xs text-green-700">Niveaux</div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-purple-900">
                  {Math.max(...distributionData.map((item: any) => item.nombre))}
                </div>
                <div className="text-xs text-purple-700">Max/Niveau</div>
              </div>
            </div>

            {/* Top 5 niveaux les plus peuplés */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-800">Top 5 Niveaux</h4>
              <div className="space-y-1">
                {distributionData
                  .sort((a: any, b: any) => b.nombre - a.nombre)
                  .slice(0, 5)
                  .map((item: any, index: number) => {
                    const niveau = parseInt(item.niveau.replace('Niveau ', ''));
                    const originalIndex = distributionData.findIndex((d: any) => d.niveau === item.niveau);
                    const color = COLORS[originalIndex % COLORS.length];
                    
                    return (
                      <div key={item.niveau} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          ></div>
                          <span className="font-medium">Niveau {niveau}</span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded-full">
                              #1
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold">{item.nombre}</span>
                          <span className="text-xs text-gray-500">{item.pourcentage}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Message d'information pour les grands réseaux */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                💡 Format optimisé pour visualiser jusqu'à 70 niveaux hiérarchiques. 
                Survolez les carrés pour voir les détails de chaque niveau.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau de performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { nom: "Marie Dubois", ventes: 45, commissions: 2850, rang: 1 },
              { nom: "Jean Martin", ventes: 38, commissions: 2340, rang: 2 },
              { nom: "Sophie Laurent", ventes: 32, commissions: 1980, rang: 3 },
              { nom: "Pierre Moreau", ventes: 28, commissions: 1720, rang: 4 },
              { nom: "Anne Petit", ventes: 25, commissions: 1540, rang: 5 }
            ].map((performer) => (
              <div key={performer.nom} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {performer.rang}
                  </div>
                  <div>
                    <div className="font-medium">{performer.nom}</div>
                    <div className="text-sm text-gray-600">{performer.ventes} ventes</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">€{performer.commissions}</div>
                  <div className="text-sm text-gray-600">Commission</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}