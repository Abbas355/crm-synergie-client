import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, TrendingUp, Users, Percent, PieChart as PieChartIcon, Star, Table as TableIcon } from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { PageTitleHeader } from "@/components/layout/page-title-header";

type RecruitmentStats = {
  prospectsByStage: Record<string, number>;
  prospectsBySource: Record<string, number>;
  prospectsTimeline: {
    date: string;
    count: number;
  }[];
  recruitersPerformance: {
    id: number;
    nom: string;
    prenom: string;
    prospectsCount: number;
    conversionRate: number;
  }[];
  conversionRates: {
    stageFrom: string;
    stageTo: string;
    rate: number;
  }[];
  topPerformers: {
    id: number;
    nom: string;
    prenom: string;
    performance: number;
  }[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d884a8'];

export default function AnalyticsDashboardPage() {
  const [tab, setTab] = useState("apercu");
  
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["/api/recruitment/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/recruitment/analytics");
      if (!res.ok) throw new Error("Erreur lors de la récupération des statistiques");
      return res.json() as Promise<RecruitmentStats>;
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  // Transformer les données pour les graphiques
  const pieChartData = statsData?.prospectsByStage ? Object.entries(statsData.prospectsByStage).map(([name, value]) => ({
    name,
    value
  })) : [];
  
  const sourceChartData = statsData?.prospectsBySource ? Object.entries(statsData.prospectsBySource).map(([name, value]) => ({
    name: name === 'site_web' ? 'Site Web' : 
          name === 'réseaux_sociaux' ? 'Réseaux Sociaux' :
          name === 'recommandation' ? 'Recommandation' :
          name === 'salon' ? 'Salon Pro' :
          name === 'cold_calling' ? 'Démarchage' : 
          name === 'autre' ? 'Autre' : name,
    value
  })) : [];
  
  return (
    <div className="p-2 md:p-6 pb-16 md:pb-24">
      <PageTitleHeader 
        title="Tableau de Bord Analytique" 
        subtitle="Performances de votre équipe de recrutement"
        backLink="/"
        backIcon={<ArrowLeft className="h-5 w-5" />}
      />
      
      <Tabs defaultValue={tab} onValueChange={setTab} className="space-y-2 md:space-y-4 mt-2 md:mt-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="apercu" className="text-xs md:text-sm py-1 md:py-2">Aperçu</TabsTrigger>
          <TabsTrigger value="performances" className="text-xs md:text-sm py-1 md:py-2">Perfs.</TabsTrigger>
          <TabsTrigger value="conversion" className="text-xs md:text-sm py-1 md:py-2">Conv.</TabsTrigger>
          <TabsTrigger value="sources" className="text-xs md:text-sm py-1 md:py-2">Sources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="apercu" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-base">Total Prospects</CardTitle>
                </div>
                <CardDescription className="text-xs">Nombre total dans le système</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-2xl font-bold">
                  {statsData?.prospectsByStage ? 
                    Object.values(statsData.prospectsByStage).reduce((acc, curr) => acc + curr, 0) : 
                    "0"}
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-base">Prospects Actifs</CardTitle>
                </div>
                <CardDescription className="text-xs">En cours de traitement</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-2xl font-bold">
                  {statsData?.prospectsByStage ? 
                    (statsData.prospectsByStage['contacté'] || 0) + 
                    (statsData.prospectsByStage['entretien'] || 0) + 
                    (statsData.prospectsByStage['formation'] || 0) : 
                    "0"}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-base">Taux Conversion</CardTitle>
                </div>
                <CardDescription className="text-xs">Du contact à la validation</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-2xl font-bold">
                  {statsData?.prospectsByStage ? 
                    Math.round(
                      (((statsData.prospectsByStage['actif'] || 0) /
                      (Object.values(statsData.prospectsByStage).reduce((acc, curr) => acc + curr, 0) || 1)) * 100)
                    ) + "%" : 
                    "0%"}
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-base">Stades Variés</CardTitle>
                </div>
                <CardDescription className="text-xs">Distribution des stades</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-2xl font-bold">
                  {pieChartData.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-3 md:gap-4">
            <Card>
              <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-purple-500" />
                    <CardTitle className="text-base">Distribution par Stade</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Répartition des prospects</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-64 md:h-80 p-2 md:p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => {
                          if (typeof value === 'number') {
                            const total = Object.values(statsData?.prospectsByStage || {}).reduce((a, b) => a + b, 0) || 1;
                            const percentage = Math.round((value * 100) / total);
                            return [`${value} (${percentage}%)`];
                          }
                          return [value];
                        }} 
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center" 
                        wrapperStyle={{ fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <CardTitle className="text-base">Performances Recruteurs</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Nombre de prospects par recruteur</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-64 md:h-80 p-2 md:p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statsData?.recruitersPerformance || []}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 0,
                        bottom: 20,
                      }}
                      barSize={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey={d => `${d.prenom.slice(0, 3)}.${d.nom.charAt(0)}`} 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={25}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="prospectsCount" 
                        name="Prospects" 
                        fill="#8884d8" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performances" className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-base">Top Recruteurs</CardTitle>
                </div>
                <CardDescription className="text-xs">Meilleurs performeurs</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-2xl font-bold">
                  {statsData?.topPerformers ? statsData.topPerformers.length : 0}
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-base">Conv. Moyenne</CardTitle>
                </div>
                <CardDescription className="text-xs">Taux moyen par recruteur</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-2xl font-bold">
                  {statsData?.recruitersPerformance ? 
                    Math.round(statsData.recruitersPerformance.reduce((acc, curr) => acc + curr.conversionRate, 0) / 
                    (statsData.recruitersPerformance.length || 1)) + "%" : 
                    "0%"}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Card>
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-base">Classement des Recruteurs</CardTitle>
                </div>
                <CardDescription className="text-xs">Classement par nombre de prospects convertis</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <div className="h-60 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statsData?.topPerformers || []}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 15,
                        left: 5,
                        bottom: 5,
                      }}
                      barSize={15}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis 
                        dataKey={d => `${d.prenom.slice(0, 3)}.${d.nom.charAt(0)}`} 
                        type="category" 
                        tick={{ fontSize: 10 }} 
                        width={30} 
                        axisLine={false} 
                        tickLine={false}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="performance" 
                        name="Performance" 
                        fill="#82ca9d" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-base">Taux de Conversion</CardTitle>
                </div>
                <CardDescription className="text-xs">Pourcentage de prospects convertis par recruteur</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <div className="h-60 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statsData?.recruitersPerformance || []}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 0,
                        bottom: 20,
                      }}
                      barSize={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey={d => `${d.prenom.slice(0, 3)}.${d.nom.charAt(0)}`} 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tickFormatter={(value) => `${value}%`} 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Taux de conversion']} />
                      <Bar 
                        dataKey="conversionRate" 
                        name="Taux" 
                        fill="#FF8042"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="conversion" className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-base">Évolution</CardTitle>
                </div>
                <CardDescription className="text-xs">Nouveaux prospects/jour</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-2xl font-bold">
                  {statsData?.prospectsTimeline?.length ? 
                    Math.round(statsData.prospectsTimeline.reduce((acc, curr) => acc + curr.count, 0) / 
                      statsData.prospectsTimeline.length) : 
                    "0"}
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-base">Conv. Moyenne</CardTitle>
                </div>
                <CardDescription className="text-xs">Entre les stades clés</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-2xl font-bold">
                  {statsData?.conversionRates ? 
                    Math.round(statsData.conversionRates.reduce((acc, curr) => acc + curr.rate, 0) / 
                      (statsData.conversionRates.length || 1)) + "%" : 
                    "0%"}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Card>
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-base">Évolution des Prospects</CardTitle>
                </div>
                <CardDescription className="text-xs">Suivi des prospects dans le temps</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <div className="h-60 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={statsData?.prospectsTimeline || []}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        angle={-30}
                        height={50}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }} 
                        tickLine={false}
                        axisLine={false}
                        width={25}
                      />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Nouveaux Prospects" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-base">Conversion Entre Stades</CardTitle>
                </div>
                <CardDescription className="text-xs">Taux de progression entre stades</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <div className="h-60 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statsData?.conversionRates || []}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 40,
                      }}
                      barSize={15}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey={d => `${d.stageFrom.slice(0,3)} → ${d.stageTo.slice(0,3)}`} 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        angle={-30}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tickFormatter={(value) => `${value}%`} 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Taux']} />
                      <Bar 
                        dataKey="rate" 
                        name="Conversion" 
                        fill="#00C49F"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sources" className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-base">Total Sources</CardTitle>
                </div>
                <CardDescription className="text-xs">Canaux d'acquisition</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-2xl font-bold">
                  {sourceChartData.length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <CardTitle className="text-base">Source Principale</CardTitle>
                </div>
                <CardDescription className="text-xs">Meilleur canal d'acquisition</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-2xl font-bold">
                  {sourceChartData.length > 0 ? 
                    sourceChartData.reduce((max, curr) => curr.value > max.value ? curr : max, sourceChartData[0]).name : 
                    "Aucune"}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Card>
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-base">Sources des Prospects</CardTitle>
                </div>
                <CardDescription className="text-xs">Répartition par origine</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <div className="h-60 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {sourceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => {
                          if (typeof value === 'number') {
                            const total = sourceChartData.reduce((sum, source) => sum + source.value, 0) || 1;
                            const percentage = Math.round((value * 100) / total);
                            return [`${value} (${percentage}%)`];
                          }
                          return [value];
                        }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center" 
                        wrapperStyle={{ fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-base">Prospects par Source</CardTitle>
                </div>
                <CardDescription className="text-xs">Nombre de prospects par source d'acquisition</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <div className="h-60 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sourceChartData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 40,
                      }}
                      barSize={15}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={25}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="value" 
                        name="Prospects" 
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}