import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from "lucide-react";

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

export function ProgressionCardCompact() {
  const { data: progression12MoisData, isLoading: isLoadingProgression12Mois, error } = useQuery<Progression12MoisData>({
    queryKey: ['/api/analytics/progression-12-mois'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });



  if (isLoadingProgression12Mois) {
    return (
      <div className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 min-h-[320px] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Progression 12 mois
            </h3>
            <p className="text-sm text-gray-600">Comparaison 2025 vs 2024</p>
          </div>
        </div>

        {/* Loading state */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
        </div>

        {/* Bottom metrics loading */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse mb-1"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!progression12MoisData) {
    return (
      <div className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 min-h-[320px] flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Progression 12 mois
            </h3>
            <p className="text-sm text-gray-600">Comparaison 2025 vs 2024</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Chargement des données...</p>
            {error && <p className="text-red-500 text-sm mt-2">Erreur: {error.message}</p>}
          </div>
        </div>
        

      </div>
    );
  }

  const { data, summary } = progression12MoisData;

  return (
    <div className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 min-h-[320px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Progression 12 mois
          </h3>
          <p className="text-sm text-gray-600">Comparaison 2025 vs 2024</p>
        </div>
      </div>

      {/* Graphique compact */}
      <div className="flex-1 min-h-[160px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="currentYear" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 4, stroke: '#8B5CF6', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="previousYear" 
              stroke="#D1D5DB" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#D1D5DB', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 4, stroke: '#D1D5DB', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Métriques en bas */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3">
          <div className="text-xl font-bold text-purple-600">
            {summary.totalCurrentYear}
          </div>
          <div className="text-xs text-gray-600">2025</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3">
          <div className="text-xl font-bold text-gray-600">
            {summary.totalPreviousYear}
          </div>
          <div className="text-xs text-gray-600">2024</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
          <div className="text-xl font-bold text-green-600">
            {summary.evolution > 0 ? '+' : ''}{summary.evolution}%
          </div>
          <div className="text-xs text-gray-600">Evolution</div>
        </div>
      </div>
    </div>
  );
}