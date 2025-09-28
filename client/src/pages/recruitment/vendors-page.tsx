import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Search, Filter, User, Mail, Phone, Award, Tag, Trash2 } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, getInitials } from "@/lib/utils";
import { Recruiter as BaseRecruiter } from "@shared/schema";
import { getStatusHexColors } from "@shared/constants";
import { useToast } from "@/hooks/use-toast";
import { VendorForm } from "@/components/recruitment/vendor-form";
import { VendorDetailModal } from "@/components/recruitment/vendor-detail-modal";
import { PageContainer } from "@/components/ui/page-container";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Extension du type Recruiter pour inclure les propriétés utilisées dans l'interface
interface Recruiter extends BaseRecruiter {
  directRecruits?: number;
  prospectsCount?: number;
  clientsCount?: number;
}

export default function VendorsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("tous");
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Recruiter | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Recruiter | null>(null);
  const [vendorDetailId, setVendorDetailId] = useState<number | null>(null);
  const [showVendorDetail, setShowVendorDetail] = useState(false);
  const [showProspectsList, setShowProspectsList] = useState(false);
  const [vendorForProspects, setVendorForProspects] = useState<Recruiter | null>(null);
  const [showClientsList, setShowClientsList] = useState(false);
  const [vendorForClients, setVendorForClients] = useState<Recruiter | null>(null);

  const {
    data: vendors,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["/api/recruiters", { search, statut }],
    queryFn: async () => {
      const url = new URL("/api/recruiters", window.location.origin);
      
      if (search) {
        url.searchParams.append("search", search);
      }
      
      if (statut && statut !== "tous") {
        url.searchParams.append("statut", statut);
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur lors de la récupération des vendeurs");
      return res.json();
    }
  });

  // Query pour récupérer les prospects d'un vendeur
  const {
    data: vendorProspects,
    isLoading: isLoadingProspects
  } = useQuery({
    queryKey: ["/api/recruiters", vendorForProspects?.id, "prospects"],
    queryFn: async () => {
      if (!vendorForProspects?.id) return [];
      const res = await fetch(`/api/recruiters/${vendorForProspects.id}/prospects`);
      if (!res.ok) throw new Error("Erreur lors de la récupération des prospects");
      return res.json();
    },
    enabled: !!vendorForProspects?.id && showProspectsList
  });

  // Query pour récupérer les clients d'un vendeur
  const {
    data: vendorClients,
    isLoading: isLoadingClients
  } = useQuery({
    queryKey: ["/api/recruiters", vendorForClients?.codeVendeur, "clients"],
    queryFn: async () => {
      if (!vendorForClients?.codeVendeur) return [];
      const res = await fetch(`/api/clients?codeVendeur=${vendorForClients.codeVendeur}`);
      if (!res.ok) throw new Error("Erreur lors de la récupération des clients");
      return res.json();
    },
    enabled: !!vendorForClients?.codeVendeur && showClientsList
  });

  // Mutation pour supprimer un vendeur
  const deleteVendorMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      await apiRequest("DELETE", `/api/recruiters/${vendorId}`);
    },
    onSuccess: () => {
      // Force la suppression complète du cache et rechargement immédiat
      queryClient.removeQueries({ queryKey: ["/api/recruiters"] });
      queryClient.removeQueries({ queryKey: ["/api/recruitment"] });
      queryClient.removeQueries({ queryKey: ["/api/dashboard"] });
      
      // Force un refetch immédiat
      queryClient.refetchQueries({ queryKey: ["/api/recruiters"] });
      
      toast({
        title: "Vendeur supprimé",
        description: "Le vendeur a été supprimé avec succès",
      });
      setVendorToDelete(null);
    },
    onError: (error: any) => {
      console.error("Erreur suppression vendeur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le vendeur",
        variant: "destructive",
      });
    },
  });

  const handleAddVendor = () => {
    setSelectedVendor(null);
    setShowVendorForm(true);
  };

  const handleViewVendor = (vendor: Recruiter) => {
    setVendorDetailId(vendor.id);
    setShowVendorDetail(true);
  };

  const handleViewProspects = (vendor: Recruiter) => {
    setVendorForProspects(vendor);
    setShowProspectsList(true);
  };

  const handleViewClients = (vendor: Recruiter) => {
    setVendorForClients(vendor);
    setShowClientsList(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "actif":
        return <Badge className="bg-green-500">Actif</Badge>;
      case "inactif":
        return <Badge variant="outline" className="text-gray-500">Inactif</Badge>;
      case "suspendu":
        return <Badge variant="destructive">Suspendu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <PageContainer
      title="Vendeurs"
      showBackButton
      backTo="/"
      actions={
        <Button onClick={handleAddVendor} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un vendeur
        </Button>
      }
    >
      <Separator className="mt-2 mb-6" />
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un vendeur..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={statut}
            onValueChange={setStatut}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="inactif">Inactif</SelectItem>
              <SelectItem value="suspendu">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          Une erreur s'est produite lors du chargement des vendeurs.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors && vendors.length > 0 ? (
            vendors.map((vendor: Recruiter) => (
              <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleViewVendor(vendor)}>
                      <Avatar className="h-10 w-10">
                        {vendor.avatar ? (
                          <AvatarImage src={vendor.avatar} alt={`${vendor.prenom} ${vendor.nom}`} />
                        ) : (
                          <AvatarFallback>{getInitials(`${vendor.prenom} ${vendor.nom}`)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{vendor.prenom} {vendor.nom}</CardTitle>
                        <CardDescription>Niveau {vendor.niveau}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(vendor.statut)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`⚠️ SUPPRESSION DÉFINITIVE ⚠️\n\nVous êtes sur le point de supprimer définitivement :\n\n👤 ${vendor.prenom} ${vendor.nom}\n📧 ${vendor.email}\n🏷️ Code: ${vendor.codeVendeur}\n\n❌ Cette action est IRRÉVERSIBLE et supprimera :\n• Toutes les données du vendeur\n• Ses prospects associés\n• Son historique d'activités\n• Sa structure de réseau MLM\n\n⚠️ Confirmez-vous cette suppression définitive ?`)) {
                            deleteVendorMutation.mutate(vendor.id);
                          }
                        }}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 z-10"
                        title="Supprimer le vendeur"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">Code: {vendor.codeVendeur}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">{vendor.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">{vendor.telephone}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-gray-500 border-t pt-3">
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <div className="flex items-center gap-1 justify-center">
                      <User className="h-4 w-4" />
                      <span className="text-xs">{vendor.directRecruits ?? 0} recrutés</span>
                    </div>
                    <div 
                      className="flex items-center gap-1 justify-center cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProspects(vendor);
                      }}
                      title="Voir les prospects de ce vendeur"
                    >
                      <Award className="h-4 w-4" />
                      <span className="text-xs">{vendor.prospectsCount ?? 0} prospects</span>
                    </div>
                    <div 
                      className="flex items-center gap-1 justify-center cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewClients(vendor);
                      }}
                      title="Voir les clients de ce vendeur"
                    >
                      <User className="h-4 w-4" />
                      <span className="text-xs">{vendor.clientsCount ?? 0} clients</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-gray-500">
              Aucun vendeur trouvé
            </div>
          )}
        </div>
      )}
      
      {/* Utilisation du formulaire vendeur */}
      {showVendorForm && (
        <VendorForm
          isOpen={showVendorForm}
          onClose={() => setShowVendorForm(false)}
          vendor={selectedVendor || undefined}
        />
      )}
      
      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!vendorToDelete} onOpenChange={() => setVendorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le vendeur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le vendeur <strong>{vendorToDelete?.prenom} {vendorToDelete?.nom}</strong> ?
              Cette action est irréversible et supprimera également toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (vendorToDelete) {
                  deleteVendorMutation.mutate(vendorToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteVendorMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de détail du vendeur */}
      <VendorDetailModal
        vendorId={vendorDetailId}
        isOpen={showVendorDetail}
        onClose={() => {
          setShowVendorDetail(false);
          setVendorDetailId(null);
        }}
      />

      {/* Modal pour afficher les prospects d'un vendeur */}
      <Dialog open={showProspectsList} onOpenChange={setShowProspectsList}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Prospects de {vendorForProspects?.prenom} {vendorForProspects?.nom}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {isLoadingProspects ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : vendorProspects && vendorProspects.length > 0 ? (
              <div className="space-y-4">
                {vendorProspects.map((prospect: any) => (
                  <Card key={prospect.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {prospect.prenom} {prospect.nom}
                            </h3>
                            <Badge variant={
                              prospect.stade === 'formation' ? 'secondary' :
                              prospect.stade === 'formulaire' ? 'default' :
                              prospect.stade === 'documents' ? 'outline' :
                              prospect.stade === 'contrat' ? 'destructive' :
                              'secondary'
                            }>
                              {prospect.stade === 'formation' ? 'Formation' :
                               prospect.stade === 'formulaire' ? 'Formulaire' :
                               prospect.stade === 'documents' ? 'Documents' :
                               prospect.stade === 'contrat' ? 'Contrat' :
                               prospect.stade}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span>{prospect.email}</span>
                            </div>
                            {prospect.telephone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{prospect.telephone}</span>
                              </div>
                            )}
                            {prospect.ville && (
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-gray-500" />
                                <span>{prospect.codePostal} {prospect.ville}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-600">
                            <div>Formation: {prospect.formationCompletee ? '✅' : '❌'}</div>
                            <div>Formulaire: {prospect.formulaireComplete ? '✅' : '❌'}</div>
                            <div>Pièce d'identité: {prospect.pieceIdentiteDeposee ? '✅' : '❌'}</div>
                            <div>RIB: {prospect.ribDepose ? '✅' : '❌'}</div>
                            <div>Contrat: {prospect.contratSigne ? '✅' : '❌'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                Aucun prospect trouvé pour ce vendeur
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal pour afficher les clients d'un vendeur */}
      <Dialog open={showClientsList} onOpenChange={setShowClientsList}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Clients de {vendorForClients?.prenom} {vendorForClients?.nom}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {isLoadingClients ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : vendorClients && vendorClients.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendorClients.map((client: any) => (
                    <Card key={client.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {client.prenom} {client.nom}
                            </h3>
                            <Badge 
                              style={{
                                backgroundColor: getStatusHexColors(client.status || 'enregistre').bg,
                                color: getStatusHexColors(client.status || 'enregistre').text,
                                border: client.status === 'nouveau' || client.status === 'enregistre' ? '1px solid #dee2e6' : 'none'
                              }}
                              className="font-medium"
                            >
                              {client.status}
                            </Badge>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            ID: {client.identifiant || 'N/A'}
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{client.phone || client.mobileProspect || client.fixe || "Non renseigné"}</span>
                          </div>
                          {client.ville && (
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-gray-500" />
                              <span>{client.code_postal} {client.ville}</span>
                            </div>
                          )}
                          {client.produit && (
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-gray-500" />
                              <span>{client.produit}</span>
                            </div>
                          )}
                        </div>

                        {client.dateSignature && (
                          <div className="text-xs text-gray-500 border-t pt-2">
                            Signé le: {new Date(client.dateSignature).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                Aucun client trouvé pour ce vendeur
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}