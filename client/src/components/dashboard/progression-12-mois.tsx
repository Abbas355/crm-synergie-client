import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface Progression12MoisData {
  currentYear: number;
  previousYear: number;
  data: Array<{
    month: string;
    currentYear: number;
    previousYear: number;
    monthIndex: number;
    year: number;
  }>;
  summary: {
    totalCurrentYear: number;
    totalPreviousYear: number;
    bestMonth: number;
    evolution: number;
  };
}

export function Progression12Mois() {
  const { data: progression12MoisData, isLoading: isLoadingProgression12Mois } = useQuery<Progression12MoisData>({
    queryKey: ['/api/analytics/progression-12-mois'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoadingProgression12Mois) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Progression 12 mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
            <div className="h-80 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progression12MoisData) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Progression 12 mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune donnée de progression disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          Progression 12 mois
          <span className="ml-2 text-sm text-gray-500 font-normal">
            Comparaison {progression12MoisData.currentYear} vs {progression12MoisData.previousYear}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Graphique courbe comparative */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progression12MoisData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickMargin={5}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickMargin={5}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: any, name: string) => [
                    value,
                    name === 'currentYear' ? progression12MoisData.currentYear : progression12MoisData.previousYear
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="currentYear" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="previousYear" 
                  stroke="#94A3B8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#94A3B8', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Métriques de comparaison */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progression12MoisData.summary?.totalCurrentYear || 0}
              </div>
              <div className="text-sm text-purple-700 font-medium">{progression12MoisData.currentYear}</div>
            </div>
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-slate-600">
                {progression12MoisData.summary?.totalPreviousYear || 0}
              </div>
              <div className="text-sm text-slate-700 font-medium">{progression12MoisData.previousYear}</div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {progression12MoisData.summary?.bestMonth || 0}
              </div>
              <div className="text-sm text-indigo-700 font-medium">Meilleur mois</div>
            </div>
            <div className={`bg-gradient-to-r rounded-xl p-4 text-center ${
              (progression12MoisData.summary?.evolution || 0) >= 0 
                ? 'from-green-50 to-green-100' 
                : 'from-red-50 to-red-100'
            }`}>
              <div className={`text-2xl font-bold ${
                (progression12MoisData.summary?.evolution || 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(progression12MoisData.summary?.evolution || 0) >= 0 ? '+' : ''}{progression12MoisData.summary?.evolution || 0}%
              </div>
              <div className={`text-sm font-medium ${
                (progression12MoisData.summary?.evolution || 0) >= 0 
                  ? 'text-green-700' 
                  : 'text-red-700'
              }`}>
                Évolution
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}