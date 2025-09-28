import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

export function ProgressionCardCompactV2() {
  const { data, isLoading, error } = useQuery<Progression12MoisData>({
    queryKey: ['/api/analytics/progression-12-mois'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 sm:p-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="p-1.5 bg-white/20 rounded-full">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            Progression 12 mois
          </CardTitle>
          <CardDescription className="text-indigo-100 mt-1 text-xs sm:text-sm">
            Comparaison 2025 vs 2024
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="h-48 sm:h-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-3 sm:p-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="p-1.5 bg-white/20 rounded-full">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            Progression 12 mois
          </CardTitle>
          <CardDescription className="text-red-100 mt-1 text-xs sm:text-sm">
            Erreur de chargement
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="text-center text-red-500 py-8">
            <p>Erreur: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 sm:p-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="p-1.5 bg-white/20 rounded-full">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            Progression 12 mois
          </CardTitle>
          <CardDescription className="text-indigo-100 mt-1 text-xs sm:text-sm">
            Aucune donnée disponible
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="text-center text-gray-500 py-8">
            <p>Aucune donnée de progression disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 sm:p-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="p-1.5 bg-white/20 rounded-full">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          Progression 12 mois
        </CardTitle>
        <CardDescription className="text-indigo-100 mt-1 text-xs sm:text-sm">
          Comparaison {data.currentYear} vs {data.previousYear}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          {/* Graphique de progression linéaire */}
          <div className="relative h-48 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#666' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#666' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [`${value} ventes`, name === 'currentYear' ? data.currentYear : data.previousYear]}
                />
                <Line 
                  type="monotone" 
                  dataKey="currentYear" 
                  stroke="#6366F1" 
                  strokeWidth={3}
                  dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#6366F1', strokeWidth: 2, fill: '#fff' }}
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

          {/* Stats résumées ultra-compactes */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-md p-1.5 text-center">
              <div className="text-sm font-bold text-indigo-600">
                {data.summary.totalCurrentYear}
              </div>
              <div className="text-xs text-indigo-700 font-medium leading-tight">{data.currentYear}</div>
            </div>
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-md p-1.5 text-center">
              <div className="text-sm font-bold text-slate-600">
                {data.summary.totalPreviousYear}
              </div>
              <div className="text-xs text-slate-700 font-medium leading-tight">{data.previousYear}</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-md p-1.5 text-center">
              <div className="text-sm font-bold text-purple-600">
                +{data.summary.evolution}%
              </div>
              <div className="text-xs text-purple-700 font-medium leading-tight">Évolution</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}