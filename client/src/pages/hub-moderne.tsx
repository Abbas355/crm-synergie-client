import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Target, 
  MessageCircle, 
  Network, 
  User,
  TrendingUp,
  BarChart3,
  Calendar,
  Bell,
  Gift,
  FileText,
  Loader2,
  Trash2,
  CheckSquare,
  MapPin,
  Calculator,
  Mail
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState } from "react";

export default function HubModernePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loadingCard, setLoadingCard] = useState<number | null>(null);

  // Fonction pour vérifier si l'utilisateur est admin
  const isAdmin = () => {
    return user?.id === 1 || user?.id === 15;
  };

  // Navigation optimisée avec état de chargement
  const handleCardClick = (route: string, index: number) => {
    setLoadingCard(index);
    // Petite temporisation pour afficher l'état de chargement
    setTimeout(() => {
      setLocation(route);
      setLoadingCard(null);
    }, 150);
  };

  const baseHubItems = [
    {
      title: "Recrutement",
      description: "Gérer vos équipes",
      icon: Users,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500",
      route: "/recruitment"
    },
    {
      title: "Prospection",
      description: "Prospection terrain",
      icon: MapPin,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500",
      route: "/prospection"
    },
    {
      title: "Prospects", 
      description: "Gestion des prospects",
      icon: Users,
      color: "from-blue-500 to-indigo-600", 
      bgColor: "bg-blue-500",
      route: "/prospects"
    },
    {
      title: "Parrainage",
      description: "Programme client",
      icon: Gift,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-500",
      route: "/parrainage-clients"
    },
    {
      title: "Corbeille",
      description: "Clients supprimés",
      icon: Trash2,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-500",
      route: "/corbeille"
    }
  ];

  // Cartes réservées aux administrateurs
  const facturationItem = {
    title: "Facturation",
    description: "Gestion des paiements",
    icon: FileText,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500",
    route: "/admin/facturation"
  };

  const tachesItem = {
    title: "Tâches",
    description: "Gestion des tâches",
    icon: CheckSquare,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500",
    route: "/tasks"
  };

  // Carte Contrats réservée aux admins
  const contratsItem = {
    title: "Contrats",
    description: "Gestion documentaire",
    icon: FileText,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500",
    route: "/admin/contract-management"
  };

  // Carte Comptabilité réservée aux admins (remplace Prospection terrain)
  const comptabiliteItem = {
    title: "Comptabilité",
    description: "Gestion comptable",
    icon: Calculator,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-500",
    route: "/comptabilite"
  };

  // Ajouter une route protégée pour les contrats dans le hub admin
  const handleContractClick = () => {
    if (isAdmin()) {
      setLocation('/admin/contract-management');
    }
  };

  // Filtrer les cartes selon les permissions
  const hubItems = isAdmin() 
    ? [facturationItem, tachesItem, contratsItem, comptabiliteItem]  // Facturation, Tâches, Contrats, Comptabilité pour admin
    : baseHubItems.filter(item => item.title !== "Corbeille"); // Pour les vendeurs: Recrutement, Prospection, Prospects, Parrainage (sans Corbeille)

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
          
          {/* Header compact optimisé mobile */}
          <div className="text-center py-4 sm:py-8">
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-2 sm:mb-4">
              Bienvenue {user?.prenom || 'Eric'}
            </h1>
            <p className="text-slate-600 text-sm sm:text-xl font-medium">
              Hub central - Accès rapide à vos outils
            </p>
          </div>

          {/* Grille moderne des outils - 2 par ligne selon la capture d'écran */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-2xl mx-auto">
            {hubItems.map((item, index) => (
              <Card 
                key={index}
                className="group relative overflow-hidden bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => handleCardClick(item.route, index)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <CardContent className="p-4 sm:p-8 text-center relative z-10">
                  <div className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 ${item.bgColor} rounded-2xl flex items-center justify-center mb-3 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {loadingCard === index ? (
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
                    ) : (
                      <item.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    )}
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1 sm:mb-2 group-hover:text-orange-600 transition-colors duration-300">
                    {loadingCard === index ? "Chargement..." : item.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm font-medium">
                    {item.description}
                  </p>
                </CardContent>

                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </div>
              </Card>
            ))}
          </div>



          {/* Footer compact mobile */}
          <div className="text-center py-3 sm:py-6">
            <p className="text-slate-500 text-xs sm:text-sm">
              Dernière connexion aujourd'hui à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}