import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, User, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ClientDetail {
  id: number;
  name: string;
  prenom: string;
  nom: string;
  email: string;
  phone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  status: string;
  civilite: string;
  dateNaissance: string;
  identifiant: string;
  identifiantContrat: string;
  codeVendeur: string;
  produit: string;
  forfaitType: string;
  dateSignature: string;
  dateRendezVous: string;
  dateInstallation: string;
  carteSim: string;
  portabilite: string;
  numeroPorter: string;
  source: string;
  commentaire: string;
  createdAt: string;
  carteSIMDetails?: {
    id: number;
    numero: string;
    statut: string;
    dateAttribution: string;
    dateActivation: string;
    codeVendeur: string;
  };
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Détecter si on vient de la corbeille
  const urlParams = new URLSearchParams(window.location.search);
  const fromTrash = urlParams.get('fromTrash') === 'true';

  // Fonction pour recharger les données du client
  const reloadClient = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      console.log("Frontend: Tentative de récupération du client ID:", id);
      
      // Utiliser le paramètre fromTrash pour inclure les clients supprimés
      const includeDeleted = fromTrash ? '?includeDeleted=true' : '';
      
      // Ajouter timestamp pour éviter le cache navigateur
      const cacheBuster = `&_t=${Date.now()}`;
      const separator = includeDeleted ? '&' : '?';
      
      const response = await fetch(`/api/clients/${id}${includeDeleted}${includeDeleted ? cacheBuster : `?_t=${Date.now()}`}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log("Frontend: Réponse reçue - Status:", response.status);

      if (response.ok) {
        const clientData = await response.json();
        console.log("Frontend: Données client reçues:", clientData);
        setClient(clientData);
      } else {
        console.error("Frontend: Erreur HTTP", response.status, response.statusText);
        setError(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erreur lors du rechargement du client:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setError("ID client manquant");
      setIsLoading(false);
      return;
    }

    const loadClient = async () => {
      try {
        setIsLoading(true);
        
        // Utiliser le paramètre fromTrash pour inclure les clients supprimés
        const includeDeleted = fromTrash ? '?includeDeleted=true' : '';
        console.log("Frontend: Chargement client avec paramètres:", { id, fromTrash, includeDeleted });
        
        const response = await fetch(`/api/clients/${id}${includeDeleted}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.status === 401) {
          toast({
            title: "Non authentifié",
            description: "Veuillez vous connecter pour accéder à cette page",
            variant: "destructive",
          });
          setLocation("/auth");
          return;
        }

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setClient(data);
      } catch (error) {
        console.error("Erreur lors du chargement du client:", error);
        setError(error instanceof Error ? error.message : "Erreur inconnue");
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails du client",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadClient();
  }, [id, toast, setLocation]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Non définie";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, "dd/MM/yyyy", { locale: fr });
    } catch {
      return "Format invalide";
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="py-4 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des détails du client...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="py-4 px-4">
          <div className="text-center py-10">
            <div className="text-red-600 mb-4">
              <h2 className="text-xl font-semibold">Une erreur est survenue lors du chargement du client</h2>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <Button onClick={() => setLocation("/clients")} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="py-4 px-4">
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-gray-600">Client non trouvé</h2>
            <Button onClick={() => setLocation("/clients")} className="mt-4 bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="py-2 sm:py-4 px-2 sm:px-4">
        {/* Header optimisé mobile */}
        <div className="mb-4 sm:mb-6">
          {/* Ligne des boutons d'action en haut */}
          <div className="flex items-center justify-between mb-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/clients")}
              className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation(`/clients/${client.id}/edit`)}
                className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 px-2 py-1 text-xs sm:hidden"
              >
                Insta
              </Button>
            </div>
          </div>
          
          {/* Titre centré avec statut */}
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold mb-1">
              {client.prenom} {client.nom}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Détails du client</p>
            <div className="flex justify-center">
              <StatusBadge status={client.status} />
            </div>
          </div>
        </div>

        {/* Informations principales */}
        <div className="space-y-3 sm:space-y-4">
          {/* Informations personnelles */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Civilité</label>
                  <p className="text-sm font-medium">{client.civilite || "-"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Date de naissance</label>
                  <p className="text-sm font-medium">{formatDate(client.dateNaissance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <label className="text-xs font-medium text-gray-600">Email</label>
                </div>
                <p className="text-sm font-medium ml-5">{client.email || "Non renseigné"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <label className="text-xs font-medium text-gray-600">Téléphone</label>
                </div>
                <p className="text-sm font-medium ml-5">{client.phone || "Non renseigné"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <label className="text-xs font-medium text-gray-600">Adresse</label>
                </div>
                <p className="text-sm font-medium ml-5">
                  {client.adresse ? `${client.adresse}, ${client.codePostal} ${client.ville}` : "Non renseignée"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Produit et services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Produit et services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Produit</label>
                  <p className="text-sm">{client.produit || "Non renseigné"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Identifiant contrat</label>
                  <p className="text-sm">{client.identifiantContrat || "Non renseigné"}</p>
                </div>
                {/* Afficher la carte SIM si elle existe */}
                {client.carteSim && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Carte SIM</label>
                    <p className="text-sm font-semibold text-green-600">
                      {client.carteSim}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Code vendeur</label>
                  <p className="text-sm">{client.codeVendeur || "Non attribué"}</p>
                </div>
                {/* Afficher Portabilité seulement pour les forfaits 5G, pas pour les Freebox */}
                {client.produit?.includes('Forfait') && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Portabilité</label>
                    <p className="text-sm">{client.portabilite || "Non"}</p>
                  </div>
                )}
                {client.numeroPorter && client.produit?.includes('Forfait') && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Numéro à porter</label>
                    <p className="text-sm">{client.numeroPorter}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dates importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Dates importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de signature</label>
                  <p className="text-sm">{formatDate(client.dateSignature)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de rendez-vous</label>
                  <p className="text-sm">{formatDate(client.dateRendezVous)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date d'installation</label>
                  <p className="text-sm">{formatDate(client.dateInstallation)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de création</label>
                  <p className="text-sm">{formatDate(client.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commentaires */}
          {client.commentaire && (
            <Card>
              <CardHeader>
                <CardTitle>Commentaires</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{client.commentaire}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}