import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardizedTabsList, StandardizedTabsTrigger } from "@/components/ui/standardized-tabs";
import TaskAutomation from "@/components/tasks/TaskAutomation";
import { useToast } from "@/hooks/use-toast";
import { Search, Bot, ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  clientName?: string;
  userName?: string;
  category: string;
  estimatedDuration?: number;
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Récupération des tâches
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    retry: false
  });

  // Statistiques des tâches
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  return (
    <AppLayout>
      <div className="page-scroll-container bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 md:p-6">
        <div className="page-content-wrapper">
        {/* En-tête optimisé - Mobile centré, Desktop horizontal */}
        <div className="mb-6">
          {/* Version Mobile - Centrée */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/')}
                className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Retour</span>
              </Button>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                Gestion des tâches
              </h1>
              <p className="text-gray-600 text-xs">Visualisez et gérez toutes vos tâches</p>
            </div>
          </div>

          {/* Version Desktop/Tablette - Horizontale et compacte */}
          <div className="hidden md:flex md:items-center md:justify-between md:mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/')}
                className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </Button>
              
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                  Gestion des Tâches
                </h1>
                <div className="h-6 w-px bg-gray-300"></div>
                <p className="text-gray-600 text-sm">Organisez et suivez vos tâches efficacement</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setActiveTab('automation')}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle tâche</span>
            </Button>
          </div>
        </div>



        {/* Onglets - Design mobile optimisé */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <StandardizedTabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1" variant="blue">
            <StandardizedTabsTrigger value="all" variant="blue">
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">{stats.total}</span>
                <span className="text-xs opacity-90">Toutes</span>
              </div>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="pending" variant="blue">
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">{stats.pending}</span>
                <span className="text-xs opacity-90">Attente</span>
              </div>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="in_progress" variant="blue">
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">{stats.inProgress}</span>
                <span className="text-xs opacity-90">Cours</span>
              </div>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="completed" variant="blue">
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">{stats.completed}</span>
                <span className="text-xs opacity-90">Fini</span>
              </div>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="automation" variant="blue" icon={<Bot className="h-4 w-4" />}>
              <div className="flex items-center justify-center gap-2">
                <span className="font-medium">Automatisation</span>
              </div>
            </StandardizedTabsTrigger>
          </StandardizedTabsList>

          <TabsContent value="automation" className="mt-6">
            <TaskAutomation />
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-4 md:p-6">
                <div className="text-center py-6 md:py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Toutes les tâches</h3>
                  <p className="text-gray-600 text-sm">Affichage de toutes vos tâches</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-4 md:p-6">
                <div className="text-center py-6 md:py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-amber-600">{stats.pending}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Tâches en attente</h3>
                  <p className="text-gray-600 text-sm">Tâches à traiter prochainement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in_progress" className="mt-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-4 md:p-6">
                <div className="text-center py-6 md:py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">{stats.inProgress}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Tâches en cours</h3>
                  <p className="text-gray-600 text-sm">Tâches actuellement en traitement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-4 md:p-6">
                <div className="text-center py-6 md:py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">{stats.completed}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Tâches terminées</h3>
                  <p className="text-gray-600 text-sm">Tâches accomplies avec succès</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}