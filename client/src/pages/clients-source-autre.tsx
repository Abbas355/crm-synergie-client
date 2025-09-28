import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, ArrowLeft, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StandardizedClientTable } from "@/components/clients/standardized-client-table";
import type { Client } from "@shared/schema";

export default function ClientsSourceAutre() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients/source/autre'],
    queryFn: () => fetch('/api/clients/source/autre').then(res => res.json()) as Promise<Client[]>
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header avec bouton retour */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/parrainage-clients">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Clients Source "Autre"
                </h1>
                <p className="text-gray-600 mt-1">
                  Tous les clients avec la source "Autre"
                </p>
              </div>
            </div>
            <Link to="/parrainage-clients/nouveau-client-autre">
              <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Client
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-blue-600">{clients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Validés</p>
                <p className="text-2xl font-bold text-green-600">
                  {clients.filter(c => c.status !== 'Enregistré').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Installations</p>
                <p className="text-2xl font-bold text-purple-600">
                  {clients.filter(c => c.status === 'Installation').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des clients */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Aucun client avec la source "Autre"
              </h3>
              <p className="text-gray-500 mb-6">
                Commencez par créer votre premier client avec cette source.
              </p>
              <Link to="/parrainage-clients/nouveau-client-autre">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un client
                </Button>
              </Link>
            </div>
          ) : (
            <StandardizedClientTable clients={clients} />
          )}
        </div>
      </div>
    </div>
  );
}