import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, Plus, Search, User, Mail, Phone, Calendar,
  Filter, BarChart3, TrendingUp, Grid3X3, List, UserPlus
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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/ui/page-container";
import { CompactStatCard } from "@/components/ui/compact-stat-card";

export default function RecruitmentsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [stade, setStade] = useState("tous");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table"); // Tableau par défaut

  // Requête optimisée avec cache agressif
  const {
    data: recruesData,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["/api/recruitment/recrues", { search, stade }],
    queryFn: async () => {
      const url = new URL("/api/recruitment/recrues", window.location.origin);
      
      if (search) {
        url.searchParams.append("search", search);
      }
      
      if (stade && stade !== "tous") {
        url.searchParams.append("stade", stade);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Données mémorisées avec calculs de statistiques
  const { recrues, stats } = useMemo(() => {
    if (!recruesData?.recrues) {
      return {
        recrues: [],
        stats: {
          total: 0,
          nouveau: 0,
          contacté: 0,
          entretien: 0,
          formation: 0,
          actif: 0,
          refusé: 0
        }
      };
    }

    const recrues = recruesData.recrues || [];
    
    return {
      recrues,
      stats: {
        total: recrues.length,
        nouveau: recrues.filter((r: any) => r.etapeActuelle === "nouveau").length,
        contacté: recrues.filter((r: any) => r.etapeActuelle === "contacté").length,
        entretien: recrues.filter((r: any) => r.etapeActuelle === "entretien").length,
        formation: recrues.filter((r: any) => r.etapeActuelle === "formation").length,
        actif: recrues.filter((r: any) => r.etapeActuelle === "actif").length,
        refusé: recrues.filter((r: any) => r.etapeActuelle === "refusé").length
      }
    };
  }, [recruesData]);

  // Filtrage et tri côté client - Ordre décroissant par date de création
  const filteredRecrues = useMemo(() => {
    if (!recrues) return [];
    
    let filtered = recrues;
    
    // Filtrage par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = recrues.filter((recrue: any) => 
        recrue.prenom?.toLowerCase().includes(searchLower) ||
        recrue.nom?.toLowerCase().includes(searchLower) ||
        recrue.email?.toLowerCase().includes(searchLower)
      );
    }
    
    // Tri par date de création décroissante (plus récent en premier)
    return filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || a.dateCreation || '1970-01-01');
      const dateB = new Date(b.createdAt || b.dateCreation || '1970-01-01');
      return dateB.getTime() - dateA.getTime();
    });
  }, [recrues, search]);

  const handleAddRecrutement = () => {
    // Navigation vers formulaire d'ajout de recrutement
    window.location.href = "/recruitment/step1";
  };

  const getStadeBadge = (stade: string) => {
    const stadeConfig = {
      nouveau: { color: "bg-blue-100 text-blue-800", label: "Nouveau" },
      contacté: { color: "bg-orange-100 text-orange-800", label: "Contacté" },
      entretien: { color: "bg-purple-100 text-purple-800", label: "Entretien" },
      formation: { color: "bg-yellow-100 text-yellow-800", label: "Formation" },
      actif: { color: "bg-green-100 text-green-800", label: "Actif" },
      refusé: { color: "bg-red-100 text-red-800", label: "Refusé" }
    };

    const config = stadeConfig[stade as keyof typeof stadeConfig] || 
                   { color: "bg-gray-100 text-gray-800", label: stade || "Inconnu" };

    return (
      <Badge className={`${config.color} text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  if (isError) {
    return (
      <PageContainer>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur de chargement</h2>
            <p className="text-gray-600">Impossible de charger les recrutements</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <PageContainer>
        <div className="space-y-6 p-6">
          {/* Header avec bouton d'ajout */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Recrutements
              </h1>
              <p className="text-gray-600 mt-1">Gérez vos candidats et recrutements</p>
            </div>
            
            <Button 
              onClick={handleAddRecrutement}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau recrutement
            </Button>
          </div>

          {/* Statistiques en cartes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Plus className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nouveaux</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.nouveau}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">En formation</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.formation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Actifs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.actif}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-white/20 focus:border-blue-300 rounded-xl shadow-lg"
              />
            </div>
            
            <Select value={stade} onValueChange={setStade}>
              <SelectTrigger className="w-full sm:w-48 bg-white/80 backdrop-blur-sm border-white/20 rounded-xl shadow-lg">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par stade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les stades</SelectItem>
                <SelectItem value="nouveau">Nouveau</SelectItem>
                <SelectItem value="contacté">Contacté</SelectItem>
                <SelectItem value="entretien">Entretien</SelectItem>
                <SelectItem value="formation">Formation</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="refusé">Refusé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Boutons de vue grille/tableau */}
          <div className="flex justify-end">
            <div className="flex bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-1">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={`rounded-lg transition-all duration-200 ${
                  viewMode === "table" 
                    ? "bg-blue-500 text-white shadow-md" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <List className="h-4 w-4 mr-2" />
                Tableau
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg transition-all duration-200 ${
                  viewMode === "grid" 
                    ? "bg-blue-500 text-white shadow-md" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grille
              </Button>
            </div>
          </div>

          {/* Liste des recrutements */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600">Chargement des recrutements...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Vue tableau par défaut */}
                {viewMode === "table" ? (
                  <>
                    {filteredRecrues.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="font-semibold text-gray-700">Candidat</TableHead>
                            <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                            <TableHead className="font-semibold text-gray-700">Stade</TableHead>
                            <TableHead className="font-semibold text-gray-700">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRecrues.map((recrue: any) => (
                            <TableRow 
                              key={recrue.id}
                              className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                                    <UserPlus className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {recrue.prenom} {recrue.nom}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      Code: {recrue.codeVendeur || recrue.codevendeur}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {recrue.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{recrue.email}</span>
                                    </div>
                                  )}
                                  {recrue.mobile && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Phone className="h-3 w-3" />
                                      <span>{recrue.mobile}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStadeBadge(recrue.etapeActuelle)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(recrue.createdAt || recrue.createdAt)}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Aucun recrutement trouvé
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {search ? "Aucun recrutement ne correspond à votre recherche." : "Commencez par ajouter votre premier recrutement."}
                        </p>
                        {!search && (
                          <Button 
                            onClick={handleAddRecrutement}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau recrutement
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  /* Vue grille */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecrues.length > 0 ? (
                      filteredRecrues.map((recrue: any) => (
                        <Card 
                          key={recrue.id} 
                          className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                  {recrue.prenom} {recrue.nom}
                                </CardTitle>
                                <CardDescription className="text-sm text-gray-600">
                                  Code: {recrue.codeVendeur || recrue.codevendeur}
                                </CardDescription>
                              </div>
                              {getStadeBadge(recrue.etapeActuelle)}
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-2">
                            {recrue.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{recrue.email}</span>
                              </div>
                            )}
                            {recrue.mobile && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{recrue.mobile}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(recrue.createdAt || recrue.createdAt)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Aucun recrutement trouvé
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {search ? "Aucun recrutement ne correspond à votre recherche." : "Commencez par ajouter votre premier recrutement."}
                        </p>
                        {!search && (
                          <Button 
                            onClick={handleAddRecrutement}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau recrutement
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}