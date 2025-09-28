import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, RotateCcw, Search, AlertTriangle, ArrowLeft, Calendar, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface ProspectDeleted {
  id: number;
  type: "client" | "vendeur";
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville?: string;
  codePostal?: string;
  stade?: string;
  commentaire?: string;
  deletedAt: string;
  userId: number;
}

export default function ProspectsTrash() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<ProspectDeleted | null>(null);

  // Récupérer la liste des prospects supprimés
  const { data: deletedProspects = [], isLoading } = useQuery({
    queryKey: ["/api/prospects/trash"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/prospects/trash");
    },
  });

  // Mutation pour restaurer un prospect
  const restoreProspectMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/prospects/${id}/restore`);
    },
    onSuccess: () => {
      toast({
        title: "Prospect restauré",
        description: "Le prospect a été restauré avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prospects/trash"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      setShowRestoreDialog(false);
      setSelectedProspect(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer le prospect.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour suppression définitive
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/prospects/${id}/permanent`);
    },
    onSuccess: () => {
      toast({
        title: "Prospect supprimé définitivement",
        description: "Le prospect a été supprimé de façon permanente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prospects/trash"] });
      setShowPermanentDeleteDialog(false);
      setSelectedProspect(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer définitivement le prospect.",
        variant: "destructive",
      });
    },
  });

  // Filtrer les prospects par le terme de recherche
  const filteredProspects = deletedProspects.filter((prospect: ProspectDeleted) =>
    `${prospect.prenom} ${prospect.nom} ${prospect.telephone} ${prospect.email || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleRestore = (prospect: ProspectDeleted) => {
    setSelectedProspect(prospect);
    setShowRestoreDialog(true);
  };

  const handlePermanentDelete = (prospect: ProspectDeleted) => {
    setSelectedProspect(prospect);
    setShowPermanentDeleteDialog(true);
  };

  const confirmRestore = () => {
    if (selectedProspect) {
      restoreProspectMutation.mutate(selectedProspect.id);
    }
  };

  const confirmPermanentDelete = () => {
    if (selectedProspect) {
      permanentDeleteMutation.mutate(selectedProspect.id);
    }
  };

  const getStadeBadgeColor = (stade: string) => {
    switch (stade) {
      case "nouveau": return "bg-blue-500";
      case "contacte": return "bg-yellow-500";
      case "qualifie": return "bg-orange-500";
      case "pret_signature": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStadeLabel = (stade: string) => {
    switch (stade) {
      case "nouveau": return "Nouveau";
      case "contacte": return "Contacté";
      case "qualifie": return "Qualifié";
      case "pret_signature": return "Prêt signature";
      default: return stade;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/prospects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux prospects
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-500" />
              Corbeille des prospects
            </h1>
            <p className="text-gray-600 mt-1">
              {filteredProspects.length} prospect{filteredProspects.length > 1 ? 's' : ''} supprimé{filteredProspects.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher dans la corbeille..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
            />
          </div>
        </div>

        {/* Avertissement */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-semibold mb-1">Attention :</p>
                <p>
                  Les prospects dans la corbeille peuvent être restaurés ou supprimés définitivement. 
                  Une suppression définitive est irréversible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des prospects supprimés */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Chargement de la corbeille...</p>
          </div>
        ) : filteredProspects.length === 0 ? (
          <Card className="bg-white/60 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-8 text-center">
              <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Corbeille vide
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? "Aucun prospect supprimé ne correspond à votre recherche." 
                  : "Aucun prospect supprimé pour le moment."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProspects.map((prospect: ProspectDeleted) => (
              <Card key={prospect.id} className="bg-white/60 backdrop-blur-sm shadow-lg border-red-200 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        {prospect.prenom} {prospect.nom}
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          Supprimé
                        </Badge>
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={`${getStadeBadgeColor(prospect.stade || "nouveau")} text-white px-2 py-1 rounded-full text-xs`}>
                          {getStadeLabel(prospect.stade || "nouveau")}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Prospect {prospect.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    {prospect.email && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{prospect.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{prospect.telephone}</span>
                    </div>
                    {prospect.ville && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex-shrink-0">📍</span>
                        <span>{prospect.ville} {prospect.codePostal}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-red-500">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Supprimé le : {new Date(prospect.deletedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {prospect.commentaire && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 line-clamp-2">{prospect.commentaire}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRestore(prospect)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={restoreProspectMutation.isPending}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePermanentDelete(prospect)}
                      className="h-10 bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                      disabled={permanentDeleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de confirmation de restauration */}
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent className="max-w-md w-full m-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-green-600 flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Restaurer le prospect
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  Confirmer la restauration du prospect :
                </p>
                {selectedProspect && (
                  <div className="font-semibold text-green-800">
                    {selectedProspect.prenom} {selectedProspect.nom}
                    <br />
                    <span className="text-sm font-normal text-gray-600">
                      {selectedProspect.telephone}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRestoreDialog(false);
                    setSelectedProspect(null);
                  }}
                  className="flex-1"
                  disabled={restoreProspectMutation.isPending}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmRestore}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={restoreProspectMutation.isPending}
                >
                  {restoreProspectMutation.isPending ? "Restauration..." : "Restaurer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression définitive */}
        <Dialog open={showPermanentDeleteDialog} onOpenChange={setShowPermanentDeleteDialog}>
          <DialogContent className="max-w-md w-full m-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Suppression définitive
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>⚠️ ATTENTION :</strong> Cette action est irréversible !
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  Supprimer définitivement le prospect :
                </p>
                {selectedProspect && (
                  <div className="font-semibold text-red-800">
                    {selectedProspect.prenom} {selectedProspect.nom}
                    <br />
                    <span className="text-sm font-normal text-gray-600">
                      {selectedProspect.telephone}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPermanentDeleteDialog(false);
                    setSelectedProspect(null);
                  }}
                  className="flex-1"
                  disabled={permanentDeleteMutation.isPending}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmPermanentDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={permanentDeleteMutation.isPending}
                >
                  {permanentDeleteMutation.isPending ? "Suppression..." : "Supprimer définitivement"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}