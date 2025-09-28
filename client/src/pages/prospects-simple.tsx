import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, Plus, Search, User, Mail, Phone, Calendar,
  Filter, BarChart3, TrendingUp, Grid3X3, List, Edit
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/ui/page-container";
import { CompactStatCard } from "@/components/ui/compact-stat-card";

export default function ProspectsSimple() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [stade, setStade] = useState("tous");
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fonction pour ouvrir les détails d'une recrue
  const handleShowDetails = (prospect: any) => {
    setSelectedProspect(prospect);
    setIsDialogOpen(true);
  };

  // Fonction pour modifier une recrue
  const handleEditProspect = (prospect: any) => {
    setIsDialogOpen(false);
    // Naviguer vers le formulaire d'édition avec les données de la recrue
    setLocation(`/recruitment/prospects/edit?id=${prospect.id}&type=vendeur`);
  };

  // Query pour récupérer les vraies données des recrues
  const { data: recruesData, isLoading: isLoadingRecrues } = useQuery({
    queryKey: ["/api/recruitment/recrues"],
  });

  // Transformer les recrues en format compatible avec le rendu
  const recrues = recruesData?.recrues || [];
  const prospects = recrues.map((recrue: any) => ({
    id: recrue.id,
    nom: recrue.nom,
    prenom: recrue.prenom,
    email: recrue.email,
    telephone: recrue.phone, // Corrected: use 'phone' instead of 'mobile'
    // ville: recrue.ville || "Ville non renseignée", // Champ supprimé car n'existe pas dans users table
    departement: recrue.codePostal?.slice(0, 2) || "",
    stade: recrue.etapeActuelle,
    statut: recrue.active !== false ? "actif" : "inactif", // Use 'active' field correctly
    dateCreation: recrue.dateInscription,
    dateModification: recrue.dateInscription,
    notes: recrue.etapeDetails,
    progression: recrue.progression,
    codeVendeur: recrue.codeVendeur,
    codeParrainage: recrue.codeParrainage
  }));

  // Filtrer les prospects selon les critères
  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = search === "" || 
      prospect.nom?.toLowerCase().includes(search.toLowerCase()) ||
      prospect.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      prospect.email?.toLowerCase().includes(search.toLowerCase()) ||
      (prospect.telephone && prospect.telephone.includes(search)) ||
      prospect.codeVendeur?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStade = stade === "tous" || prospect.stade === stade;
    
    return matchesSearch && matchesStade;
  });

  // Calculer les statistiques
  const stats = {
    total: prospects.length,
    inscription: prospects.filter(p => p.stade === "inscription").length,
    validation: prospects.filter(p => p.stade === "validation").length,
    formation: prospects.filter(p => p.stade === "formation").length,
    formation_terminee: prospects.filter(p => p.stade === "formation_terminee").length,
    actif: prospects.filter(p => p.statut === "actif").length
  };

  const getStadeColor = (stade: string) => {
    switch (stade) {
      case "inscription": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "validation": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "formation": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "formation_terminee": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStadeLabel = (stade: string) => {
    switch (stade) {
      case "inscription": return "Inscription";
      case "validation": return "Validation";
      case "formation": return "Formation";
      case "formation_terminee": return "Terminé";
      default: return stade;
    }
  };

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Prospects Recrutement
                </h1>
                <Badge variant="outline" className="hidden sm:flex">
                  {filteredProspects.length} prospects
                </Badge>
              </div>
              <Button 
                onClick={() => setLocation("/prospects?type=vendeur&action=nouveau")}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 pb-20">
          {/* Statistiques */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4">
            <CompactStatCard
              title="Total"
              value={stats.total}
              icon={User}
              color="bg-gradient-to-r from-blue-500 to-blue-600"
              textColor="text-white"
            />
            <CompactStatCard
              title="Inscription"
              value={stats.inscription}
              icon={Plus}
              color="bg-gradient-to-r from-indigo-500 to-indigo-600"
              textColor="text-white"
            />
            <CompactStatCard
              title="Validation"
              value={stats.validation}
              icon={Phone}
              color="bg-gradient-to-r from-yellow-500 to-yellow-600"
              textColor="text-white"
            />
            <CompactStatCard
              title="Formation"
              value={stats.formation}
              icon={TrendingUp}
              color="bg-gradient-to-r from-orange-500 to-orange-600"
              textColor="text-white"
            />
            <CompactStatCard
              title="Terminé"
              value={stats.formation_terminee}
              icon={Calendar}
              color="bg-gradient-to-r from-green-500 to-green-600"
              textColor="text-white"
            />
            <CompactStatCard
              title="Actif"
              value={stats.actif}
              icon={BarChart3}
              color="bg-gradient-to-r from-purple-500 to-purple-600"
              textColor="text-white"
            />
          </div>

          {/* Filtres */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Filtres & Recherche
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom, email, téléphone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={stade} onValueChange={setStade}>
                    <SelectTrigger className="flex-1 h-12 text-base">
                      <SelectValue placeholder="Stade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Toutes les étapes</SelectItem>
                      <SelectItem value="inscription">Inscription</SelectItem>
                      <SelectItem value="validation">Validation</SelectItem>
                      <SelectItem value="formation">Formation</SelectItem>
                      <SelectItem value="formation_terminee">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="h-10 px-4"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-10 px-4"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vue des prospects */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Liste des Prospects ({filteredProspects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRecrues ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">Chargement des recrues...</span>
                </div>
              ) : filteredProspects.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Aucun prospect trouvé
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-4">
                    {search || stade !== "tous" 
                      ? "Essayez de modifier vos critères de recherche." 
                      : "Utilisez le bouton 'Nouveau' en haut de la page pour ajouter une recrue."}
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredProspects.map((prospect) => (
                    <Card key={prospect.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-gray-200/30 dark:border-gray-700/30 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                              {(prospect.prenom?.[0] || '?')}{(prospect.nom?.[0] || '?')}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                                {prospect.prenom || 'Prénom manquant'} {prospect.nom || 'Nom manquant'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                Code: {prospect.codeVendeur}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStadeColor(prospect.stade)}>
                            {getStadeLabel(prospect.stade)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Mail className="w-4 h-4 text-blue-500" />
                          {prospect.email ? (
                            <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline truncate flex-1">
                              {prospect.email}
                            </a>
                          ) : (
                            <span className="text-gray-500 italic">Email non renseigné</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Phone className="w-4 h-4 text-green-500" />
                          {prospect.telephone ? (
                            <a href={`tel:${prospect.telephone}`} className="text-green-600 hover:underline font-medium">
                              {prospect.telephone}
                            </a>
                          ) : (
                            <span className="text-gray-500 italic">Téléphone non renseigné</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatDate(prospect.dateCreation)}
                          </span>
                        </div>
                        
                        {/* Barre de progression du processus */}
                        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Progression du processus
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-300 font-bold">
                              {prospect.progression || 0}%
                            </span>
                          </div>
                          <Progress 
                            value={prospect.progression || 0} 
                            className="h-2 mb-2"
                          />
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {prospect.notes}
                          </p>
                          {prospect.codeVendeur && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200/50 dark:border-blue-700/50">
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                Code vendeur: <span className="font-mono font-bold">{prospect.codeVendeur}</span>
                              </span>
                              <Badge variant={prospect.statut === "actif" ? "default" : "secondary"} className="text-xs">
                                {prospect.statut}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleShowDetails(prospect)}
                            className="h-8 px-3 text-xs flex-1"
                          >
                            Voir détails
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead className="hidden md:table-cell">Code vendeur</TableHead>
                        <TableHead>Stade</TableHead>
                        <TableHead className="hidden sm:table-cell">Statut</TableHead>
                        <TableHead className="hidden lg:table-cell">Date création</TableHead>
                        <TableHead className="hidden lg:table-cell">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProspects.map((prospect) => (
                        <TableRow 
                          key={prospect.id} 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          onClick={() => handleShowDetails(prospect)}
                        >
                          <TableCell className="font-medium">
                            <div>
                              <div>{prospect.prenom} {prospect.nom}</div>
                              <div className="text-sm text-gray-500 sm:hidden">
                                {prospect.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline">
                              {prospect.email}
                            </a>
                          </TableCell>
                          <TableCell>
                            {prospect.telephone ? (
                              <a href={`tel:${prospect.telephone}`} className="text-blue-600 hover:underline">
                                {prospect.telephone}
                              </a>
                            ) : (
                              <span className="text-gray-500 text-sm">Non renseigné</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {prospect.codeVendeur || "Non attribué"}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStadeColor(prospect.stade)}>
                              {getStadeLabel(prospect.stade)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={prospect.statut === "actif" ? "default" : "secondary"}>
                              {prospect.statut}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {formatDate(prospect.dateCreation)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-xs truncate">
                            {prospect.notes}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bouton flottant supprimé car gênant pour l'utilisateur */}

        {/* Dialog pour les détails de la recrue */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Détails de la recrue
              </DialogTitle>
              <DialogDescription>
                Consultez et modifiez les informations de cette recrue.
              </DialogDescription>
            </DialogHeader>
            
            {selectedProspect && (
              <div className="space-y-4">
                {/* Informations personnelles */}
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                    {(selectedProspect.prenom?.[0] || '?')}{(selectedProspect.nom?.[0] || '?')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedProspect.prenom || 'Prénom manquant'} {selectedProspect.nom || 'Nom manquant'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Code vendeur: {selectedProspect.codeVendeur}
                    </p>
                  </div>
                </div>

                {/* Progression */}
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Progression du processus
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-300 font-bold">
                      {selectedProspect.progression || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={selectedProspect.progression || 0} 
                    className="h-2 mb-2"
                  />
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {selectedProspect.notes}
                  </p>
                </div>

                {/* Informations de contact */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">
                      {selectedProspect.email || 'Email non renseigné'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {selectedProspect.telephone || 'Téléphone non renseigné'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      Inscrit le {formatDate(selectedProspect.dateCreation)}
                    </span>
                  </div>
                </div>

                {/* Code vendeur et statut */}
                {selectedProspect.codeVendeur && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Code vendeur</span>
                      <p className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {selectedProspect.codeVendeur}
                      </p>
                    </div>
                    <Badge variant={selectedProspect.statut === "actif" ? "default" : "secondary"}>
                      {selectedProspect.statut}
                    </Badge>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    onClick={() => handleEditProspect(selectedProspect)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    size="sm"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}