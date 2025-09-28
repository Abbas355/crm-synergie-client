import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StableForm, StableField } from "@/components/ui/stable-form";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CalendarIcon, MapPin, Users, Clock, FileText, Plus, Edit, Building2, Trash2, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  ProspectionTerrainSessionSelect, 
  ProspectionTerrainContactSelect,
  ProspectionTerrainSessionInsert,
  ProspectionTerrainContactInsert
} from "@shared/schema";

// Nouveaux codes de statut selon demande utilisateur
const STATUTS_CODES = [
  { value: 'vide', label: 'Vide', color: 'bg-white' },
  { value: 'absent', label: 'Absent', color: 'bg-gray-100 text-gray-800' },
  { value: 'personne_agee', label: 'Personne Âgée/Vulnérable', color: 'bg-orange-100 text-orange-800' },
  { value: 'pas_interesse', label: 'Pas intéressé', color: 'bg-red-100 text-red-800' },
  { value: 'refus_ouvrir', label: 'Refus d\'ouvrir', color: 'bg-red-200 text-red-900' },
  { value: 'va_demenager', label: 'Va déménager', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'a_revoir', label: 'A revoir', color: 'bg-blue-100 text-blue-800' },
  { value: 'argumentation', label: 'Argumentation', color: 'bg-purple-100 text-purple-800' },
  { value: 'veux_reflechir', label: 'Veux réfléchir', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'voir_mr', label: 'Voir Mr', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'voir_mme', label: 'Voir Mme', color: 'bg-pink-100 text-pink-800' },
  { value: 'voir_parents', label: 'Voir les parents', color: 'bg-emerald-100 text-emerald-800' }
] as const;

// Options de produits pour les signatures
const PRODUITS_SIGNATURE = [
  { value: 'freebox_pop', label: '📦 Freebox Pop' },
  { value: 'freebox_essentiel', label: '📡 Freebox Essentiel' },
  { value: 'freebox_ultra', label: '🚀 Freebox Ultra' },
  { value: 'forfait_5g', label: '📱 Forfait 5G' },
  { value: 'freebox_sim', label: '📦📱 Freebox + Cartes SIM' }
] as const;

