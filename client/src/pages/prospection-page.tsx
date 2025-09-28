import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Clock, Users, Target, TrendingUp, Eye, Edit, Trash2, Calendar, Phone, MessageSquare, BarChart3, Filter, ArrowRight, Star, ChevronDown, Edit3, Info, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { ProspectionSelect, PROSPECTION_TYPES } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppLayout } from "@/components/layout/app-layout";

interface ProspectionForm {
  ville: string;
  codePostal: string;
  typeActivite: string;
  nombreContacts: number;
  contactsQualifies: number;
  rendezvousProgrammes: number;
  signatures: number;
  tempsPasse: number;
  secteur: string;
  commentaires: string;
  meteo: string;
  satisfaction: number;
  objectifs: any;
}

interface ProspectionStats {
  totalSessions: number;
  totalContacts: number;
  totalQualifies: number;
  totalSignatures: number;
  totalRdv: number;
  totalAbsents: number;
  tempsTotal: number;
  tauxQualification: number;
  tauxConversion: number;
  villesProspectees: string[];
  activiteFavorite: string;
}

const TYPES_ACTIVITE = [
  { value: "porte_a_porte", label: "🚪 Porte-à-porte", color: "bg-blue-500" },
  { value: "telephonie", label: "📞 Téléphonie", color: "bg-green-500" },
  { value: "evenement", label: "🎪 Événement", color: "bg-purple-500" },
  { value: "recommandation", label: "🤝 Recommandation", color: "bg-orange-500" },
  { value: "digital", label: "💻 Digital", color: "bg-indigo-500" }
];

const METEO_OPTIONS = [
  { value: "ensoleille", label: "☀️ Ensoleillé" },
  { value: "nuageux", label: "☁️ Nuageux" },
  { value: "pluvieux", label: "🌧️ Pluvieux" },
  { value: "orageux", label: "⛈️ Orageux" },
  { value: "neigeux", label: "❄️ Neigeux" }
];

