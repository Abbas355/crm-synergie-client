import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, UserPlus, Mail, Phone, MapPin, Briefcase, Euro, Clock, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface VendorCandidate {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  zoneGeographique: string;
  experienceCommerciale: string;
  disponibilite: string;
  objectifRevenus: number;
  stade: string;
  etapeProcessus: string;
  commentaire: string;
  parrainCodeVendeur: string;
  createdAt: string;
  updatedAt: string;
}

interface CandidatesResponse {
  candidats: VendorCandidate[];
}

// Fonction pour obtenir le badge d'expérience
const getExperienceBadge = (experience: string) => {
  switch (experience.toLowerCase()) {
    case 'débutant':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Débutant</Badge>;
    case 'intermédiaire':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">Intermédiaire</Badge>;
    case 'expérimenté':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Expérimenté</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{experience}</Badge>;
  }
};

// Fonction pour obtenir le badge de disponibilité
const getDisponibiliteBadge = (disponibilite: string) => {
  switch (disponibilite.toLowerCase()) {
    case 'immédiate':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Immédiate</Badge>;
    case 'sous 1 semaine':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Sous 1 semaine</Badge>;
    case 'sous 1 mois':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">Sous 1 mois</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{disponibilite}</Badge>;
  }
};

export default function ValidationVendeurs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États pour le filtre par parrain
  const [parrainFilter, setParrainFilter] = useState("FR98445061");
  
  // États pour les dialogues
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<VendorCandidate | null>(null);
  
  // États pour le formulaire de validation
  const [codeVendeur, setCodeVendeur] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [commentaireValidation, setCommentaireValidation] = useState("");
  
  // États pour le formulaire de rejet
  const [motifRejet, setMotifRejet] = useState("");

  // Query pour récupérer les candidats en attente de validation
  const { data: candidatesData, isLoading, error } = useQuery<CandidatesResponse>({
    queryKey: ['/api/recrutement/candidats-qualifies', parrainFilter],
    queryFn: () => fetch(`/api/recrutement/candidats-qualifies?parrainCodeVendeur=${parrainFilter}`)
      .then(res => res.json()),
    enabled: !!parrainFilter,
  });

  // Mutation pour valider un candidat
  const validateMutation = useMutation({
    mutationFn: async (data: {
      candidatId: number;
      codeVendeur: string;
      motDePasse: string;
      commentaire?: string;
    }) => {
      return await apiRequest('POST', '/api/recrutement/valider-candidat', data);
    },
    onSuccess: () => {
      toast({
        title: "Candidat validé",
        description: "Le candidat a été validé avec succès et son compte vendeur créé.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recrutement/candidats-qualifies'] });
      setIsValidationDialogOpen(false);
      resetValidationForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de validation",
        description: error.message || "Une erreur est survenue lors de la validation.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour rejeter un candidat
  const rejectMutation = useMutation({
    mutationFn: async (data: {
      candidatId: number;
      motif: string;
    }) => {
      return await apiRequest('POST', '/api/recrutement/rejeter-candidat', data);
    },
    onSuccess: () => {
      toast({
        title: "Candidat rejeté",
        description: "Le candidat a été rejeté avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recrutement/candidats-qualifies'] });
      setIsRejectDialogOpen(false);
      resetRejectForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de rejet",
        description: error.message || "Une erreur est survenue lors du rejet.",
        variant: "destructive",
      });
    },
  });

  // Fonctions utilitaires
  const resetValidationForm = () => {
    setCodeVendeur("");
    setMotDePasse("");
    setCommentaireValidation("");
    setSelectedCandidate(null);
  };

  const resetRejectForm = () => {
    setMotifRejet("");
    setSelectedCandidate(null);
  };

  const handleValidate = (candidat: VendorCandidate) => {
    setSelectedCandidate(candidat);
    setIsValidationDialogOpen(true);
  };

  const handleReject = (candidat: VendorCandidate) => {
    setSelectedCandidate(candidat);
    setIsRejectDialogOpen(true);
  };

  const submitValidation = () => {
    if (!selectedCandidate || !codeVendeur || !motDePasse) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    validateMutation.mutate({
      candidatId: selectedCandidate.id,
      codeVendeur,
      motDePasse,
      commentaire: commentaireValidation,
    });
  };

  const submitReject = () => {
    if (!selectedCandidate || !motifRejet) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier un motif de rejet.",
        variant: "destructive",
      });
      return;
    }

    rejectMutation.mutate({
      candidatId: selectedCandidate.id,
      motif: motifRejet,
    });
  };

  // Gestion du chargement et des erreurs
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-red-600 mb-2">
                Erreur de chargement
              </h3>
              <p className="text-gray-500">
                Impossible de charger les candidats. Veuillez réessayer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const candidats: VendorCandidate[] = candidatesData?.candidats || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 space-y-4 max-w-7xl">
        {/* En-tête optimisé mobile */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Validation Vendeurs
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Candidats rattachés au parrain {parrainFilter}
          </p>
        </div>

        {/* Filtre par parrain optimisé mobile */}
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Label htmlFor="parrain-filter" className="text-sm font-medium shrink-0">
                Code Parrain:
              </Label>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Input
                  id="parrain-filter"
                  value={parrainFilter}
                  onChange={(e) => setParrainFilter(e.target.value)}
                  placeholder="FR98445061"
                  className="flex-1 sm:w-40"
                />
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {candidats.length} candidat{candidats.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des candidats optimisée mobile */}
        {candidats.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun candidat en attente
                </h3>
                <p className="text-sm text-gray-500 px-4">
                  Aucun candidat vendeur qualifié trouvé pour le parrain {parrainFilter}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {candidats.map((candidat) => (
              <Card key={candidat.id} className="hover:shadow-md transition-shadow shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl truncate">
                        {candidat.prenom} {candidat.nom}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {getExperienceBadge(candidat.experienceCommerciale)}
                        {getDisponibiliteBadge(candidat.disponibilite)}
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {candidat.stade}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <Dialog 
                        open={isValidationDialogOpen && selectedCandidate?.id === candidat.id} 
                        onOpenChange={setIsValidationDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => handleValidate(candidat)}
                            className="bg-green-600 hover:bg-green-700 text-sm w-full sm:w-auto"
                            size="sm"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Valider
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="mx-2 max-w-md sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-lg">
                              Valider {selectedCandidate?.prenom} {selectedCandidate?.nom}
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                              Créer un compte vendeur actif pour ce candidat
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="code-vendeur" className="text-sm font-medium">Code Vendeur *</Label>
                              <Input
                                id="code-vendeur"
                                value={codeVendeur}
                                onChange={(e) => setCodeVendeur(e.target.value)}
                                placeholder="FR12345678"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="mot-de-passe" className="text-sm font-medium">Mot de passe temporaire *</Label>
                              <Input
                                id="mot-de-passe"
                                type="password"
                                value={motDePasse}
                                onChange={(e) => setMotDePasse(e.target.value)}
                                placeholder="Mot de passe initial"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="commentaire-validation" className="text-sm font-medium">Commentaire</Label>
                              <Textarea
                                id="commentaire-validation"
                                value={commentaireValidation}
                                onChange={(e) => setCommentaireValidation(e.target.value)}
                                placeholder="Notes sur la validation..."
                                className="mt-1 min-h-[80px]"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                              <Button
                                variant="outline"
                                onClick={() => setIsValidationDialogOpen(false)}
                                className="w-full sm:w-auto"
                              >
                                Annuler
                              </Button>
                              <Button
                                onClick={submitValidation}
                                disabled={validateMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                              >
                                {validateMutation.isPending ? 'Validation...' : 'Valider'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog 
                        open={isRejectDialogOpen && selectedCandidate?.id === candidat.id} 
                        onOpenChange={setIsRejectDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => handleReject(candidat)}
                            variant="destructive"
                            className="text-sm w-full sm:w-auto"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="mx-2 max-w-md sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-lg">
                              Rejeter {selectedCandidate?.prenom} {selectedCandidate?.nom}
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                              Cette action marquera la candidature comme rejetée
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="motif-rejet" className="text-sm font-medium">Motif du rejet *</Label>
                              <Textarea
                                id="motif-rejet"
                                value={motifRejet}
                                onChange={(e) => setMotifRejet(e.target.value)}
                                placeholder="Expliquez les raisons du rejet..."
                                className="mt-1 min-h-[100px]"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                              <Button
                                variant="outline"
                                onClick={() => setIsRejectDialogOpen(false)}
                                className="w-full sm:w-auto"
                              >
                                Annuler
                              </Button>
                              <Button
                                onClick={submitReject}
                                disabled={rejectMutation.isPending}
                                variant="destructive"
                                className="w-full sm:w-auto"
                              >
                                {rejectMutation.isPending ? 'Rejet...' : 'Rejeter'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Informations de contact optimisées mobile */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        Contact
                      </h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-start gap-2">
                          <Mail className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                          <span className="break-all">{candidat.email}</span>
                        </div>
                        {candidat.telephone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                            <span>{candidat.telephone}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                          <span className="break-words">{candidat.zoneGeographique || 'Zone non spécifiée'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Profil commercial optimisé mobile */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4" />
                        Profil Commercial
                      </h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Euro className="h-3 w-3 text-gray-400 shrink-0" />
                          <span>Objectif: {candidat.objectifRevenus}€/mois</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                          <span className="break-words">Étape: {candidat.etapeProcessus}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                          <span>Candidature: {new Date(candidat.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commentaires optimisés mobile */}
                  {candidat.commentaire && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Notes:</h4>
                      <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg break-words">
                        {candidat.commentaire}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}