export default function ProspectionTerrainPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // États locaux
  const [selectedSession, setSelectedSession] = useState<ProspectionTerrainSessionSelect | null>(null);
  const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  // Détecter le paramètre mode=create dans l'URL pour ouvrir automatiquement le formulaire
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'create') {
      setIsNewSessionDialogOpen(true);
      // Nettoyer l'URL après avoir ouvert le dialog
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  const [selectedContact, setSelectedContact] = useState<ProspectionTerrainContactSelect | null>(null);
  const [sessionForm, setSessionForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    commercial: '',
    adresse: '',
    codePostal: '',
    ville: '',
    zone: '',
    codeAcces: ''
  });

  // État pour le système de recherche simplifié
  const [searchTerm, setSearchTerm] = useState('');



  // État pour l'auto-complétion du code postal
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  // État pour la persistance du numéro de bâtiment
  const [lastNumeroBat, setLastNumeroBat] = useState('');
  
  // État pour la persistance de l'étage
  const [lastEtage, setLastEtage] = useState('');
  
  const [contactForm, setContactForm] = useState({
    etage: '',
    numeroPorte: '',
    numeroBat: '',
    nom: '',
    resultatMatin: 'vide',
    resultatMidi: 'vide',
    resultatApresMidi: 'vide',
    resultatSoir: 'vide',
    rdvSignature: '',
    rdvSignatureType: '', // Nouveau: 'rdv' ou 'signature'
    produitSignature: '', // Nouveau: produit sélectionné pour signature
    rendezVousPris: '', // Nouveau: champ pour les RDV
    observations: '',
    mobile: '',
    email: '',
    operateurActuel: 'none',
    statusFinal: ''
  });

  // États pour le calendrier RDV
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // États pour la suppression de contact
  const [contactToDelete, setContactToDelete] = useState<ProspectionTerrainContactSelect | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showObservationsDialog, setShowObservationsDialog] = useState(false);
  const [selectedContactForObservations, setSelectedContactForObservations] = useState<ProspectionTerrainContactSelect | null>(null);
  
  // États pour l'édition de session
  const [isEditSessionDialogOpen, setIsEditSessionDialogOpen] = useState(false);
  const [editSessionForm, setEditSessionForm] = useState({
    id: 0,
    date: '',
    commercial: '',
    adresse: '',
    codePostal: '',
    ville: '',
    zone: '',
    codeAcces: ''
  });

  // États pour le zoom du tableau mobile
  const [tableZoom, setTableZoom] = useState(100);
  const [isMobile, setIsMobile] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Handlers optimisés avec useCallback pour éviter le tremblement
  const handleNumeroBatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setContactForm(prev => ({ ...prev, numeroBat: newValue }));
    if (newValue && newValue !== lastNumeroBat) {
      setLastNumeroBat(newValue);
    }
  }, [lastNumeroBat]);

  const handleEtageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setContactForm(prev => ({ ...prev, etage: newValue }));
    if (newValue && newValue !== lastEtage) {
      setLastEtage(newValue);
    }
  }, [lastEtage]);

  const handleNumeroPorteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContactForm(prev => ({ ...prev, numeroPorte: e.target.value }));
  }, []);

  const handleNomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContactForm(prev => ({ ...prev, nom: e.target.value }));
  }, []);

  const handleMobileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContactForm(prev => ({ ...prev, mobile: e.target.value }));
  }, []);

  const handleOperateurChange = useCallback((value: string) => {
    setContactForm(prev => ({ ...prev, operateurActuel: value }));
  }, []);

  const handleResultatMatinChange = useCallback((value: string) => {
    setContactForm(prev => ({ ...prev, resultatMatin: value }));
  }, []);

  const handleResultatMidiChange = useCallback((value: string) => {
    setContactForm(prev => ({ ...prev, resultatMidi: value }));
  }, []);

  const handleResultatApresMidiChange = useCallback((value: string) => {
    setContactForm(prev => ({ ...prev, resultatApresMidi: value }));
  }, []);

  const handleResultatSoirChange = useCallback((value: string) => {
    setContactForm(prev => ({ ...prev, resultatSoir: value }));
  }, []);

  const handleRdvSignatureTypeChange = useCallback((value: string) => {
    setContactForm(prev => ({ 
      ...prev, 
      rdvSignatureType: value,
      rdvSignature: '',
      produitSignature: '',
      rendezVousPris: ''
    }));
  }, []);

  const handleProduitSignatureChange = useCallback((value: string) => {
    setContactForm(prev => ({ ...prev, produitSignature: value }));
  }, []);

  const handleObservationsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContactForm(prev => ({ ...prev, observations: e.target.value }));
  }, []);

  const handleUseBatClick = useCallback(() => {
    setContactForm(prev => ({ ...prev, numeroBat: lastNumeroBat }));
  }, [lastNumeroBat]);

  const handleUseEtageClick = useCallback(() => {
    setContactForm(prev => ({ ...prev, etage: lastEtage }));
  }, [lastEtage]);

  // Fonctions de zoom pour le tableau mobile
  const handleZoomIn = useCallback(() => {
    setTableZoom(prev => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTableZoom(prev => Math.max(prev - 10, 50));
  }, []);

  const handleZoomReset = useCallback(() => {
    setTableZoom(100);
  }, []);

  // Handlers optimisés pour sessionForm aussi
  const handleSessionFormChange = useCallback((field: string, value: string) => {
    setSessionForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCitySelect = useCallback((value: string) => {
    setSessionForm(prev => ({ ...prev, ville: value }));
    setShowCitySuggestions(false);
  }, []);

  // Handler pour éditer une session
  const handleEditSession = useCallback(() => {
    if (!selectedSession) return;
    
    setEditSessionForm({
      id: selectedSession.id,
      date: format(new Date(selectedSession.date), 'yyyy-MM-dd'),
      commercial: selectedSession.commercial,
      adresse: selectedSession.adresse || '',
      codePostal: selectedSession.codePostal || '',
      ville: selectedSession.ville || '',
      zone: selectedSession.zone || '',
      codeAcces: selectedSession.codeAcces || ''
    });
    setIsEditSessionDialogOpen(true);
  }, [selectedSession]);

  // Fonction pour créer automatiquement une tâche lors d'un RDV
  const createTaskFromRDV = async (contactData: any, rdvDate: Date) => {
    try {
      const taskData = {
        title: `RDV Prospection - ${contactData.nom}`,
        description: `Rendez-vous de prospection terrain
Adresse: ${selectedSession?.adresse}, ${contactData.numeroBat ? `Bât. ${contactData.numeroBat}, ` : ''}Étage ${contactData.etage}, Porte ${contactData.numeroPorte}
Téléphone: ${contactData.mobile}
Zone: ${selectedSession?.zone}
Observations: ${contactData.observations || 'Aucune observation'}`,
        dueDate: rdvDate.toISOString(),
        priority: 'high',
        status: 'pending',
        type: 'rdv_prospection',
        clientId: null, // Pas encore client
        userId: user?.id
      };

      await apiRequest('POST', '/api/tasks', taskData);

      toast({
        title: "✅ Tâche créée automatiquement",
        description: "Une tâche de RDV a été créée dans votre planning",
        duration: 4000,
      });
    } catch (error) {
      console.error('Erreur création tâche RDV:', error);
    }
  };

  // Fonction pour formater la date et heure du RDV
  const formatRDVDateTime = (date: Date | undefined, time: string) => {
    if (!date || !time) return '';
    return `${format(date, 'dd/MM/yyyy', { locale: fr })} à ${time}`;
  };

  // Effect pour mettre à jour automatiquement le champ rendezVousPris
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const formattedDateTime = formatRDVDateTime(selectedDate, selectedTime);
      setContactForm(prev => ({ ...prev, rendezVousPris: formattedDateTime }));
    }
  }, [selectedDate, selectedTime]);

  // Données des sessions (optimisées)
  const { data: allSessions = [], isLoading: isLoadingSessions } = useQuery<ProspectionTerrainSessionSelect[]>({
    queryKey: ['/api/prospection-terrain/sessions'],
    staleTime: 5 * 60 * 1000, // 5 minutes de cache
    refetchOnWindowFocus: false,
  });

  // Fonction de filtrage des sessions
  const filterSessions = (sessions: ProspectionTerrainSessionSelect[]) => {
    return sessions.filter(session => {
      // Recherche générale dans tous les champs
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        const searchableFields = [
          session.adresse,
          session.ville,
          session.codePostal,
          session.commercial,
          session.zone || ''
        ].map(field => (field || '').toLowerCase());
        
        const matchesSearch = searchableFields.some(field => 
          field.includes(searchTermLower)
        );
        if (!matchesSearch) return false;
      }

      return true;
    });
  };

  // Sessions filtrées
  const sessions = filterSessions(allSessions);

  // Données des contacts pour une session (chargement différé)
  const { data: contactsData = [], isLoading: isLoadingContacts } = useQuery<ProspectionTerrainContactSelect[]>({
    queryKey: [`/api/prospection-terrain/contacts/${selectedSession?.id}`],
    enabled: !!selectedSession?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes de cache
    refetchOnWindowFocus: false,
  });

  // Tri des contacts par numéro de bâtiment en ordre décroissant
  const contacts = contactsData.sort((a, b) => {
    const batA = a.numeroBat || '';
    const batB = b.numeroBat || '';
    
    // Extraire la lettre et le numéro de chaque bâtiment
    const lettreA = batA.match(/[A-Z]/)?.[0] || '';
    const lettreB = batB.match(/[A-Z]/)?.[0] || '';
    const numA = parseInt(batA.replace(/[^0-9]/g, '')) || 0;
    const numB = parseInt(batB.replace(/[^0-9]/g, '')) || 0;
    
    // Si les lettres sont différentes, trier par lettre en ordre décroissant (Z, Y, ..., B, A)
    if (lettreA !== lettreB) {
      // Bâtiments sans lettre vont à la fin
      if (!lettreA && lettreB) return 1;
      if (lettreA && !lettreB) return -1;
      if (!lettreA && !lettreB) return numB - numA; // Tri par numéro si pas de lettres
      
      // Tri alphabétique décroissant (B avant A)
      return lettreB.localeCompare(lettreA);
    }
    
    // Si même lettre, trier par numéro en ordre décroissant
    return numB - numA;
  });

  // Récupérer l'historique d'un logement spécifique (seulement quand nécessaire)
  const { data: historiqueLogement = [], isLoading: isHistoriqueLoading } = useQuery<any[]>({
    queryKey: ['/api/prospection-terrain/historique', contactForm.numeroBat || 'undefined', contactForm.etage, contactForm.numeroPorte],
    enabled: !!(contactForm.etage && contactForm.numeroPorte && isContactDialogOpen), // Seulement si dialog ouvert et données saisies
    staleTime: 10 * 60 * 1000, // 10 minutes de cache pour l'historique
    refetchOnWindowFocus: false,
  });

  // Récupérer les statistiques globales depuis l'API backend
  // Statistiques spécifiques à la session sélectionnée
  const { data: sessionStats } = useQuery({
    queryKey: [`/api/prospection-terrain/stats/${selectedSession?.id}`],
    enabled: !!selectedSession?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes de cache
    refetchOnWindowFocus: false,
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
            setSessionForm(prev => ({ ...prev, ville: city }));
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
            setSessionForm(prev => ({ ...prev, ville: '' })); // Vider pour forcer la sélection
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

  // Mettre à jour le nom du commercial quand les données utilisateur sont chargées
  useEffect(() => {
    if (user && !sessionForm.commercial) {
      // Essayer différentes combinaisons de noms possibles
      let commercial = '';
      if (user.prenom && user.nom) {
        commercial = `${user.prenom} ${user.nom}`;
      } else if (user.nom) {
        commercial = user.nom;
      } else if (user.username) {
        commercial = user.username;
      } else {
        commercial = 'Utilisateur connecté';
      }
      
      setSessionForm(prev => ({ 
        ...prev, 
        commercial 
      }));
    }
  }, [user, sessionForm.commercial]);

  // Sélectionner automatiquement la première session
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions, selectedSession]);

  // Mutation pour créer une session
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: Partial<ProspectionTerrainSessionInsert>) => {
      return await apiRequest('POST', '/api/prospection-terrain/sessions', sessionData);
    },
    onSuccess: () => {
      // Invalider toutes les queries liées pour mise à jour complète
      queryClient.invalidateQueries({ queryKey: ['/api/prospection-terrain/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prospection-terrain/stats'] });
      // Invalider les stats de session si une session est sélectionnée
      if (selectedSession?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/prospection-terrain/stats/${selectedSession.id}`] });
      }
      setIsNewSessionDialogOpen(false);
      // Garder le nom du commercial pour la prochaine session
      let commercial = '';
      if (user?.prenom && user?.nom) {
        commercial = `${user.prenom} ${user.nom}`;
      } else if (user?.nom) {
        commercial = user.nom;
      } else if (user?.username) {
        commercial = user.username;
      } else {
        commercial = 'Utilisateur connecté';
      }
      
      setSessionForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        commercial,
        adresse: '',
        codePostal: '',
        ville: '',
        zone: '',
        codeAcces: ''
      });
      setAvailableCities([]);
      setShowCitySuggestions(false);
      toast({
        title: "✅ Session créée",
        description: "La session de prospection terrain a été créée avec succès",
        duration: 4000,
      });
    },
    onError: (error: any) => {
      console.error('❌ Erreur création session:', error);
      const errorMessage = error?.message || "Problème technique lors de la création. Vérifiez vos données et réessayez.";
      toast({
        title: "❌ Erreur de création",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    },
  });

  // Mutation pour modifier une session
  const updateSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      console.log('🔄 DÉBUT modification session:', sessionData);
      try {
        const result = await apiRequest('PUT', `/api/prospection-terrain/sessions/${sessionData.id}`, sessionData);
        console.log('✅ Modification session réussie:', result);
        return result;
      } catch (error) {
        console.error('❌ ERREUR dans mutationFn:', error);
        throw error;
      }
    },
    onSuccess: (updatedSession) => {
      // Invalider et forcer le rechargement immédiat de toutes les queries liées
      queryClient.invalidateQueries({ queryKey: ['/api/prospection-terrain/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prospection-terrain/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prospection-terrain/contacts'] });
      
      // Forcer un refetch immédiat pour mettre à jour l'affichage
      queryClient.refetchQueries({ queryKey: ['/api/prospection-terrain/sessions'] });
      queryClient.refetchQueries({ queryKey: ['/api/prospection-terrain/stats'] });
      
      setIsEditSessionDialogOpen(false);
      toast({
        title: "✅ Session modifiée",
        description: "La session de prospection terrain a été modifiée avec succès",
        duration: 4000,
      });
    },
    onError: (error: any) => {
      console.error('❌ Erreur modification session:', error);
      const errorMessage = error?.message || "Problème technique lors de la modification. Vérifiez vos données et réessayez.";
      toast({
        title: "❌ Erreur de modification",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    },
  });

  // Mutation pour supprimer un contact
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return await apiRequest('DELETE', `/api/prospection-terrain/contacts/${contactId}`);
    },
    onSuccess: () => {
      // Invalider toutes les queries liées pour mise à jour complète
      queryClient.invalidateQueries({ queryKey: [`/api/prospection-terrain/contacts/${selectedSession?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/prospection-terrain/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prospection-terrain/stats'] });
      // Invalider les stats de session spécifiques
      if (selectedSession?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/prospection-terrain/stats/${selectedSession.id}`] });
      }
      
      toast({
        title: "✅ Contact supprimé",
        description: "Le contact a été supprimé avec succès",
        duration: 4000,
      });
      
      // Fermer le dialog de confirmation s'il est ouvert
      setContactToDelete(null);
      setShowDeleteConfirm(false);
    },
    onError: (error: any) => {
      console.error('❌ Erreur suppression contact:', error);
      const errorMessage = error?.message || "Problème technique lors de la suppression.";
      toast({
        title: "❌ Erreur de suppression",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    },
  });

  // Mutation pour créer/modifier un contact
  const saveContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      if (contactData.id) {
        return await apiRequest('PUT', `/api/prospection-terrain/contacts/${contactData.id}`, contactData);
      } else {
        return await apiRequest('POST', '/api/prospection-terrain/contacts', contactData);
      }
    },
    onSuccess: () => {
      // Invalider toutes les requêtes de contacts pour cette session
      queryClient.invalidateQueries({ queryKey: [`/api/prospection-terrain/contacts/${selectedSession?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/prospection-terrain/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prospection-terrain/stats'] });
      // Invalider les stats de session spécifiques
      if (selectedSession?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/prospection-terrain/stats/${selectedSession.id}`] });
      }
      
      // Fermer la modale et réinitialiser le formulaire
      setIsContactDialogOpen(false);
      setSelectedContact(null);
      setContactForm({
        etage: '',
        numeroPorte: '',
        numeroBat: lastNumeroBat, // Utiliser le dernier numéro de bâtiment saisi
        nom: '',
        resultatMatin: 'vide',
        resultatMidi: 'vide',
        resultatApresMidi: 'vide',
        resultatSoir: 'vide',
        rdvSignature: '',
        rdvSignatureType: '',
        produitSignature: '', // Ajouter le champ manquant
        rendezVousPris: '',
        observations: '',
        mobile: '',
        email: '',
        operateurActuel: 'none',
        statusFinal: ''
      });
      
      toast({
        title: "✅ Contact sauvegardé",
        description: "Les informations du contact ont été sauvegardées avec succès",
        duration: 4000,
      });
    },
    onError: (error: any) => {
      console.error('❌ Erreur sauvegarde contact:', error);
      const errorMessage = error?.message || "Problème technique lors de la sauvegarde. Vérifiez vos données et réessayez.";
      toast({
        title: "❌ Erreur de sauvegarde",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    },
  });

  const handleCreateSession = () => {
    if (!sessionForm.commercial || !sessionForm.adresse || !sessionForm.ville) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const sessionData = {
      ...sessionForm,
      zone: sessionForm.zone || "Zone principale", // Valeur par défaut si vide
      statut: 'planifiee' as const
    };

    createSessionMutation.mutate(sessionData);
  };

  const handleSaveContact = () => {
    if (!selectedSession) {
      toast({
        title: "Erreur",
        description: "Aucune session sélectionnée",
        variant: "destructive",
      });
      return;
    }

    if (!contactForm.etage || !contactForm.numeroPorte) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir l'étage et le numéro de porte",
        variant: "destructive",
      });
      return;
    }

    // Validation conditionnelle selon le type RDV/Signature
    if (contactForm.rdvSignatureType === 'rdv') {
      if (!contactForm.nom || !contactForm.mobile || !contactForm.rendezVousPris) {
        toast({
          title: "Champs requis pour RDV",
          description: "Pour un RDV : Nom, Mobile et détails du rendez-vous sont obligatoires",
          variant: "destructive",
        });
        return;
      }
    } else if (contactForm.rdvSignatureType === 'signature') {
      if (!contactForm.nom) {
        toast({
          title: "Champs requis pour Signature",
          description: "Pour une Signature : Nom et Prénom sont obligatoires",
          variant: "destructive",
        });
        return;
      }
    }

    // Sauvegarder le numéro de bâtiment pour persistance
    if (contactForm.numeroBat && contactForm.numeroBat !== lastNumeroBat) {
      setLastNumeroBat(contactForm.numeroBat);
    }

    const contactData = {
      ...contactForm,
      sessionId: selectedSession.id,
      ...(selectedContact?.id && { id: selectedContact.id }),
      statusFinal: contactForm.statusFinal || undefined,
    };

    // Créer une tâche automatiquement si c'est un RDV avec date/heure
    if (contactForm.rdvSignatureType === 'rdv' && selectedDate && selectedTime) {
      const rdvDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      rdvDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      // Créer la tâche en arrière-plan après la sauvegarde du contact
      setTimeout(() => createTaskFromRDV(contactData, rdvDateTime), 500);
    }

    saveContactMutation.mutate(contactData);
  };

  // ============================================
  // RÈGLES DE PROTECTION DES PROSPECTS
  // ============================================
  
  // Vérifier si un contact a un RDV validé ou une signature
  const isContactProtected = (contact: ProspectionTerrainContactSelect): boolean => {
    // Contact avec RDV validé
    if (contact.rdvSignatureType === 'rdv' && contact.rendezVousPris) {
      return true;
    }
    
    // Contact avec signature
    if (contact.rdvSignatureType === 'signature' && contact.rdvSignature) {
      return true;
    }
    
    // Status final RDV ou signature
    if (contact.statusFinal === 'RDV' || contact.statusFinal === 'SIGNATURE') {
      return true;
    }
    
    return false;
  };

  // Vérifier si l'utilisateur actuel est le créateur original
  const isOriginalCreator = (contact: ProspectionTerrainContactSelect): boolean => {
    // Utiliser d'abord les informations du backend (isOwner/createdByMe) si disponibles
    if ('isOwner' in contact && typeof contact.isOwner === 'boolean') {
      console.log(`🔍 SÉCURITÉ - Contact ${contact.id}: isOwner=${contact.isOwner}, user.id=${user?.id}, createdBy=${contact.createdBy}`);
      return contact.isOwner;
    }
    if ('createdByMe' in contact && typeof contact.createdByMe === 'boolean') {
      console.log(`🔍 SÉCURITÉ - Contact ${contact.id}: createdByMe=${contact.createdByMe}, user.id=${user?.id}, createdBy=${contact.createdBy}`);
      return contact.createdByMe;
    }
    
    // Fallback sur la comparaison locale
    const isCreator = contact.createdBy === user?.id;
    console.log(`🔍 SÉCURITÉ - Contact ${contact.id}: createdBy=${contact.createdBy}, user.id=${user?.id}, isCreator=${isCreator}`);
    return isCreator;
  };

  // Vérifier si l'utilisateur peut éditer le contact
  const canEditContact = (contact: ProspectionTerrainContactSelect): boolean => {
    const isProtected = isContactProtected(contact);
    const isCreator = isOriginalCreator(contact);
    
    // Si le contact est protégé, seul le créateur original peut l'éditer
    if (isProtected) {
      return isCreator;
    }
    
    // Sinon, tout le monde peut éditer
    return true;
  };

  // Vérifier si l'utilisateur peut supprimer le contact
  const canDeleteContact = (contact: ProspectionTerrainContactSelect): boolean => {
    const isProtected = isContactProtected(contact);
    const isCreator = isOriginalCreator(contact);
    
    // Si le contact est protégé, seul le créateur original peut le supprimer
    if (isProtected) {
      return isCreator;
    }
    
    // Sinon, tout le monde peut supprimer
    return true;
  };

  // Vérifier si l'utilisateur peut voir les champs confidentiels (téléphone/observations)
  const canViewConfidentialFields = (contact: ProspectionTerrainContactSelect): boolean => {
    return isOriginalCreator(contact);
  };

  // Gestion de la suppression de contact avec protection
  const handleDeleteContact = (contact: ProspectionTerrainContactSelect) => {
    if (!canDeleteContact(contact)) {
      toast({
        title: "Action non autorisée",
        description: "Seul le vendeur qui a créé ce prospect avec RDV/signature peut le supprimer.",
        variant: "destructive",
      });
      return;
    }
    
    setContactToDelete(contact);
    setShowDeleteConfirm(true);
  };

  const handleShowObservations = (contact: ProspectionTerrainContactSelect) => {
    setSelectedContactForObservations(contact);
    setShowObservationsDialog(true);
  };

  const confirmDeleteContact = () => {
    if (contactToDelete?.id) {
      deleteContactMutation.mutate(contactToDelete.id);
    }
  };

  const handleEditContact = (contact: ProspectionTerrainContactSelect) => {
    if (!canEditContact(contact)) {
      toast({
        title: "Action non autorisée",
        description: "Seul le vendeur qui a créé ce prospect avec RDV/signature peut le modifier.",
        variant: "destructive",
      });
      return;
    }
    setSelectedContact(contact);
    setContactForm({
      etage: contact.etage?.toString() || '',
      numeroPorte: contact.numeroPorte || '',
      numeroBat: contact.numeroBat || '',
      nom: contact.nom || '',
      resultatMatin: contact.resultatMatin || 'vide',
      resultatMidi: contact.resultatMidi || 'vide',
      resultatApresMidi: contact.resultatApresMidi || 'vide',
      resultatSoir: contact.resultatSoir || 'vide',
      rdvSignature: contact.rdvSignature || '',
      rdvSignatureType: contact.rdvSignatureType || '',
      produitSignature: contact.produitSignature || '',
      rendezVousPris: contact.rendezVousPris || '',
      observations: contact.observations || '',
      mobile: contact.mobile || '',
      email: contact.email || '',
      operateurActuel: contact.operateurActuel || 'Orange',
      statusFinal: contact.statusFinal || 'vide'
    });

    // Réinitialiser les états du calendrier pour l'édition
    setSelectedDate(undefined);
    setSelectedTime('');
    setIsCalendarOpen(false);

    // Si c'est un RDV avec une date, essayer de parser la date existante
    if (contact.rdvSignatureType === 'rdv' && contact.rendezVousPris) {
      const rdvText = contact.rendezVousPris;
      // Essayer de parser "DD/MM/YYYY à HH:MM"
      const dateTimeMatch = rdvText.match(/(\d{2}\/\d{2}\/\d{4})\s+à\s+(\d{2}:\d{2})/);
      if (dateTimeMatch) {
        const [, dateStr, timeStr] = dateTimeMatch;
        const [day, month, year] = dateStr.split('/');
        const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        setSelectedDate(parsedDate);
        setSelectedTime(timeStr);
      }
    }

    setIsContactDialogOpen(true);
  };

  const getStatutBadge = (statut?: string | null) => {
    if (!statut || statut === 'vide') return null;
    const statutInfo = STATUTS_CODES.find(s => s.value === statut);
    if (!statutInfo) return <span className="text-xs px-1">{statut}</span>;
    
    return (
      <Badge className={`${statutInfo.color} text-xs px-1 py-0`}>
        {statutInfo.label}
      </Badge>
    );
  };



  // Calculer les statistiques globales de la session
  const getSessionStats = (session: ProspectionTerrainSessionSelect) => {
    const sessionContacts = contacts.filter(c => c.sessionId === session.id);
    
    const visites = sessionContacts.length;
    const rdv = sessionContacts.filter(c => c.rdvSignature?.includes('RDV') || c.rdvSignature?.includes('rdv')).length;
    const signatures = sessionContacts.filter(c => 
      c.rdvSignature?.toLowerCase().includes('signature') || 
      c.statusFinal === 'signature'
    ).length;
    
    // LOGIQUE CORRIGÉE POUR LES ABSENTS
    const absents = sessionContacts.filter(c => {
      const resultats = [c.resultatMatin, c.resultatMidi, c.resultatApresMidi, c.resultatSoir];
      
      // Vérifier s'il y a au moins une tentative d'absence (ABS ou absent)
      const aDesAbsences = resultats.some(r => 
        r === 'ABS' || r === 'absent'
      );
      
      // Vérifier s'il y a eu au moins un contact réussi
      const aEteContacte = resultats.some(r => 
        r && r !== 'vide' && r !== 'ABS' && r !== 'absent' && r !== 'FER'
      );
      
      // Contact absent définitif = a des absences ET n'a jamais été contacté avec succès
      return aDesAbsences && !aEteContacte;
    }).length;
    
    // LOGIQUE CORRIGÉE POUR LES REFUS (même principe que les absents)
    const refus = sessionContacts.filter(c => {
      const resultats = [c.resultatMatin, c.resultatMidi, c.resultatApresMidi, c.resultatSoir];
      
      // Vérifier s'il y a au moins un "pas intéressé"
      const aPasInteret = resultats.some(r => 
        r === 'pas_interesse' || r === 'refus' || r === 'PAS_INTERESSE'
      );
      
      // Vérifier s'il y a eu au moins un contact réussi (signature, RDV, etc.)
      const aEteContacteAvecSucces = resultats.some(r => 
        r === 'signature' || r === 'rdv' || r === 'interesse'
      );
      
      // Contact refus définitif = a refusé ET n'a jamais été contacté avec succès
      return aPasInteret && !aEteContacteAvecSucces;
    }).length;

    return { visites, rdv, signatures, absents, refus };
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-2 md:p-4">
        <div className="max-w-7xl mx-auto space-y-2 md:space-y-4">
          
          {/* En-tête moderne avec sélection de session */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-3 md:p-6 shadow-xl border-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-indigo-50/30 to-purple-50/40 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-lg opacity-40"></div>
                    <div className="relative w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl">
                      <Building2 className="h-5 w-5 md:h-7 md:w-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent leading-tight">
                      Prospection Terrain
                    </h1>
                    <p className="text-slate-600 font-semibold text-xs md:text-base">Saisir les informations de prospection</p>
                  </div>
                </div>
              </div>
              {/* Boutons d'action - Mobile optimisé */}
              <div className="flex flex-col md:flex-row gap-2">
                <Button 
                  onClick={() => window.location.href = '/analyse-ville'}
                  className="relative group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold px-3 md:px-6 py-2 md:py-3 h-10 md:h-12 rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 group-hover:from-white/10 group-hover:to-white/30 transition-all duration-300"></div>
                  <div className="relative flex items-center justify-center gap-2 md:gap-3">
                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="text-sm md:text-lg">Analyse Ville</span>
                  </div>
                </Button>
                <Button 
                  onClick={() => setIsNewSessionDialogOpen(true)}
                  disabled={createSessionMutation.isPending}
                  className="relative group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-3 md:px-6 py-2 md:py-3 h-10 md:h-12 rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 group-hover:from-white/10 group-hover:to-white/30 transition-all duration-300"></div>
                  {createSessionMutation.isPending ? (
                    <div className="relative flex items-center justify-center gap-2 md:gap-3">
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm md:text-lg">Création...</span>
                    </div>
                  ) : (
                    <div className="relative flex items-center justify-center gap-2 md:gap-3">
                      <Plus className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-sm md:text-lg">Nouvelle Session</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {/* Système de recherche et filtres - Mobile optimisé */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-3 md:p-4 rounded-xl border border-slate-200/50 mb-4">
              {/* Barre de recherche principale */}
              <div className="flex flex-col md:flex-row gap-3 mb-3">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="🔍 Rechercher adresse, ville, zone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 md:h-12 pl-10 md:pl-12 rounded-lg md:rounded-xl border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-white/70 backdrop-blur-sm text-sm md:text-base"
                    />
                    <div className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>



              {/* Compteur de résultats */}
              <div className="flex items-center justify-between mt-3 text-sm text-slate-600">
                <span>
                  {sessions.length === allSessions.length 
                    ? `${sessions.length} session${sessions.length > 1 ? 's' : ''} au total`
                    : `${sessions.length} session${sessions.length > 1 ? 's' : ''} trouvée${sessions.length > 1 ? 's' : ''} sur ${allSessions.length} au total`
                  }
                </span>
                {sessions.length !== allSessions.length && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Filtré
                  </Badge>
                )}
              </div>
            </div>

            {/* Message si aucune session ne correspond aux critères */}
            {sessions.length === 0 && allSessions.length > 0 && (
              <div className="text-center py-8">
                <div className="bg-orange-50/80 border-2 border-orange-200 rounded-xl p-6 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-orange-800 mb-2">Aucune session trouvée</h3>
                  <p className="text-orange-700 text-sm">
                    Les critères de recherche ne correspondent à aucune session de prospection. 
                    Effacez la recherche pour voir toutes les sessions.
                  </p>
                </div>
              </div>
            )}

            {/* Message si aucune session n'existe */}
            {allSessions.length === 0 && (
              <div className="text-center py-8">
                <div className="bg-blue-50/80 border-2 border-blue-200 rounded-xl p-6 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-800 mb-2">Aucune session de prospection</h3>
                  <p className="text-blue-700 text-sm mb-4">
                    Créez votre première session de prospection terrain pour commencer.
                  </p>
                </div>
              </div>
            )}

            {/* Sélecteur de session optimisé mobile */}
            {sessions.length > 0 && (
              <div className="relative flex flex-col gap-3">
                <Label className="text-sm md:text-base font-bold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                  Session active : {selectedSession ? selectedSession.zone : "Aucune sélectionnée"}
                </Label>
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                  <Select 
                    value={selectedSession?.id?.toString() || ''} 
                    onValueChange={(value) => {
                      const session = sessions.find(s => s.id === parseInt(value));
                      setSelectedSession(session || null);
                    }}
                  >
                    <SelectTrigger className="w-full h-11 md:h-12 rounded-lg md:rounded-xl border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-white/70 backdrop-blur-sm">
                      <SelectValue placeholder="Sélectionner une session" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg md:rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl max-h-[70vh] w-full">
                      {sessions
                        .sort((a, b) => a.ville.localeCompare(b.ville))
                        .map((session) => (
                          <SelectItem key={session.id} value={session.id.toString()} className="rounded-md hover:bg-blue-50 focus:bg-blue-100 py-2 md:py-3">
                            <div className="flex items-center gap-2 w-full">
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex-shrink-0"></div>
                              <span className="font-semibold text-slate-800 truncate">{session.zone}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Bouton Éditer Session - Mobile optimisé */}
                  {selectedSession && (
                    <Button
                      onClick={handleEditSession}
                      size="sm"
                      variant="outline"
                      className="h-11 md:h-12 px-3 md:px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group min-w-[80px] md:min-w-[120px]"
                    >
                      <Edit className="h-4 w-4 md:mr-2 group-hover:scale-110 transition-transform" />
                      <span className="hidden md:inline">Éditer</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fiche de session actuelle - Design mobile optimisé */}
          {selectedSession && (
            <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-xl rounded-xl md:rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-100/30 pointer-events-none"></div>
              <CardHeader className="relative pb-2 p-2 md:p-4">
                {/* Version mobile compacte */}
                <div className="block md:hidden">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">📅</span>
                        <span className="font-bold text-slate-800">{format(new Date(selectedSession.date), 'dd/MM/yyyy')}</span>
                      </div>
                      {/* Badge collaboratif mobile */}
                      {selectedSession.createdBy === user?.id ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 font-bold rounded text-xs">
                          👤 Ma session
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 font-bold rounded text-xs">
                          👥 Équipe
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">
                      <div className="truncate">👤 {selectedSession.commercial}</div>
                      <div className="truncate">📍 {selectedSession.adresse}</div>
                      <div className="flex items-center gap-4 mt-1">
                        <span>🏷️ {selectedSession.codePostal}</span>
                        <span>🏙️ {selectedSession.ville}</span>
                        {selectedSession.zone && <span>🏘️ {selectedSession.zone}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Version desktop grille */}
                <div className="hidden md:grid grid-cols-3 gap-3">
                  <div className="group bg-gradient-to-br from-blue-50 to-blue-100/70 p-3 rounded-lg border border-blue-200/50 hover:shadow-lg transition-all duration-300">
                    <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold mb-1">📅 Date</div>
                    <div className="font-bold text-slate-800 text-lg">{format(new Date(selectedSession.date), 'dd/MM/yyyy')}</div>
                  </div>
                  <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100/70 p-3 rounded-lg border border-emerald-200/50 hover:shadow-lg transition-all duration-300">
                    <div className="text-xs text-emerald-600 uppercase tracking-wider font-semibold mb-1">👤 Commercial</div>
                    <div className="font-bold text-slate-800 text-base truncate">{selectedSession.commercial}</div>
                  </div>
                  <div className="group bg-gradient-to-br from-purple-50 to-purple-100/70 p-3 rounded-lg border border-purple-200/50 hover:shadow-lg transition-all duration-300">
                    <div className="text-xs text-purple-600 uppercase tracking-wider font-semibold mb-1">📍 Adresse</div>
                    <div className="font-bold text-slate-800 text-base truncate">{selectedSession.adresse}</div>
                  </div>
                  <div className="group bg-gradient-to-br from-orange-50 to-orange-100/70 p-3 rounded-lg border border-orange-200/50 hover:shadow-lg transition-all duration-300">
                    <div className="text-xs text-orange-600 uppercase tracking-wider font-semibold mb-1">🏷️ Code Postal</div>
                    <div className="font-bold text-slate-800 text-base">{selectedSession.codePostal}</div>
                  </div>
                  <div className="group bg-gradient-to-br from-cyan-50 to-cyan-100/70 p-3 rounded-lg border border-cyan-200/50 hover:shadow-lg transition-all duration-300">
                    <div className="text-xs text-cyan-600 uppercase tracking-wider font-semibold mb-1">🏙️ Ville</div>
                    <div className="font-bold text-slate-800 text-base">{selectedSession.ville}</div>
                  </div>
                  {selectedSession.zone && (
                    <div className="group bg-gradient-to-br from-rose-50 to-rose-100/70 p-3 rounded-lg border border-rose-200/50 hover:shadow-lg transition-all duration-300">
                      <div className="text-xs text-rose-600 uppercase tracking-wider font-semibold mb-1">🏘️ Zone</div>
                      <div className="font-bold text-slate-800 text-base">{selectedSession.zone}</div>
                    </div>
                  )}
                </div>

                {/* Statistiques globales - Optimisées mobile */}
                <div className="space-y-3 mt-3">
                  {/* Version mobile compacte */}
                  <div className="block md:hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">Statistiques :</span>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedContact(null);
                          setContactForm({
                            etage: '',
                            numeroPorte: '',
                            numeroBat: lastNumeroBat,
                            nom: '',
                            resultatMatin: 'vide',
                            resultatMidi: 'vide',
                            resultatApresMidi: 'vide',
                            resultatSoir: 'vide',
                            rdvSignature: '',
                            rdvSignatureType: '',
                            produitSignature: '',
                            rendezVousPris: '',
                            observations: '',
                            mobile: '',
                            email: '',
                            operateurActuel: 'none',
                            statusFinal: 'vide'
                          });
                          setSelectedDate(undefined);
                          setSelectedTime('');
                          setIsCalendarOpen(false);
                          setIsContactDialogOpen(true);
                        }}
                        size="sm"
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-600">{getSessionStats(selectedSession).visites}</div>
                        <div className="text-xs text-blue-700 font-semibold">Visites</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-green-600">{getSessionStats(selectedSession).rdv}</div>
                        <div className="text-xs text-green-700 font-semibold">RDV</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-emerald-600">{getSessionStats(selectedSession).signatures}</div>
                        <div className="text-xs text-emerald-700 font-semibold">Signatures</div>
                      </div>
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-slate-600">{getSessionStats(selectedSession).absents}</div>
                        <div className="text-xs text-slate-700 font-semibold">Absents</div>
                      </div>
                    </div>
                  </div>

                  {/* Version desktop complète */}
                  <div className="hidden md:block">
                    <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-200/30 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">ℹ</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-800">Logique de comptage des "Absents"</span>
                      </div>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        <strong>Absent Définitif :</strong> Contact qui a été marqué "absent" à au moins un créneau MAIS n'a jamais été joint avec succès à aucun autre créneau.
                        <br />
                        <strong>Exemple :</strong> Absent matin + Contact midi = <span className="text-green-600 font-semibold">Non compté comme absent</span> (car contacté avec succès)
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-6 gap-3 pt-3 border-t border-slate-200/50">
                      <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200/50 hover:shadow-lg transition-all duration-300 group">
                        <div className="text-2xl font-black text-blue-600 group-hover:scale-110 transition-transform duration-300">{getSessionStats(selectedSession).visites}</div>
                        <div className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Visites</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200/50 hover:shadow-lg transition-all duration-300 group">
                        <div className="text-2xl font-black text-green-600 group-hover:scale-110 transition-transform duration-300">{getSessionStats(selectedSession).rdv}</div>
                        <div className="text-xs text-green-700 font-semibold uppercase tracking-wide">RDV</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg border border-emerald-200/50 hover:shadow-lg transition-all duration-300 group">
                        <div className="text-2xl font-black text-emerald-600 group-hover:scale-110 transition-transform duration-300">{getSessionStats(selectedSession).signatures}</div>
                        <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Signatures</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200/50 hover:shadow-lg transition-all duration-300 group">
                        <div className="text-2xl font-black text-slate-600 group-hover:scale-110 transition-transform duration-300">{getSessionStats(selectedSession).absents}</div>
                        <div className="text-xs text-slate-700 font-semibold uppercase tracking-wide">Absents</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg border border-red-200/50 hover:shadow-lg transition-all duration-300 group">
                        <div className="text-2xl font-black text-red-600 group-hover:scale-110 transition-transform duration-300">{getSessionStats(selectedSession).refus}</div>
                        <div className="text-xs text-red-700 font-semibold uppercase tracking-wide">Refus</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 rounded-lg border border-indigo-200/50 hover:shadow-lg transition-all duration-300">
                        <Button 
                          onClick={() => {
                            setSelectedContact(null);
                            setContactForm({
                              etage: '',
                              numeroPorte: '',
                              numeroBat: lastNumeroBat,
                              nom: '',
                              resultatMatin: 'vide',
                              resultatMidi: 'vide',
                              resultatApresMidi: 'vide',
                              resultatSoir: 'vide',
                              rdvSignature: '',
                              rdvSignatureType: '',
                              produitSignature: '',
                              rendezVousPris: '',
                              observations: '',
                              mobile: '',
                              email: '',
                              operateurActuel: 'none',
                              statusFinal: 'vide'
                            });
                            setSelectedDate(undefined);
                            setSelectedTime('');
                            setIsCalendarOpen(false);
                            setIsContactDialogOpen(true);
                          }}
                          className="w-full h-10 text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nouveau Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative p-3 md:p-6">
                {/* Tableau de prospection format Eric Bat I Charrel - Design mobile optimisé */}
                
                {/* Contrôles de zoom pour mobile */}
                <div className="md:hidden flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-semibold text-slate-700">Zoom tableau</div>
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    <Button
                      onClick={handleZoomOut}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-blue-50"
                      disabled={tableZoom <= 50}
                    >
                      <span className="text-lg font-bold">-</span>
                    </Button>
                    <div className="text-xs font-bold text-slate-700 px-2 min-w-12 text-center bg-slate-50 rounded">
                      {tableZoom}%
                    </div>
                    <Button
                      onClick={handleZoomIn}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-blue-50"
                      disabled={tableZoom >= 200}
                    >
                      <span className="text-lg font-bold">+</span>
                    </Button>
                    <Button
                      onClick={handleZoomReset}
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-blue-50"
                    >
                      100%
                    </Button>
                  </div>
                </div>
                
                {/* Affichage en tableau unifié pour mobile et desktop */}
                <div 
                  ref={tableRef}
                  className="overflow-x-auto -mx-1 md:mx-0 rounded-xl border border-slate-200/50"
                  style={{
                    transform: isMobile ? `scale(${tableZoom / 100})` : 'none',
                    transformOrigin: 'top left',
                    width: isMobile ? `${100 / (tableZoom / 100)}%` : '100%'
                  }}
                >
                  <Table className="text-xs min-w-[800px]">
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 border-b border-slate-200/50">
                        <TableHead className="w-14 md:w-16 text-center font-black text-indigo-700 py-2 px-1">🏢 N° Bat.</TableHead>
                        <TableHead className="w-10 md:w-12 text-center font-bold text-slate-700 py-2 px-1">📏 Étg.</TableHead>
                        <TableHead className="w-14 md:w-16 text-center font-bold text-slate-700 py-2 px-1">🚪 N°PORTE</TableHead>
                        <TableHead className="w-14 md:w-16 text-center font-bold text-amber-700 py-2 px-1">🌅 Matin</TableHead>
                        <TableHead className="w-14 md:w-16 text-center font-bold text-orange-700 py-2 px-1">☀️ Midi</TableHead>
                        <TableHead className="w-16 md:w-20 text-center font-bold text-blue-700 py-2 px-1">🌤️ Après-Midi</TableHead>
                        <TableHead className="w-16 md:w-20 text-center font-bold text-purple-700 py-2 px-1">🌆 Soir (18H+)</TableHead>
                        <TableHead className="w-20 md:w-24 text-center font-bold text-green-700 py-2 px-1">✅ RDV/Signature</TableHead>
                        <TableHead className="w-24 md:w-28 text-center font-bold text-slate-700 py-2 px-1">👤 Nom</TableHead>
                        <TableHead className="min-w-32 md:min-w-36 text-center font-bold text-slate-700 py-2 px-1">📝 Observations/Mobile</TableHead>
                        <TableHead className="w-14 md:w-16 text-center font-bold text-slate-700 py-2 px-1">⚙️ Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingContacts ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8">
                            Chargement des contacts...
                          </TableCell>
                        </TableRow>
                      ) : contacts.length > 0 ? (
                        contacts.map((contact, index) => (
                          <TableRow key={contact.id} className="hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-indigo-50/40 transition-all duration-300 group border-b border-slate-100/50">
                            <TableCell className="text-center font-black text-indigo-700 bg-gradient-to-r from-indigo-50 to-indigo-100/60 py-2 px-1">
                              <div className="inline-flex items-center justify-center min-w-10 h-8 bg-indigo-600 text-white rounded-xl font-bold text-sm group-hover:scale-105 transition-transform duration-300 px-2">
                                {contact.numeroBat || '?'}
                              </div>
                              {/* Badge collaboratif pour identifier les propriétaires des données */}
                              {contact.createdBy === user?.id ? (
                                <div className="mt-1 inline-flex items-center gap-1 px-1 py-0.5 bg-green-100 text-green-800 font-bold rounded text-xs">
                                  👤 Mes données
                                </div>
                              ) : (
                                <div className="mt-1 inline-flex items-center gap-1 px-1 py-0.5 bg-orange-100 text-orange-800 font-bold rounded text-xs">
                                  👥 Équipe
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-bold text-slate-800 py-2 px-1 bg-slate-50/50">{contact.etage}</TableCell>
                            <TableCell className="text-center font-black text-slate-900 bg-gradient-to-r from-slate-100 to-slate-50 py-2 px-1">
                              <div className="inline-flex items-center justify-center w-16 h-8 bg-slate-700 text-white rounded-xl font-bold">
                                {contact.numeroPorte}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 bg-amber-50/40">
                              <div className="flex flex-col items-center gap-1">
                                {getStatutBadge(contact.resultatMatin)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 bg-orange-50/40">
                              <div className="flex flex-col items-center gap-1">
                                {getStatutBadge(contact.resultatMidi)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 bg-blue-50/40">
                              <div className="flex flex-col items-center gap-1">
                                {getStatutBadge(contact.resultatApresMidi)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 bg-purple-50/40">
                              <div className="flex flex-col items-center gap-1">
                                {getStatutBadge(contact.resultatSoir)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 bg-green-50/40">
                              <div className="flex flex-col items-center gap-1 max-w-28">
                                {contact.rdvSignature && contact.rdvSignature.trim() !== '' ? (
                                  <div className="text-xs text-green-700 font-bold bg-green-100 px-2 py-1 rounded-lg border border-green-300 max-w-full truncate">
                                    ✅ {contact.rdvSignature}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Aucun RDV</span>
                                )}
                                
                                {contact.produitSignature && (
                                  <div className="text-xs text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded border border-blue-200 max-w-full truncate">
                                    📦 {PRODUITS_SIGNATURE.find(p => p.value === contact.produitSignature)?.label || contact.produitSignature}
                                  </div>
                                )}
                                
                                {contact.rendezVousPris && contact.rendezVousPris.trim() !== '' && (
                                  <div className="text-xs text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded border border-purple-200 max-w-full truncate">
                                    📅 {contact.rendezVousPris}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-1 bg-slate-50/30">
                              <div className="flex flex-col items-center gap-1 max-w-36">
                                <div className="text-sm font-bold text-slate-800 text-center truncate max-w-full">
                                  {contact.nom ? `👤 ${contact.nom}` : '—'}
                                </div>
                                {contact.email && (
                                  <div className="text-xs text-blue-600 truncate max-w-full">
                                    📧 {contact.email}
                                  </div>
                                )}
                                {contact.operateurActuel && contact.operateurActuel !== 'none' && (
                                  <div className="text-xs text-orange-600 font-semibold bg-orange-50 px-1 py-0.5 rounded">
                                    📡 {contact.operateurActuel}
                                  </div>
                                )}
                                {/* Indicateur de protection */}
                                {(() => {
                                  const isProtected = isContactProtected(contact);
                                  const isCreator = isOriginalCreator(contact);
                                  
                                  if (isProtected) {
                                    return (
                                      <div className={`text-xs font-bold px-2 py-1 rounded border ${
                                        isCreator 
                                          ? "bg-green-100 text-green-800 border-green-300" 
                                          : "bg-red-100 text-red-800 border-red-300"
                                      }`} title={
                                        isCreator 
                                          ? `Prospect protégé - Vous pouvez le modifier (${contact.rdvSignatureType || 'RDV/signature'})`
                                          : `Prospect protégé - Seul le vendeur original peut le modifier (${contact.rdvSignatureType || 'RDV/signature'})`
                                      }>
                                        {isCreator ? "🔓" : "🔒"} {contact.rdvSignatureType === 'rdv' ? 'RDV' : contact.rdvSignatureType === 'signature' ? 'SIGNATURE' : 'PROTÉGÉ'}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-1 bg-yellow-50/30">
                              <div className="flex flex-col items-center gap-1 max-w-44">
                                {(() => {
                                  const canViewConfidential = canViewConfidentialFields(contact);
                                  
                                  return (
                                    <>
                                      {contact.mobile && canViewConfidential && (
                                        <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 truncate max-w-full">
                                          📱 {contact.mobile}
                                        </div>
                                      )}
                                      {contact.mobile && !canViewConfidential && (
                                        <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-300 truncate max-w-full" title="Téléphone masqué - Visible seulement par le vendeur original">
                                          📱 ••••••••••
                                        </div>
                                      )}
                                      {contact.observations && contact.observations.trim() !== '' && canViewConfidential && (
                                        <div className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded border border-yellow-300 max-w-full line-clamp-2 text-left">
                                          📝 {contact.observations}
                                        </div>
                                      )}
                                      {contact.observations && contact.observations.trim() !== '' && !canViewConfidential && (
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-300 max-w-full truncate" title="Observations masquées - Visibles seulement par le vendeur original">
                                          📝 ••••••••••
                                        </div>
                                      )}
                                      {!contact.mobile && !contact.observations && (
                                        <span className="text-xs text-gray-400 italic">—</span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <div className="flex flex-col gap-1 items-center">
                                {(() => {
                                  const canEdit = canEditContact(contact);
                                  const canDelete = canDeleteContact(contact);
                                  const isProtected = isContactProtected(contact);
                                  const isCreator = isOriginalCreator(contact);
                                  
                                  return (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditContact(contact)}
                                        disabled={!canEdit}
                                        className={`h-8 px-3 rounded-lg font-semibold ${
                                          canEdit 
                                            ? "hover:bg-blue-100 text-blue-600" 
                                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                                        }`}
                                        title={
                                          !canEdit && isProtected 
                                            ? `Prospect protégé avec ${contact.rdvSignatureType || 'RDV/signature'}. Seul le vendeur original peut modifier.`
                                            : "Modifier ce contact"
                                        }
                                      >
                                        <Edit className="h-4 w-4 mr-1" />
                                        {isProtected && !isCreator ? "🔒" : "Modifier"}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteContact(contact)}
                                        disabled={!canDelete}
                                        className={`h-8 px-3 rounded-lg font-semibold ${
                                          canDelete 
                                            ? "hover:bg-red-100 text-red-600" 
                                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                                        }`}
                                        title={
                                          !canDelete && isProtected 
                                            ? `Prospect protégé avec ${contact.rdvSignatureType || 'RDV/signature'}. Seul le vendeur original peut supprimer.`
                                            : "Supprimer ce contact"
                                        }
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        {isProtected && !isCreator ? "🔒" : "Supprimer"}
                                      </Button>
                                    </>
                                  );
                                })()}
                              </div>
                            </TableCell>
                          </TableRow>
                        )) 
                      ) : (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-12 text-gray-500">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                <Plus className="h-8 w-8 text-blue-500" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-700 mb-2">Aucun contact pour cette session</div>
                                <p className="text-sm text-gray-500">Cliquez sur "Nouveau Contact" pour ajouter votre premier contact</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message si aucune session */}
          {!isLoadingSessions && sessions.length === 0 && (
            <Card className="bg-white/60 backdrop-blur-sm border border-white/30">
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune session de prospection</h3>
                <p className="text-gray-600 mb-4">Créez votre première session de prospection terrain pour commencer</p>
                <Button 
                  onClick={() => setIsNewSessionDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une session
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog Nouvelle Session */}
      <Dialog open={isNewSessionDialogOpen} onOpenChange={setIsNewSessionDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/30">
          <DialogHeader className="text-center space-y-3 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Nouvelle Session
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Créer une nouvelle session de prospection terrain
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pb-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Date de prospection *
              </Label>
              <Input
                id="date"
                type="date"
                value={sessionForm.date}
                onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="commercial" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Commercial *
              </Label>
              <div className="relative">
                <Input
                  id="commercial"
                  placeholder="Nom du commercial"
                  value={sessionForm.commercial}
                  onChange={(e) => setSessionForm({ ...sessionForm, commercial: e.target.value })}
                  className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                    sessionForm.commercial 
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800 font-medium" 
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                />
                {!sessionForm.commercial && (
                  <button
                    type="button"
                    onClick={() => {
                      let commercial = 'Commercial';
                      if (user?.prenom && user?.nom) {
                        commercial = `${user.prenom} ${user.nom}`;
                      } else if (user?.nom) {
                        commercial = user.nom;
                      } else if (user?.username) {
                        commercial = user.username;
                      }
                      setSessionForm({ ...sessionForm, commercial });
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Remplir
                  </button>
                )}
              </div>
              <p className={`text-xs flex items-center gap-1 ${
                sessionForm.commercial ? "text-green-600" : "text-red-600"
              }`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  {sessionForm.commercial ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  ) : (
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                  )}
                </svg>
                {sessionForm.commercial ? "Rempli automatiquement" : "Champ requis - Cliquez sur Remplir"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Adresse de prospection *
              </Label>
              <Input
                id="adresse"
                placeholder="3, Rue Eugénie ou Avenue des Jardins..."
                value={sessionForm.adresse}
                onChange={(e) => setSessionForm({ ...sessionForm, adresse: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative space-y-2">
                <Label htmlFor="codePostal" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Code Postal
                </Label>
                <div className="relative">
                  <Input
                    id="codePostal" 
                    placeholder="83400"
                    value={sessionForm.codePostal}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSessionForm({ ...sessionForm, codePostal: newValue });
                      if (newValue.length === 5 && /^\d{5}$/.test(newValue)) {
                        fetchCityFromPostalCode(newValue);
                      } else if (newValue.length !== 5) {
                        setAvailableCities([]);
                        setShowCitySuggestions(false);
                        setSessionForm(prev => ({ ...prev, ville: '' }));
                      }
                    }}
                    maxLength={5}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 pr-10"
                  />
                  {isLoadingCity && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative space-y-2">
                <Label htmlFor="ville" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  Ville *
                </Label>
                {showCitySuggestions && availableCities.length > 0 ? (
                  <Select 
                    value={sessionForm.ville}
                    onValueChange={(value) => {
                      setSessionForm({ ...sessionForm, ville: value });
                      setShowCitySuggestions(false);
                    }}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="Sélectionnez votre commune" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-w-[90vw] max-h-[200px] overflow-auto">
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city} className="rounded-lg break-words text-left">
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="ville"
                    placeholder="Hyères"
                    value={sessionForm.ville}
                    onChange={(e) => setSessionForm({ ...sessionForm, ville: e.target.value })}
                    className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                      sessionForm.ville 
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800 font-medium" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    }`}
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Quartier/Résidence/Zone
              </Label>
              <Input
                id="zone"
                placeholder="Centre-ville, Résidence Les Jardins, Zone commerciale..."
                value={sessionForm.zone}
                onChange={(e) => setSessionForm({ ...sessionForm, zone: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="codeAcces" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                </svg>
                Code d'Accès
              </Label>
              <Input
                id="codeAcces"
                placeholder="A1234, Digicode 5698..."
                value={sessionForm.codeAcces}
                onChange={(e) => setSessionForm({ ...sessionForm, codeAcces: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all duration-200"
              />
              <p className="text-xs text-gray-500">Code d'accès immeuble ou résidence (optionnel)</p>
            </div>
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <Button 
                variant="outline"
                onClick={() => setIsNewSessionDialogOpen(false)}
                className="flex-1 h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {createSessionMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Créer Session
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition de session */}
      <Dialog open={isEditSessionDialogOpen} onOpenChange={setIsEditSessionDialogOpen}>
        <DialogContent className="sm:max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white p-6 -m-6 mb-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Edit className="h-4 w-4" />
                </div>
                Modifier la Session
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-2">
              <Label htmlFor="edit-date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                Date de prospection *
              </Label>
              <Input
                id="edit-date"
                type="date"
                value={editSessionForm.date}
                onChange={(e) => setEditSessionForm({ ...editSessionForm, date: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-commercial" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                Commercial *
              </Label>
              <Input
                id="edit-commercial"
                placeholder="Nom et prénom du commercial"
                value={editSessionForm.commercial}
                onChange={(e) => setEditSessionForm({ ...editSessionForm, commercial: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-adresse" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                Adresse de prospection *
              </Label>
              <Input
                id="edit-adresse"
                placeholder="3, Rue Eugénie ou Avenue des Jardins..."
                value={editSessionForm.adresse}
                onChange={(e) => setEditSessionForm({ ...editSessionForm, adresse: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-codePostal" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-500" />
                  Code Postal
                </Label>
                <Input
                  id="edit-codePostal"
                  placeholder="83400"
                  value={editSessionForm.codePostal}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, codePostal: e.target.value })}
                  maxLength={5}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ville" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Ville *
                </Label>
                <Input
                  id="edit-ville"
                  placeholder="Hyères"
                  value={editSessionForm.ville}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, ville: e.target.value })}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-zone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Quartier/Résidence/Zone
              </Label>
              <Input
                id="edit-zone"
                placeholder="Centre-ville, Résidence Les Jardins, Zone commerciale..."
                value={editSessionForm.zone}
                onChange={(e) => setEditSessionForm({ ...editSessionForm, zone: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-codeAcces" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1921 9z"></path>
                </svg>
                Code d'Accès
              </Label>
              <Input
                id="edit-codeAcces"
                placeholder="A1234, Digicode 5698..."
                value={editSessionForm.codeAcces}
                onChange={(e) => setEditSessionForm({ ...editSessionForm, codeAcces: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all duration-200"
              />
              <p className="text-xs text-gray-500">Code d'accès immeuble ou résidence (optionnel)</p>
            </div>
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <Button 
                variant="outline"
                onClick={() => setIsEditSessionDialogOpen(false)}
                className="flex-1 h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Annuler
              </Button>
              <Button 
                onClick={() => updateSessionMutation.mutate(editSessionForm)}
                disabled={updateSessionMutation.isPending}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {updateSessionMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Modification...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier Session
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Contact - Design moderne et chic */}
      <Dialog open={isContactDialogOpen} onOpenChange={(open) => {
        setIsContactDialogOpen(open);
        if (!open) {
          // Réinitialiser les états du calendrier quand on ferme le dialog
          setSelectedDate(undefined);
          setSelectedTime('');
          setIsCalendarOpen(false);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto mx-4 rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-100/20 pointer-events-none rounded-3xl"></div>
          
          <DialogHeader className="relative text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <DialogTitle className="text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {selectedContact ? "Modifier le contact" : "Nouveau Contact"}
            </DialogTitle>
            <DialogDescription className="text-slate-600 font-medium text-lg">
              Merci de saisir ici les informations de votre prospection
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informations de base */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-800">Informations de base</h4>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroBat" className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black">B</span>
                    N° Bat. *
                    {lastNumeroBat && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        📍 Actuel: {lastNumeroBat}
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="numeroBat"
                      placeholder="A, B, 1, 2..."
                      value={contactForm.numeroBat}
                      onChange={handleNumeroBatChange}
                      className="h-12 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 font-bold text-center"
                    />
                    {lastNumeroBat && contactForm.numeroBat !== lastNumeroBat && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleUseBatClick}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 h-8"
                      >
                        Utiliser {lastNumeroBat}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="etage" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-100 text-slate-700 rounded-lg text-xs font-black">É</span>
                    Étage *
                    {lastEtage && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        📍 Actuel: {lastEtage}
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="etage"
                      placeholder="1, 2, RDC..."
                      value={contactForm.etage}
                      onChange={handleEtageChange}
                      className="h-12 rounded-xl border-2 border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all duration-300 font-bold text-center"
                    />
                    {lastEtage && contactForm.etage !== lastEtage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleUseEtageClick}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 h-8"
                      >
                        Utiliser {lastEtage}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroPorte" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-100 text-slate-700 rounded-lg text-xs font-black">P</span>
                    N° Porte *
                  </Label>
                  <Input
                    id="numeroPorte"
                    placeholder="101, 202..."
                    value={contactForm.numeroPorte}
                    onChange={handleNumeroPorteChange}
                    className="h-12 rounded-xl border-2 border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all duration-300 font-bold text-center"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Nom du contact
                  {(contactForm.rdvSignatureType === 'rdv' || contactForm.rdvSignatureType === 'signature') && (
                    <span className="text-red-600 font-bold">*</span>
                  )}
                </Label>
                <Input
                  id="nom"
                  placeholder="Nom et prénom du contact"
                  value={contactForm.nom}
                  onChange={handleNomChange}
                  className={`h-12 rounded-xl border-2 transition-all duration-300 ${
                    (contactForm.rdvSignatureType === 'rdv' || contactForm.rdvSignatureType === 'signature') 
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                  }`}
                />
                {(contactForm.rdvSignatureType === 'rdv' || contactForm.rdvSignatureType === 'signature') && !contactForm.nom && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    Nom obligatoire pour ce type de résultat
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  Téléphone mobile
                  {contactForm.rdvSignatureType === 'rdv' && (
                    <span className="text-red-600 font-bold">*</span>
                  )}
                </Label>
                <Input
                  id="mobile"
                  placeholder="06 01 02 03 04"
                  value={contactForm.mobile}
                  onChange={handleMobileChange}
                  className={`h-12 rounded-xl border-2 transition-all duration-300 ${
                    contactForm.rdvSignatureType === 'rdv' 
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
                {contactForm.rdvSignatureType === 'rdv' && !contactForm.mobile && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    Mobile obligatoire pour les RDV
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="operateurActuel" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
                  </svg>
                  Opérateur actuel
                </Label>
                <Select 
                  value={contactForm.operateurActuel} 
                  onValueChange={handleOperateurChange}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300">
                    <SelectValue placeholder="Sélectionner l'opérateur" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl max-w-[90vw] max-h-[200px] overflow-auto">
                    <SelectItem value="none" className="rounded-lg text-gray-500 break-words">Aucun opérateur renseigné</SelectItem>
                    <SelectItem value="Orange" className="rounded-lg break-words">🟠 Orange</SelectItem>
                    <SelectItem value="SFR" className="rounded-lg break-words">🔴 SFR</SelectItem>
                    <SelectItem value="Bouygues" className="rounded-lg break-words">🔵 Bouygues</SelectItem>
                    <SelectItem value="Free" className="rounded-lg break-words">⚫ Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Historique des passages */}
            {historiqueLogement && historiqueLogement.length > 1 && (
              <div className="lg:col-span-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-orange-800">📋 Historique des passages</h4>
                  {isHistoriqueLoading && (
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                
                <div className="text-sm text-orange-700 mb-3 font-semibold">
                  🏠 {historiqueLogement.length} passage(s) enregistré(s) pour ce logement
                </div>
                
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {historiqueLogement.map((passage: any, index: number) => (
                    <div key={passage.id} className="bg-white/70 rounded-xl p-3 border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-orange-800">
                          🗓️ {passage.session ? format(new Date(passage.session.date), 'dd/MM/yyyy', { locale: fr }) : 'Date inconnue'}
                        </div>
                        <div className="text-sm text-orange-600">
                          📍 {passage.session?.zone || 'Zone inconnue'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-semibold">👤 Nom:</span> {passage.nom || 'Non renseigné'}
                        </div>
                        <div>
                          <span className="font-semibold">📱 Tél:</span> {passage.mobile || 'Non renseigné'}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-1 mt-2">
                        {passage.resultatMatin && passage.resultatMatin !== 'vide' && (
                          <div className="text-xs">🌅 {passage.resultatMatin}</div>
                        )}
                        {passage.resultatMidi && passage.resultatMidi !== 'vide' && (
                          <div className="text-xs">☀️ {passage.resultatMidi}</div>
                        )}
                        {passage.resultatApresMidi && passage.resultatApresMidi !== 'vide' && (
                          <div className="text-xs">🌇 {passage.resultatApresMidi}</div>
                        )}
                        {passage.resultatSoir && passage.resultatSoir !== 'vide' && (
                          <div className="text-xs">🌙 {passage.resultatSoir}</div>
                        )}
                      </div>
                      {passage.observations && (
                        <div className="mt-2 text-xs bg-orange-50 rounded-lg p-2">
                          <span className="font-semibold">💬 Notes:</span> {passage.observations}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Résultats par créneau */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-800">Résultats par créneau</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resultatMatin" className="text-sm font-bold text-amber-700 flex items-center gap-2">
                    <span className="text-base">🌅</span>
                    Matin (8h-12h)
                  </Label>
                  <Select 
                    value={contactForm.resultatMatin} 
                    onValueChange={handleResultatMatinChange}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300">
                      <SelectValue placeholder="Sélectionner le résultat" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl max-w-[90vw] max-h-[200px] overflow-auto">
                      {STATUTS_CODES.map(statut => (
                        <SelectItem key={statut.value} value={statut.value} className="rounded-lg break-words">
                          {statut.label || "Vide"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resultatMidi" className="text-sm font-bold text-orange-700 flex items-center gap-2">
                    <span className="text-base">☀️</span>
                    Midi (12h-14h)
                  </Label>
                  <Select 
                    value={contactForm.resultatMidi} 
                    onValueChange={handleResultatMidiChange}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300">
                      <SelectValue placeholder="Sélectionner le résultat" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl max-w-[90vw] max-h-[200px] overflow-auto">
                      {STATUTS_CODES.map(statut => (
                        <SelectItem key={statut.value} value={statut.value} className="rounded-lg break-words">
                          {statut.label || "Vide"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resultatApresMidi" className="text-sm font-bold text-blue-700 flex items-center gap-2">
                    <span className="text-base">🌤️</span>
                    Après-midi (14h-18h)
                  </Label>
                  <Select 
                    value={contactForm.resultatApresMidi} 
                    onValueChange={handleResultatApresMidiChange}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300">
                      <SelectValue placeholder="Sélectionner le résultat" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl max-w-[90vw] max-h-[200px] overflow-auto">
                      {STATUTS_CODES.map(statut => (
                        <SelectItem key={statut.value} value={statut.value} className="rounded-lg break-words">
                          {statut.label || "Vide"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resultatSoir" className="text-sm font-bold text-purple-700 flex items-center gap-2">
                    <span className="text-base">🌆</span>
                    Soir (18h+)
                  </Label>
                  <Select 
                    value={contactForm.resultatSoir} 
                    onValueChange={handleResultatSoirChange}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300">
                      <SelectValue placeholder="Sélectionner le résultat" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl max-w-[90vw] max-h-[200px] overflow-auto">
                      {STATUTS_CODES.map(statut => (
                        <SelectItem key={statut.value} value={statut.value} className="rounded-lg break-words">
                          {statut.label || "Vide"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rdvSignatureType" className="text-sm font-bold text-green-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Type de résultat
                  </Label>
                  <Select 
                    value={contactForm.rdvSignatureType} 
                    onValueChange={handleRdvSignatureTypeChange}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300">
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl max-w-[90vw] max-h-[200px] overflow-auto">
                      <SelectItem value="rdv" className="rounded-lg break-words">📅 RDV</SelectItem>
                      <SelectItem value="signature" className="rounded-lg break-words">✍️ Signature</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Validation conditionnelle pour RDV */}
                {contactForm.rdvSignatureType === 'rdv' && (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="text-sm text-blue-700 font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Pour un RDV : Nom, Prénom et Mobile sont obligatoires
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-blue-700 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-blue-500" />
                        Rendez-vous pris *
                      </Label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Sélection de la date */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-blue-600">📅 Date du RDV</Label>
                          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full h-12 rounded-xl border-2 justify-start text-left font-normal ${
                                  !selectedDate 
                                    ? "text-muted-foreground border-blue-200" 
                                    : "border-blue-400 bg-blue-50 text-blue-800"
                                }`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: fr }) : "Sélectionner une date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-xl border-0 shadow-2xl" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                  setSelectedDate(date);
                                  setIsCalendarOpen(false);
                                }}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="rounded-xl"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Sélection de l'heure */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-blue-600">🕐 Heure du RDV</Label>
                          <Select value={selectedTime} onValueChange={setSelectedTime}>
                            <SelectTrigger className={`h-12 rounded-xl border-2 ${
                              selectedTime 
                                ? "border-blue-400 bg-blue-50 text-blue-800" 
                                : "border-blue-200"
                            }`}>
                              <SelectValue placeholder="Choisir l'heure" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl max-h-60 max-w-[90vw] overflow-auto">
                              {/* Créneaux du matin */}
                              <div className="p-2 text-xs font-semibold text-amber-600 border-b">🌅 Matin</div>
                              {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'].map(time => (
                                <SelectItem key={time} value={time} className="rounded-lg break-words">{time}</SelectItem>
                              ))}
                              
                              {/* Créneaux du midi */}
                              <div className="p-2 text-xs font-semibold text-orange-600 border-b">☀️ Midi</div>
                              {['12:00', '12:30', '13:00', '13:30', '14:00'].map(time => (
                                <SelectItem key={time} value={time} className="rounded-lg break-words">{time}</SelectItem>
                              ))}
                              
                              {/* Créneaux de l'après-midi */}
                              <div className="p-2 text-xs font-semibold text-blue-600 border-b">🌇 Après-midi</div>
                              {['14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'].map(time => (
                                <SelectItem key={time} value={time} className="rounded-lg break-words">{time}</SelectItem>
                              ))}
                              
                              {/* Créneaux du soir */}
                              <div className="p-2 text-xs font-semibold text-purple-600 border-b">🌆 Soir</div>
                              {['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].map(time => (
                                <SelectItem key={time} value={time} className="rounded-lg break-words">{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Récapitulatif du RDV */}
                      {selectedDate && selectedTime && (
                        <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border border-blue-300">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                            <span className="font-bold text-blue-800">RDV planifié</span>
                          </div>
                          <div className="text-sm text-blue-700">
                            📅 <strong>{format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}</strong> à <strong>{selectedTime}</strong>
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            ✅ Une tâche sera automatiquement créée dans votre planning
                          </div>
                        </div>
                      )}

                      {/* Champ masqué mais toujours présent pour la validation */}
                      <input type="hidden" value={contactForm.rendezVousPris} />
                    </div>
                  </div>
                )}

                {/* Validation conditionnelle pour Signature */}
                {contactForm.rdvSignatureType === 'signature' && (
                  <div className="space-y-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                    <div className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Pour une Signature : Nom, Prénom et Produit sont obligatoires
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="produitSignature" className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        Produit signé *
                      </Label>
                      <Select 
                        value={contactForm.produitSignature} 
                        onValueChange={handleProduitSignatureChange}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300">
                          <SelectValue placeholder="Sélectionner le produit" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl max-w-[90vw] max-h-[200px] overflow-auto">
                          {PRODUITS_SIGNATURE.map(produit => (
                            <SelectItem key={produit.value} value={produit.value} className="rounded-lg break-words">
                              {produit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    

                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Observations - Pleine largeur */}
          <div className="relative space-y-4 mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-800">Observations détaillées</h4>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observations" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Notes et observations de la prospection
              </Label>
              <Textarea
                id="observations"
                placeholder="Détails sur le contact, commentaires, informations particulières, suite à donner..."
                rows={4}
                value={contactForm.observations}
                onChange={handleObservationsChange}
                className="rounded-xl border-2 border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all duration-300 resize-none"
              />
            </div>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200/50">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsContactDialogOpen(false);
                setSelectedContact(null);
              }}
              className="flex-1 sm:flex-none h-12 px-8 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 font-bold"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveContact}
              disabled={saveContactMutation.isPending}
              className="flex-1 h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveContactMutation.isPending ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sauvegarde...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Sauvegarder le Contact</span>
                </div>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce contact de prospection ?
              <br />
              <strong>{contactToDelete?.nom || 'Contact'}</strong> - Étage {contactToDelete?.etage}, Porte {contactToDelete?.numeroPorte}
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteContact}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog pour afficher les observations complètes */}
      <Dialog open={showObservationsDialog} onOpenChange={setShowObservationsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Observations détaillées
            </DialogTitle>
            <DialogDescription>
              {selectedContactForObservations && (
                <span className="font-semibold text-slate-700">
                  {selectedContactForObservations.nom || 'Contact'} - Étage {selectedContactForObservations.etage}, Porte {selectedContactForObservations.numeroPorte}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedContactForObservations?.observations && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <span>📝</span>
                  Observations :
                </h4>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedContactForObservations.observations}
                </p>
              </div>
            )}
            {selectedContactForObservations?.mobile && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <span>📱</span>
                  Mobile :
                </h4>
                <p className="text-blue-700 font-mono text-lg">
                  {selectedContactForObservations.mobile}
                </p>
              </div>
            )}
            {selectedContactForObservations?.email && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <span>📧</span>
                  Email :
                </h4>
                <p className="text-green-700 font-mono">
                  {selectedContactForObservations.email}
                </p>
              </div>
            )}
            {selectedContactForObservations?.rdvSignature && (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <span>✅</span>
                  RDV/Signature :
                </h4>
                <p className="text-purple-700 font-semibold">
                  {selectedContactForObservations.rdvSignature}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setShowObservationsDialog(false)}
              className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}