export default function ProspectionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("sessions");
  const [searchTerm, setSearchTerm] = useState("");
  const [villeFilter, setVilleFilter] = useState("toutes");
  const [typeFilter, setTypeFilter] = useState("tous");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<ProspectionSelect | null>(null);
  
  const [formData, setFormData] = useState<ProspectionForm>({
    ville: "",
    codePostal: "",
    typeActivite: "porte_a_porte",
    nombreContacts: 0,
    contactsQualifies: 0,
    rendezvousProgrammes: 0,
    signatures: 0,
    tempsPasse: 0,
    secteur: "",
    commentaires: "",
    meteo: "ensoleille",
    satisfaction: 5,
    objectifs: {}
  });

  // État pour l'auto-complétion du code postal
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  // État pour gérer l'affichage des détails de chaque session
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());

  // Récupération des sessions de prospection terrain - ENDPOINT TEST BADGES COLLABORATIFS
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["/api/prospection-test"], // TEMPORAIRE pour test badges
  });

  // Récupération des statistiques de prospection terrain
  const { data: stats } = useQuery<ProspectionStats>({
    queryKey: ["/api/prospection-terrain/stats"],
  });

  // Mutation pour créer/modifier une session
  const createMutation = useMutation({
    mutationFn: async (data: ProspectionForm) => {
      if (editingSession) {
        return apiRequest(`/api/prospection/${editingSession.id}`, "PUT", data);
      } else {
        return apiRequest("/api/prospection", "POST", data);
      }
    },
    onSuccess: () => {
      toast({
        title: editingSession ? "Session modifiée" : "Session créée",
        description: `La session de prospection a été ${editingSession ? 'modifiée' : 'créée'} avec succès`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prospection"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prospection/stats"] });
      setShowAddDialog(false);
      setEditingSession(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  });

  // Mutation pour supprimer une session
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/prospection/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Session supprimée",
        description: "La session de prospection a été supprimée avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prospection"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prospection/stats"] });
    }
  });

  // Fonction pour récupérer automatiquement la ville depuis le code postal
  const fetchCityFromPostalCode = async (postalCode: string) => {
    if (postalCode.length !== 5 || !/^\d{5}$/.test(postalCode)) {
      setAvailableCities([]);
      setShowCitySuggestions(false);
      return;
    }
    
    setIsLoadingCity(true);
    try {
      const response = await fetch(`https://api.zippopotam.us/fr/${postalCode}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.places && data.places.length > 0) {
          if (data.places.length === 1) {
            // Une seule ville : remplissage automatique
            const city = data.places[0]['place name'];
            setFormData(prev => ({ ...prev, ville: city }));
            setAvailableCities([]);
            setShowCitySuggestions(false);
            toast({
              title: "Ville trouvée",
              description: `Ville automatiquement remplie : ${city}`,
              duration: 3000,
            });
          } else {
            // Plusieurs villes : affichage des suggestions
            const cities = data.places.map((place: any) => place['place name']);
            setAvailableCities(cities);
            setShowCitySuggestions(true);
            setFormData(prev => ({ ...prev, ville: '' })); // Vider pour forcer la sélection
            toast({
              title: "Plusieurs communes trouvées",
              description: `${data.places.length} communes correspondent à ce code postal. Sélectionnez votre commune.`,
              duration: 4000,
            });
          }
        } else {
          setAvailableCities([]);
          setShowCitySuggestions(false);
        }
      } else {
        setAvailableCities([]);
        setShowCitySuggestions(false);
      }
    } catch (error) {
      console.log('Erreur lors de la récupération de la ville:', error);
      setAvailableCities([]);
      setShowCitySuggestions(false);
    } finally {
      setIsLoadingCity(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ville: "",
      codePostal: "",
      typeActivite: "porte_a_porte",
      nombreContacts: 0,
      contactsQualifies: 0,
      rendezvousProgrammes: 0,
      signatures: 0,
      tempsPasse: 0,
      secteur: "",
      commentaires: "",
      meteo: "ensoleille",
      satisfaction: 5,
      objectifs: {}
    });
    setAvailableCities([]);
    setShowCitySuggestions(false);
  };

  const handleEdit = (session: ProspectionSelect) => {
    setEditingSession(session);
    setFormData({
      ville: session.ville,
      codePostal: session.codePostal || "",
      typeActivite: session.typeActivite,
      nombreContacts: session.nombreContacts || 0,
      contactsQualifies: session.contactsQualifies || 0,
      rendezvousProgrammes: session.rendezvousProgrammes || 0,
      signatures: session.signatures || 0,
      tempsPasse: session.tempsPasse || 0,
      secteur: session.secteur || "",
      commentaires: session.commentaires || "",
      meteo: session.meteo || "ensoleille",
      satisfaction: session.satisfaction || 5,
      objectifs: session.objectifs || {}
    });
    setShowAddDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ville.trim()) {
      toast({
        title: "Erreur",
        description: "La ville est obligatoire",
        variant: "destructive"
      });
      return;
    }
    createMutation.mutate(formData);
  };

  // Sessions filtrées (données prospection terrain)
  const filteredSessions = useMemo(() => {
    return (sessions as any[]).filter((session: any) => {
      const matchSearch = searchTerm === "" || 
        session.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.zone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.commercial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.adresse?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchVille = villeFilter === "toutes" || session.ville === villeFilter;
      const matchType = typeFilter === "tous" || session.statut === typeFilter;
      
      return matchSearch && matchVille && matchType;
    });
  }, [sessions, searchTerm, villeFilter, typeFilter]);

  // Villes uniques pour le filtre
  const villesUniques = useMemo(() => {
    const villes = new Set((sessions as any[]).map((s: any) => s.ville).filter(Boolean));
    return Array.from(villes).sort();
  }, [sessions]);

  const getTypeActiviteInfo = (type: string) => {
    return TYPES_ACTIVITE.find(t => t.value === type) || TYPES_ACTIVITE[0];
  };

  // Fonction pour basculer l'affichage des détails d'une session
  const toggleSessionDetails = (sessionId: number) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const getStatsCard = (title: string, value: number | string, icon: any, color: string, suffix = "") => (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>
              {value}{suffix}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')} ${color.replace('text-', 'text-')}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          
          {/* En-tête optimisé mobile */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl border border-white/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center mb-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-white" />
                  </div>
                  <span className="leading-tight">Prospection par Ville</span>
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                  Suivez et analysez votre travail commercial par zone géographique
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => {
                  window.location.href = "/prospection-terrain";
                }} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-10 md:h-auto"
                size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nouvelle Session</span>
                  <span className="sm:hidden">Nouvelle</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {getStatsCard(
              "Visites",
              stats?.totalQualifies || 0,
              <Users className="h-4 w-4" />,
              "text-green-600"
            )}
            {getStatsCard(
              "Signatures",
              stats?.totalSignatures || 0,
              <TrendingUp className="h-4 w-4" />,
              "text-purple-600"
            )}
            {getStatsCard(
              "RDV",
              stats?.totalRdv || 0,
              <Calendar className="h-4 w-4" />,
              "text-blue-600"
            )}
            {getStatsCard(
              "Absents",
              stats?.totalAbsents || 0,
              <Clock className="h-4 w-4" />,
              "text-orange-600"
            )}
          </div>

          {/* Onglets et filtres */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/40 shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par ville, secteur ou commentaire..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={villeFilter} onValueChange={setVilleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/50">
                      <SelectValue placeholder="Toutes les villes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toutes">Toutes les villes</SelectItem>
                      {villesUniques.map((ville: string) => (
                        <SelectItem key={ville} value={ville}>
                          {ville}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/50">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous les statuts</SelectItem>
                      <SelectItem value="planifiee">📅 Planifiée</SelectItem>
                      <SelectItem value="en_cours">🔄 En cours</SelectItem>
                      <SelectItem value="terminee">✓ Terminée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSession ? "Modifier la session" : "Nouvelle session de prospection"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="ville">Ville *</Label>
                    {showCitySuggestions && availableCities.length > 0 ? (
                      <Select 
                        value={formData.ville}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, ville: value }));
                          setShowCitySuggestions(false);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionnez votre commune" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="ville"
                        value={formData.ville}
                        onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                        placeholder="Nom de la ville"
                        required
                        className={formData.ville ? "bg-green-50 border-green-200" : ""}
                      />
                    )}
                  </div>
                  
                  <div className="relative">
                    <Label htmlFor="codePostal">Code Postal</Label>
                    <div className="relative">
                      <Input
                        id="codePostal"
                        value={formData.codePostal}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFormData(prev => ({ ...prev, codePostal: newValue }));
                          // Déclencher la recherche de ville si 5 chiffres
                          if (newValue.length === 5 && /^\d{5}$/.test(newValue)) {
                            fetchCityFromPostalCode(newValue);
                          } else if (newValue.length !== 5) {
                            setAvailableCities([]);
                            setShowCitySuggestions(false);
                            setFormData(prev => ({ ...prev, ville: '' }));
                          }
                        }}
                        placeholder="75001"
                        maxLength={5}
                      />
                      {isLoadingCity && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="typeActivite">Type d'activité</Label>
                    <Select 
                      value={formData.typeActivite} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, typeActivite: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES_ACTIVITE.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="secteur">Secteur/Quartier</Label>
                    <Input
                      id="secteur"
                      value={formData.secteur}
                      onChange={(e) => setFormData(prev => ({ ...prev, secteur: e.target.value }))}
                      placeholder="Centre-ville, Quartier résidentiel..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="nombreContacts">Contacts</Label>
                    <Input
                      id="nombreContacts"
                      type="number"
                      min="0"
                      value={formData.nombreContacts}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombreContacts: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactsQualifies">Qualifiés</Label>
                    <Input
                      id="contactsQualifies"
                      type="number"
                      min="0"
                      value={formData.contactsQualifies}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactsQualifies: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rendezvousProgrammes">RDV</Label>
                    <Input
                      id="rendezvousProgrammes"
                      type="number"
                      min="0"
                      value={formData.rendezvousProgrammes}
                      onChange={(e) => setFormData(prev => ({ ...prev, rendezvousProgrammes: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="signatures">Signatures</Label>
                    <Input
                      id="signatures"
                      type="number"
                      min="0"
                      value={formData.signatures}
                      onChange={(e) => setFormData(prev => ({ ...prev, signatures: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tempsPasse">Temps passé (min)</Label>
                    <Input
                      id="tempsPasse"
                      type="number"
                      min="0"
                      value={formData.tempsPasse}
                      onChange={(e) => setFormData(prev => ({ ...prev, tempsPasse: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="meteo">Météo</Label>
                    <Select 
                      value={formData.meteo} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, meteo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METEO_OPTIONS.map(meteo => (
                          <SelectItem key={meteo.value} value={meteo.value}>
                            {meteo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="satisfaction">Satisfaction (1-5)</Label>
                    <Select 
                      value={formData.satisfaction.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, satisfaction: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(note => (
                          <SelectItem key={note} value={note.toString()}>
                            {"⭐".repeat(note)} ({note}/5)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="commentaires">Commentaires</Label>
                  <Textarea
                    id="commentaires"
                    value={formData.commentaires}
                    onChange={(e) => setFormData(prev => ({ ...prev, commentaires: e.target.value }))}
                    placeholder="Notes, observations, difficultés rencontrées..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    {createMutation.isPending ? "Enregistrement..." : editingSession ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

          {/* Liste des sessions optimisée mobile */}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse bg-white/60">
                  <CardContent className="p-4">
                    <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredSessions.map((session: any) => {
                // Debug temporaire pour vérifier les données
                console.log(`🔍 Session ${session.id} debug:`, { 
                  createdBy: session.createdBy, 
                  userId: user?.id,
                  hasCreatedBy: !!session.createdBy,
                  userExists: !!user,
                  sessionKeys: Object.keys(session),
                  ville: session.ville
                });
                
                const statut = session.statut || "planifiee";
                const statutColor = statut === "terminee" ? "bg-green-500" : 
                                   statut === "en_cours" ? "bg-orange-500" : "bg-blue-500";
                const isExpanded = expandedSessions.has(session.id);
                
                return (
                  <Card key={session.id} className="bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-indigo-500 shadow-lg">
                    <CardContent className="p-4 md:p-5">
                      <div className="space-y-3">
                        {/* En-tête avec ville et statut */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg md:text-xl flex items-center text-gray-800 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2">
                                <MapPin className="h-3 w-3 text-white" />
                              </div>
                              {session.ville}
                              <span className="text-sm text-gray-500 ml-2">
                                {session.codePostal && `${session.codePostal}`}
                              </span>
                            </h3>
                            {/* 🔒 INDICATEUR COLLABORATIF - Badge du créateur de session */}
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <div className="flex items-center gap-2">
                                {/* Debug: afficher toujours les indicateurs avec valeurs par défaut */}
                                {session.createdBy && session.createdBy === user?.id ? (
                                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 font-bold rounded-lg text-xs">
                                    👤 Ma session
                                  </div>
                                ) : session.createdBy ? (
                                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 font-bold rounded-lg text-xs">
                                    👥 Équipe
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 font-bold rounded-lg text-xs">
                                    📊 Session terrain
                                  </div>
                                )}
                              </div>
                              
                              {/* 📅 BOUTON INFO DATES */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-blue-100">
                                      <History className="h-3 w-3 text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-xs">
                                    <div className="space-y-1 text-xs">
                                      <div className="font-semibold text-blue-700">📅 Historique des dates</div>
                                      <div>
                                        <span className="font-medium">Créée :</span> {session.createdAt ? format(new Date(session.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr }) : 'Non disponible'}
                                      </div>
                                      {session.updatedAt && session.updatedAt !== session.createdAt && (
                                        <div>
                                          <span className="font-medium">Modifiée :</span> {format(new Date(session.updatedAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                                        </div>
                                      )}
                                      <div>
                                        <span className="font-medium">Commercial :</span> {session.commercial || 'Non renseigné'}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          <Badge 
                            className={`${statutColor} text-white text-xs px-2 py-1 rounded-full`}
                            variant="secondary"
                          >
                            {statut === "terminee" ? "✓" : statut === "en_cours" ? "🔄" : "📅"}
                          </Badge>
                        </div>

                        {/* Adresse complète - TOUJOURS AFFICHÉE */}
                        {session.adresse && (
                          <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border-l-2 border-blue-300">
                            <MapPin className="h-3 w-3 inline mr-1 text-blue-500" />
                            <span className="font-medium">{session.adresse}</span>
                            {session.zone && <span className="text-gray-500"> - {session.zone}</span>}
                          </div>
                        )}

                        {/* Date */}
                        <div className="text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-lg">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {session.dateProspection ? 
                            format(new Date(session.dateProspection), "dd/MM/yyyy", { locale: fr }) :
                            format(new Date(session.createdAt || session.date || new Date()), "dd/MM/yyyy", { locale: fr })
                          }
                        </div>

                        {/* Tableau statistiques compact - TOUJOURS AFFICHÉ */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="grid grid-cols-5 gap-2 text-center text-sm">
                            <div>
                              <div className="text-blue-600 font-bold text-lg">{session.nombreContacts || 0}</div>
                              <div className="text-xs text-gray-500">Contacts</div>
                            </div>
                            <div>
                              <div className="text-green-600 font-bold text-lg">{session.contactsQualifies || 0}</div>
                              <div className="text-xs text-gray-500">Visites</div>
                            </div>
                            <div>
                              <div className="text-purple-600 font-bold text-lg">{session.signatures || 0}</div>
                              <div className="text-xs text-gray-500">Signatures</div>
                            </div>
                            <div>
                              <div className="text-orange-600 font-bold text-lg">{session.rendezvousProgrammes || 0}</div>
                              <div className="text-xs text-gray-500">RDV</div>
                            </div>
                            <div>
                              <div className="text-gray-600 font-bold text-lg">{((session.nombreContacts || 0) - (session.contactsQualifies || 0)) || 0}</div>
                              <div className="text-xs text-gray-500">Absents</div>
                            </div>
                          </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleSessionDetails(session.id)}
                            className="flex-1 bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            <span className="text-xs">Voir détails</span>
                            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingSession(session);
                              setFormData({
                                ville: session.ville || "",
                                codePostal: session.codePostal || "",
                                typeActivite: session.typeActivite || "porte_a_porte",
                                nombreContacts: session.nombreContacts || 0,
                                contactsQualifies: session.contactsQualifies || 0,
                                rendezvousProgrammes: session.rendezvousProgrammes || 0,
                                signatures: session.signatures || 0,
                                tempsPasse: session.tempsPasse || 0,
                                secteur: session.secteur || "",
                                commentaires: session.commentaires || "",
                                meteo: session.meteo || "ensoleille",
                                satisfaction: session.satisfaction || 5,
                                objectifs: session.objectifs || {}
                              });
                              setShowAddDialog(true);
                            }}
                            className="flex-1 bg-white hover:bg-green-50 border-green-200 text-green-700"
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            <span className="text-xs">Éditer détails</span>
                          </Button>
                        </div>

                        {/* Détails complets - CONDITIONNELS */}
                        <Collapsible open={isExpanded}>
                          <CollapsibleContent className="space-y-3">
                            {session.commercial && (
                              <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                                <span className="font-medium">Commercial: </span>{session.commercial}
                              </div>
                            )}
                            
                            {session.codeAcces && (
                              <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded-lg">
                                <span className="text-xs text-gray-600">Code d'accès: </span>
                                <span className="font-mono font-bold">{session.codeAcces}</span>
                              </div>
                            )}

                            {session.commentaires && (
                              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <span className="font-medium">Commentaires: </span>
                                <p className="mt-1">{session.commentaires}</p>
                              </div>
                            )}

                            {session.tempsPasse && (
                              <div className="text-sm text-gray-600">
                                <Clock className="h-3 w-3 inline mr-1" />
                                Temps passé: {session.tempsPasse} minutes
                              </div>
                            )}

                            {session.meteo && (
                              <div className="text-sm text-gray-600">
                                Météo: {METEO_OPTIONS.find(m => m.value === session.meteo)?.label || session.meteo}
                              </div>
                            )}

                            {session.satisfaction && (
                              <div className="text-sm text-gray-600">
                                Satisfaction: {"⭐".repeat(session.satisfaction)} ({session.satisfaction}/5)
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoading && filteredSessions.length === 0 && (
            <Card className="bg-white/80 backdrop-blur-sm border border-white/40 shadow-lg">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Aucune session trouvée</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm || villeFilter !== "toutes" || typeFilter !== "tous" 
                    ? "Aucune session ne correspond aux filtres sélectionnés. Essayez de modifier vos critères de recherche."
                    : "Commencez par créer votre première session de prospection pour suivre votre activité commerciale."
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => setShowAddDialog(true)} 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une session simple
                  </Button>
                  <Button onClick={() => window.location.href = "/prospection-terrain"} 
                          variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Session terrain complète
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Onglet Analytics à venir */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/40 shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-gray-800">
                <BarChart3 className="h-6 w-6 mr-2 text-blue-500" />
                Analyse par ville - À venir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Graphiques et analyses détaillées par ville seront disponibles prochainement.
              </p>
            </CardContent>
          </Card>
        </div>
    </AppLayout>
  );
}