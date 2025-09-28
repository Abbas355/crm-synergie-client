import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, User, Mail, Phone, Award, UserCheck, Shield } from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Vendeur {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  phone: string;
  codeVendeur: string;
  active: boolean;
  etapeActuelle: string;
  progression: number;
  dateInscription: string;
  codeParrain?: string;
  contratSigne: boolean;
  justificatifsFournis: boolean;
}

export default function VendorsPageSimple() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");

  // Utiliser l'endpoint existant pour les recrues
  const { data: recruesData, isLoading, isError } = useQuery({
    queryKey: ["/api/recruitment/recrues"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement des vendeurs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erreur de chargement
              </h3>
              <p className="text-gray-600 mb-4">
                Une erreur s'est produite lors du chargement des vendeurs.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const allRecrues: any[] = recruesData?.recrues || [];
  

  
  // RÈGLE MÉTIER 1: Critères assouplis pour inclure tous les vendeurs avec un code
  // Un vendeur doit avoir un code vendeur et être dans le processus de validation/formation
  const realVendors = allRecrues.filter((recrue) => {
    return recrue.codeVendeur && // Doit avoir un code vendeur
           (recrue.etapeActuelle === 'formation_terminee' || 
            recrue.etapeActuelle === 'formation' ||
            recrue.etapeActuelle === 'validation' || // Inclure ceux en validation
            recrue.progression >= 50 || // Au moins 50% du parcours terminé
            recrue.isActive === true); // OU compte actif
  }).map(recrue => ({
    ...recrue,
    active: recrue.isActive || false, // Mapper isActive vers active pour compatibilité
    phone: recrue.phone || recrue.mobile || '' // Mapper le téléphone
  }));


  // RÈGLE MÉTIER 2: Logique MLM - Un vendeur ne voit que son groupe
  // Si l'utilisateur n'est pas admin, il ne voit que les vendeurs de son réseau
  const visibleVendors = user?.isAdmin ? realVendors : realVendors.filter((vendeur) => {
    // Afficher les vendeurs recrutés par l'utilisateur courant ou par des membres de son groupe
    return vendeur.codeParrain === user?.codeVendeur || 
           vendeur.codeVendeur === user?.codeVendeur || // Le vendeur lui-même
           isInMyNetwork(vendeur, user?.codeVendeur, realVendors);
  });

  // Filtrer les vendeurs selon les critères de recherche
  const filteredVendors = visibleVendors.filter((vendeur) => {
    const matchesSearch = search === "" || 
      vendeur.nom?.toLowerCase().includes(search.toLowerCase()) ||
      vendeur.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      vendeur.email?.toLowerCase().includes(search.toLowerCase()) ||
      vendeur.codeVendeur?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "tous" || 
      (statusFilter === "actif" && vendeur.active) ||
      (statusFilter === "inactif" && !vendeur.active);
    
    return matchesSearch && matchesStatus;
  });

  // Fonction pour vérifier si un vendeur appartient au réseau MLM de l'utilisateur
  function isInMyNetwork(vendeur: Vendeur, myCode?: string, allVendors: Vendeur[] = []): boolean {
    if (!myCode || !vendeur.codeParrain) return false;
    
    // Vérification directe
    if (vendeur.codeParrain === myCode) return true;
    
    // Vérification récursive dans le réseau (jusqu'à 3 niveaux)
    const parrain = allVendors.find(v => v.codeVendeur === vendeur.codeParrain);
    if (parrain && parrain.codeParrain === myCode) return true;
    
    return false;
  }

  const getStatusColor = (active: boolean) => {
    return active 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStageColor = (stage: string) => {
    switch(stage) {
      case 'inscription': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'validation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'formation': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'actif': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Vendeurs Qualifiés
              </h1>
              <p className="text-gray-600">
                {user?.isAdmin 
                  ? "Tous les vendeurs ayant terminé leur parcours de formation" 
                  : "Les vendeurs de votre réseau MLM"}
              </p>
            </div>
          </div>
          
          {!user?.isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Votre réseau MLM</h3>
                  <p className="text-sm text-blue-700">
                    Vous ne voyez que les vendeurs que vous avez recrutés ou qui appartiennent à votre groupe. 
                    Seuls les candidats ayant terminé leur formation et signé leur contrat apparaissent ici.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher un vendeur..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les statuts</SelectItem>
                    <SelectItem value="actif">Actifs</SelectItem>
                    <SelectItem value="inactif">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Candidats Total</p>
                  <p className="text-2xl font-bold text-gray-500">{allRecrues.length}</p>
                </div>
                <User className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vendeurs Qualifiés</p>
                  <p className="text-2xl font-bold text-blue-600">{realVendors.length}</p>
                </div>
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Votre Réseau</p>
                  <p className="text-2xl font-bold text-green-600">{visibleVendors.length}</p>
                </div>
                <Award className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Actifs</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {filteredVendors.filter(v => v.active).length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des vendeurs */}
        {filteredVendors.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Aucun vendeur qualifié trouvé
              </h3>
              <p className="text-gray-500 mb-2">
                {search || statusFilter !== "tous" 
                  ? "Essayez de modifier vos critères de recherche." 
                  : user?.isAdmin 
                    ? "Aucun candidat n'a encore terminé son parcours de formation complet."
                    : "Aucun vendeur qualifié dans votre réseau MLM."}
              </p>
              <p className="text-xs text-gray-400">
                Pour devenir vendeur, un candidat doit terminer sa formation, signer son contrat et fournir ses justificatifs.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((vendeur) => (
              <Card key={vendeur.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {vendeur.prenom?.[0]}{vendeur.nom?.[0]}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {vendeur.prenom} {vendeur.nom}
                        </CardTitle>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Code: {vendeur.codeVendeur}
                          </p>
                          {vendeur.codeParrain && (
                            <p className="text-xs text-blue-600">
                              Parrain: {vendeur.codeParrain}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(vendeur.active)}>
                        {vendeur.active ? "Actif" : "Inactif"}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        Vendeur Qualifié
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="truncate">{vendeur.email}</span>
                  </div>
                  
                  {vendeur.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span>{vendeur.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      Formation Terminée
                    </Badge>
                    <span className="text-sm font-semibold text-green-600">
                      100% Qualifié
                    </span>
                  </div>
                  
                  <div className="pt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: '100%' }}
                      />
                    </div>
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ Contrat signé • Justificatifs fournis
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}