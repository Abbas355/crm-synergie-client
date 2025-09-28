import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, StandardizedTabsList, StandardizedTabsTrigger } from "@/components/ui/standardized-tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { useClientSync } from "@/hooks/useClientSync";
import { ClientMissingFields } from "./client-missing-fields";
import { formatDateForDisplay } from "@/utils/dateUtils";
import {
  ArrowLeft,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  Settings,
  Wrench,
  AlertCircle,
  Loader2,
  Wifi,
  CreditCard,
  FileText,
  MessageSquare
} from "lucide-react";

interface ClientDetailData {
  id: number;
  name: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  produit: string;
  status: string;
  codeVendeur: string;
  dateSignature: string;
  identifiantContrat: string;
  codePostal: string;
  adresse: string;
  ville: string;
  dateRendezVous: string | null;
  dateInstallation: string;
  civilite: string;
  dateNaissance: string;
  portabilite: string;
  carteSim: string;
  numeroPorter: string;
  source: string;
  commentaire: string;
  createdAt: string;
}

interface ClientDetailMobileProps {
  clientId: string;
  onBack: () => void;
  onEdit: () => void;
}

export function ClientDetailMobile({ clientId, onBack, onEdit }: ClientDetailMobileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { triggerSync } = useClientSync(clientId);

  const { data: client, isLoading, error, refetch } = useQuery<ClientDetailData>({
    queryKey: ["/api/clients", clientId],
    queryFn: async () => {
      console.log(`Frontend: Tentative de récupération du client ID: ${clientId}`);
      
      // Cache busting avec timestamp
      const timestamp = Date.now();
      const response = await fetch(`/api/clients/${clientId}?_t=${timestamp}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log(`Frontend: Réponse reçue - Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Frontend: Erreur ${response.status}: ${errorText}`);
        throw new Error(`${response.status}: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Frontend: Données client reçues:`, data);
      console.log('🔍 Frontend: Champs critiques reçus:', {
        dateNaissance: data.dateNaissance,
        identifiantContrat: data.identifiantContrat,
        codePostal: data.codePostal,
        hasDateNaissance: !!data.dateNaissance,
        hasIdentifiantContrat: !!data.identifiantContrat,
        hasCodePostal: !!data.codePostal
      });
      return data;
    },
    enabled: !!clientId,
    retry: false,
    staleTime: 0, // Toujours considérer les données comme obsolètes
    gcTime: 0, // Pas de cache
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non défini";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return date.toLocaleDateString('fr-FR');
    } catch {
      return "Date invalide";
    }
  };

  const formatDateRequired = (dateString: string | null, fieldName: string) => {
    if (!dateString || dateString === "" || dateString === "null") return `${fieldName} manquante`;
    
    // Si c'est déjà au format français DD/MM/YYYY, on le retourne tel quel
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return date.toLocaleDateString('fr-FR');
    } catch {
      return "Date invalide";
    }
  };

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom?.charAt(0) || ''}${nom?.charAt(0) || ''}`.toUpperCase();
  };

  const getProductIcon = (produit: string) => {
    if (produit?.includes('Forfait')) return <Wifi className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-600">Chargement des détails du client...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Client introuvable</h2>
        <p className="text-gray-600 mb-4 text-center">Le client demandé n'existe pas ou n'est plus accessible.</p>
        <Button onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 mobile-safe-area">
      <div className="max-w-2xl mx-auto p-4 space-y-4 flex flex-col items-center">
        {/* Header mobile optimisé */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl w-full max-w-md">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <Button variant="outline" size="sm" onClick={onBack} className="flex-shrink-0 h-8">
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="text-xs">Retour</span>
              </Button>
              {isAdmin() && (
                <Button size="sm" onClick={onEdit} className="flex-shrink-0 h-8">
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="text-xs">Modifier</span>
                </Button>
              )}
            </div>
            
            <div className="flex items-start space-x-3 mb-4">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarFallback className="text-sm font-semibold bg-primary text-white">
                  {getInitials(client.prenom, client.nom)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {client.prenom} {client.nom}
                </h1>
                <p className="text-sm text-gray-600 truncate">{client.email}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={client.status} />
              <Badge variant="outline" className="flex items-center space-x-1 text-xs">
                {getProductIcon(client.produit)}
                <span className="truncate">{client.produit || "Non défini"}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Onglets optimisés mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
          <StandardizedTabsList variant="blue" className="grid w-full grid-cols-3 h-12">
            <StandardizedTabsTrigger value="overview" variant="blue" icon={<User className="h-4 w-4" />}>
              <span className="hidden sm:inline">Vue</span>
              <span className="sm:hidden">Vue</span>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="contact" variant="blue" icon={<Phone className="h-4 w-4" />}>
              <span className="hidden sm:inline">Contact</span>
              <span className="sm:hidden">Contact</span>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="contract" variant="blue" icon={<FileText className="h-4 w-4" />}>
              <span className="hidden sm:inline">Contrat</span>
              <span className="sm:hidden">Contrat</span>
            </StandardizedTabsTrigger>
          </StandardizedTabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Composant pour les champs manquants */}
            <ClientMissingFields 
              client={client} 
              onUpdate={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
              }}
            />
            
            {/* Informations générales */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <User className="h-4 w-4" />
                  <span>Informations générales</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Civilité</label>
                    <p className="font-medium text-sm">{client.civilite}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Date de naissance</label>
                    <p className="font-medium text-sm">{formatDateForDisplay(client.dateNaissance) || "Date manquante"}</p>
                  </div>
                  {/* Code vendeur - visible uniquement pour les admins */}
                  {isAdmin() && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 block mb-1">Code vendeur</label>
                      <p className="font-medium text-sm font-mono">{client.codeVendeur || "Non défini"}</p>
                    </div>
                  )}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Source</label>
                    <p className="font-medium text-sm">{client.source || "recommandation"}</p>
                  </div>
                </div>
                <Separator />
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 block mb-2">Commentaire</label>
                  <p className="text-sm text-center">{client.commentaire || "Aucun commentaire"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Suivi commercial */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Calendar className="h-4 w-4" />
                  <span>Suivi commercial</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium">Date de signature</span>
                  </div>
                  <span className="text-xs">{formatDate(client.dateSignature)}</span>
                </div>
                
                {/* TOUJOURS afficher la date de rendez-vous si elle existe (traçabilité complète) */}
                {client.dateRendezVous && (
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-xs font-medium">
                        {client.dateInstallation ? "Rendez-vous (passé)" : "Date de rendez-vous"}
                      </span>
                    </div>
                    <span className="text-xs">{formatDate(client.dateRendezVous)}</span>
                  </div>
                )}
                
                {/* TOUJOURS afficher la date d'installation si elle existe */}
                {client.dateInstallation && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium">Date d'installation</span>
                    </div>
                    <span className="text-xs">{formatDate(client.dateInstallation)}</span>
                  </div>
                )}
                

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            {/* Informations de contact */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Mail className="h-4 w-4" />
                  <span>Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                  <p className="font-medium text-sm">{client.email}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Téléphone</label>
                  <p className="font-medium text-sm">{client.telephone}</p>
                </div>
                <Separator />
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 block mb-2">Adresse complète</label>
                  <p className="text-sm text-center">{client.adresse}</p>
                  <p className="text-sm text-center font-medium">{client.codePostal} {client.ville}</p>
                </div>
              </CardContent>
            </Card>

            {/* Informations techniques */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Settings className="h-4 w-4" />
                  <span>Technique</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Produit</label>
                    <p className="font-medium text-sm">{client.produit}</p>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Identifiant contrat</label>
                    <p className="font-medium text-sm font-mono">{client.identifiantContrat}</p>
                  </div>
                  {client.carteSim && client.produit?.includes('Forfait') && (
                    <div className="text-center p-3 bg-cyan-50 rounded-lg" key={`sim-tech-${client.id}-${client.carteSim}-${Date.now()}`}>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Carte SIM</label>
                      <p className="font-medium text-sm font-mono">{client.carteSim}</p>
                    </div>
                  )}
                  {/* Afficher Portabilité seulement pour les forfaits 5G, pas pour les Freebox */}
                  {client.produit?.includes('Forfait') && (
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 block mb-1">Portabilité</label>
                      <p className="font-medium text-sm">{client.portabilite || "Non"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract" className="space-y-4">
            {/* Informations contractuelles */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <FileText className="h-4 w-4" />
                  <span>Informations contractuelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Produit</label>
                    <p className="font-medium text-sm">{client.produit}</p>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Identifiant contrat</label>
                    <p className="font-medium text-sm font-mono">{client.identifiantContrat}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-2">Statut</label>
                    <div className="flex justify-center">
                      <StatusBadge status={client.status} />
                    </div>
                  </div>
                  {client.carteSim && client.produit?.includes('Forfait') && (
                    <div className="text-center p-3 bg-cyan-50 rounded-lg" key={`sim-contract-${client.id}-${client.carteSim}-${Date.now()}`}>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Carte SIM</label>
                      <p className="font-medium text-sm font-mono">{client.carteSim}</p>
                    </div>
                  )}
                  {/* Afficher Portabilité seulement pour les forfaits 5G, pas pour les Freebox */}
                  {client.produit?.includes('Forfait') && (
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 block mb-1">Portabilité</label>
                      <p className="font-medium text-sm">{client.portabilite || "Non"}</p>
                    </div>
                  )}
                  {client.numeroPorter && client.produit?.includes('Forfait') && (
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 block mb-1">Numéro à porter</label>
                      <p className="font-medium text-sm font-mono">{client.numeroPorter}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dates importantes */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Calendar className="h-4 w-4" />
                  <span>Dates importantes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {client.dateSignature && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">Signature</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(client.dateSignature)}
                    </span>
                  </div>
                )}
                
                {/* ✅ AMÉLIORATION : Conservation historique des dates de rendez-vous */}
                {client.dateRendezVous && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium">
                        {client.dateInstallation ? "Rendez-vous (passé)" : "Rendez-vous"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(client.dateRendezVous)}
                    </span>
                  </div>
                )}
                
                {client.dateInstallation && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium">Installation</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(client.dateInstallation)}
                    </span>
                  </div>
                )}

                {/* ✅ AMÉLIORATION : Affichage chronologique si les deux dates existent */}
                {client.dateRendezVous && client.dateInstallation && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 text-blue-600 mr-2" />
                      <span className="text-xs text-blue-700 font-medium">
                        Suivi complet : RDV {formatDate(client.dateRendezVous)} → Installation {formatDate(client.dateInstallation)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commentaires */}
            {client.commentaire && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <MessageSquare className="h-4 w-4" />
                    <span>Notes & Commentaires</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                    <p className="text-sm text-gray-700">{client.commentaire}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Espace supplémentaire pour navigation mobile */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}