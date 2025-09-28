import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  User, 
  CreditCard, 
  FileText,
  Edit,
  ArrowLeft,
  Smartphone as Sim,
  Router,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Hash,
  Globe,
  Smartphone,
  History,
  Activity,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLocation } from "wouter";
import { useRole } from "@/hooks/use-role";
import { ContractValidationSuccess } from "./contract-validation-success";

interface ClientDetailData {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  status: string;
  civilite: string;
  dateNaissance: string;
  identifiantContrat: string;
  codeVendeur: string;
  produit: string;
  dateSignature: string;
  dateRendezVous: string;
  dateInstallation: string;
  carteSim: string;
  portabilite: string;
  numeroPorter: string;
  source: string;
  commentaire: string;
  createdAt: string;
  updatedAt: string;
  carteSIMDetails?: {
    id: number;
    iccid: string;
    status: string;
    dateAttribution: string;
    dateActivation: string;
    codeVendeur: string;
  };
  activities?: Activity[];
  tasks?: Task[];
}

interface Activity {
  id: number;
  type: string;
  description: string;
  createdAt: string;
  userId: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
}

interface ClientDetailEnhancedProps {
  clientId: number;
  onEdit: () => void;
  onBack: () => void;
}

export function ClientDetailEnhanced({ clientId, onEdit, onBack }: ClientDetailEnhancedProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [, setLocation] = useLocation();
  const [showCongratulations, setShowCongratulations] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useRole();

  const { data: client, isLoading, error } = useQuery<ClientDetailData>({
    queryKey: ["/api/clients", clientId],
    queryFn: async () => {
      console.log(`Frontend: Tentative de récupération du client ID: ${clientId}`);
      
      const response = await fetch(`/api/clients/${clientId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
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
      return data;
    },
    enabled: !!clientId,
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      await apiRequest("PATCH", `/api/clients/${clientId}`, { status });
      return { status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      
      // Afficher le message de félicitations si le contrat est validé
      if (data.status === "valide") {
        setShowCongratulations(true);
      } else {
        toast({
          title: "Statut mis à jour",
          description: "Le statut du client a été modifié avec succès",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString === "null") return "Non défini";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const formatDateRequired = (dateString?: string, fieldName: string) => {
    if (!dateString || dateString === "null") return `${fieldName} manquante`;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, "dd/MM/yyyy", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Non défini";
    try {
      return format(new Date(dateString), "dd/MM/yyyy à HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const getInitials = (prenom?: string, nom?: string) => {
    return `${prenom?.charAt(0) || ''}${nom?.charAt(0) || ''}`.toUpperCase();
  };

  const getProductIcon = (produit?: string) => {
    if (produit?.toLowerCase().includes('forfait')) return <Smartphone className="h-4 w-4" />;
    if (produit?.toLowerCase().includes('freebox')) return <Router className="h-4 w-4" />;
    return <Globe className="h-4 w-4" />;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'nouveau': return 'bg-blue-100 text-blue-800';
      case 'valide': return 'bg-yellow-400 text-black';
      case 'rendez-vous': return 'bg-green-100 text-green-800';
      case 'installation': return 'bg-green-200 text-green-900';
      case 'resiliation': return 'bg-red-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Client introuvable</h2>
        <p className="text-gray-600 mb-4">Le client demandé n'existe pas ou n'est plus accessible.</p>
        <Button onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
        {/* Header avec informations principales - Mobile optimisé */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 sm:pt-6">
            {/* Version mobile : layout vertical */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={onBack} className="flex-shrink-0">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">Retour</span>
                </Button>
                {isAdmin() && (
                  <Button size="sm" onClick={onEdit} className="flex-shrink-0">
                    <Edit className="h-4 w-4 mr-1" />
                    <span className="hidden xs:inline">Modifier</span>
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
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    {client.prenom} {client.nom}
                  </h1>
                  <p className="text-sm text-gray-600 truncate">{client.email}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={client.status} />
                <Badge variant="outline" className="flex items-center space-x-1 text-xs">
                  {getProductIcon(client.produit)}
                  <span className="truncate max-w-[120px]">{client.produit || "Non défini"}</span>
                </Badge>
              </div>
            </div>

            {/* Version desktop : layout horizontal */}
            <div className="hidden sm:flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg font-semibold bg-primary text-white">
                    {getInitials(client.prenom, client.nom)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {client.prenom} {client.nom}
                  </h1>
                  <p className="text-gray-600">{client.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <StatusBadge status={client.status} />
                    <Badge variant="outline" className="flex items-center space-x-1">
                      {getProductIcon(client.produit)}
                      <span>{client.produit || "Non défini"}</span>
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                {isAdmin() && (
                  <Button onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onglets de détail - Mobile optimisé */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
              <span className="hidden sm:inline">Vue d'ensemble</span>
              <span className="sm:hidden">Vue</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm py-2 px-1 sm:px-3">Contact</TabsTrigger>
            <TabsTrigger value="technical" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
              <span className="hidden sm:inline">Technique</span>
              <span className="sm:hidden">Tech</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
              <span className="hidden sm:inline">Historique</span>
              <span className="sm:hidden">Hist</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Informations générales - Mobile optimisé */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <User className="h-5 w-5" />
                    <span>Informations générales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500">Civilité</label>
                      <p className="font-medium text-sm sm:text-base">{client.civilite || "Non défini"}</p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500">Date de naissance</label>
                      <p className="font-medium text-sm sm:text-base">{formatDate(client.dateNaissance)}</p>
                    </div>
                    {/* Code vendeur - visible uniquement pour les admins */}
                    {isAdmin() && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500">Code vendeur</label>
                        <p className="font-medium text-sm sm:text-base font-mono">{client.codeVendeur || "Non défini"}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500">Source</label>
                      <p className="font-medium text-sm sm:text-base">{client.source || "recommandation"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">Commentaire</label>
                    <p className="mt-1 text-sm sm:text-base">{client.commentaire || "Aucun commentaire"}</p>
                  </div>
                </CardContent>
              </Card>

            {/* Statut et dates importantes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Suivi commercial</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Date de signature</span>
                    </div>
                    <span className="text-sm">{formatDate(client.dateSignature)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Date de rendez-vous</span>
                    </div>
                    <span className="text-sm">{formatDate(client.dateRendezVous)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Date d'installation</span>
                    </div>
                    <span className="text-sm">{formatDate(client.dateInstallation)}</span>
                  </div>
                </div>
                
                {isAdmin() && (
                  <div className="pt-4">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Actions rapides</label>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ status: "valide" })}>
                        Marquer comme validé
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ status: "rendez-vous" })}>
                        Programmer RDV
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ status: "installation" })}>
                        Installation
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Informations de contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-blue-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Téléphone</label>
                      <p className="font-medium">{client.telephone || "Non défini"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-green-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="font-medium">{client.email || "Non défini"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-red-500 mt-1" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Adresse</label>
                      <div className="font-medium">
                        <p>{client.adresse || "Non défini"}</p>
                        <p>{client.codePostal} {client.ville}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations produit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Router className="h-5 w-5" />
                  <span>Produit & Services</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Produit</label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getProductIcon(client.produit)}
                      <span className="font-medium">{client.produit || "Non défini"}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Identifiant contrat</label>
                    <p className="font-medium font-mono">{client.identifiantContrat || "Non défini"}</p>
                  </div>
                  
                  {/* Afficher Portabilité seulement pour les forfaits 5G, pas pour les Freebox */}
                  {client.produit?.includes('Forfait') && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Portabilité</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={client.portabilite === "oui" ? "default" : "secondary"}>
                            {client.portabilite === "oui" ? "Activée" : "Non activée"}
                          </Badge>
                        </div>
                      </div>
                      
                      {client.numeroPorter && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Numéro à porter</label>
                          <p className="font-medium font-mono">{client.numeroPorter}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Carte SIM */}
            {client.carteSim && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sim className="h-5 w-5" />
                    <span>Carte SIM</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ICCID</label>
                      <p className="font-medium font-mono">{client.carteSim}</p>
                    </div>
                    
                    {client.carteSIMDetails && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Statut</label>
                          <Badge className={client.carteSIMDetails.status === "assignee" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {client.carteSIMDetails.status === "assignee" ? "Assignée" : client.carteSIMDetails.status}
                          </Badge>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Date d'attribution</label>
                          <p className="font-medium">{formatDate(client.carteSIMDetails.dateAttribution)}</p>
                        </div>
                        
                        {client.carteSIMDetails.dateActivation && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Date d'activation</label>
                            <p className="font-medium">{formatDate(client.carteSIMDetails.dateActivation)}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activités récentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Activités récentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Client créé</p>
                      <p className="text-xs text-gray-500">{formatDateTime(client.createdAt)}</p>
                    </div>
                  </div>
                  
                  {client.updatedAt !== client.createdAt && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Edit className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Dernière modification</p>
                        <p className="text-xs text-gray-500">{formatDateTime(client.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {!client.activities?.length && (
                    <p className="text-center text-gray-500 py-4">Aucune activité récente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Métadonnées */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Hash className="h-5 w-5" />
                  <span>Métadonnées</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-500">ID Client</label>
                    <p className="font-mono">{client.id}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Créé le</label>
                    <p>{formatDate(client.createdAt)}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Modifié le</label>
                    <p>{formatDate(client.updatedAt)}</p>
                  </div>
                  {/* Code vendeur - visible uniquement pour les admins */}
                  {isAdmin() && (
                    <div>
                      <label className="font-medium text-gray-500">Code vendeur</label>
                      <p className="font-mono">{client.codeVendeur || "N/A"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {/* Message de félicitations personnalisé */}
      {showCongratulations && client && (
        <ContractValidationSuccess
          clientFirstName={client.prenom}
          onClose={() => setShowCongratulations(false)}
          onBackToClientList={() => {
            setShowCongratulations(false);
            setLocation("/clients");
          }}
        />
      )}
    </div>
  );
}