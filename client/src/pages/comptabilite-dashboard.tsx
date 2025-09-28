import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  FileText, 
  Calculator, 
  Building2,
  CreditCard,
  PieChart,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Settings,
  BookOpen,
  Receipt,
  Wallet,
  BarChart3,
  Plus,
  Save,
  X,
  Camera,
  Brain,
  Bell
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ComptabiliteDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fonction pour gérer le scan de documents
  const handleDocumentScan = async (file: File) => {
    try {
      setSaisieParPieceForm({ 
        ...saisieParPieceForm, 
        fichierJustificatif: file,
        nomFichier: file.name
      });
      
      toast({
        title: "Document scanné",
        description: `${file.name} a été capturé avec succès. Analyse en cours...`,
      });

      // Analyse automatique du document scanné
      try {
        const formData = new FormData();
        formData.append('document', file);
        
        const analyseResponse = await fetch('/api/comptabilite/documents/analyze', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (analyseResponse.ok) {
          const analysisResult = await analyseResponse.json();
          
          // Remplir automatiquement le formulaire avec les données extraites
          if (analysisResult.extractedData) {
            const extracted = analysisResult.extractedData;
            setSaisieParPieceForm(prev => ({
              ...prev,
              numeroPiece: extracted.numeroPiece || prev.numeroPiece,
              date: extracted.date || prev.date,
              tiers: extracted.tiers || prev.tiers,
              libelle: extracted.libelle || prev.libelle,
              montantTTC: extracted.montantTTC || prev.montantTTC,
              tva: extracted.tva || prev.tva,
              typePiece: extracted.typePiece || prev.typePiece
            }));
            
            toast({
              title: "Analyse terminée",
              description: `Données extraites automatiquement (confiance: ${Math.round((analysisResult.confidence || 0.85) * 100)}%)`,
              variant: "default"
            });
          }
        } else {
          throw new Error(`Erreur serveur: ${analyseResponse.status}`);
        }
      } catch (analysisError) {
        console.error('Erreur analyse document:', analysisError);
        toast({
          title: "Analyse partielle",
          description: "Document uploadé mais analyse automatique échouée. Vous pouvez saisir manuellement.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erreur générale scan document:', error);
      toast({
        title: "Erreur de scan",
        description: "Impossible de traiter le document. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  // États pour les modaux
  const [isNouvelleEcritureOpen, setIsNouvelleEcritureOpen] = useState(false);
  const [isImportBancaireOpen, setIsImportBancaireOpen] = useState(false);
  const [isSaisieParPieceOpen, setIsSaisieParPieceOpen] = useState(false);

  // État pour le formulaire de nouvelle écriture
  const [ecritureForm, setEcritureForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    journal: 'VTE', // Ventes par défaut
    numeroCompte: '',
    libelle: '',
    debit: '',
    credit: '',
    numeroFacture: '',
    tva: '20' // TVA standard par défaut
  });

  // État pour l'import bancaire
  const [importBancaireForm, setImportBancaireForm] = useState({
    banque: '',
    fichierCSV: null as File | null,
    dateDebut: '',
    dateFin: ''
  });

  // État pour la saisie par pièce
  const [saisieParPieceForm, setSaisieParPieceForm] = useState({
    typePiece: 'facture_client',
    numeroPiece: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    montantTTC: '',
    tva: '20',
    libelle: '',
    tiers: '',
    fichierJustificatif: null as File | null,
    nomFichier: ''
  });

  // Données simulées pour démonstration - À remplacer par API
  const statsComptables = {
    chiffreAffaires: 125450.67,
    charges: 85320.45,
    resultat: 40130.22,
    tvaAPayer: 8542.30,
    creancesClients: 23450.00,
    dettesFournisseurs: 15230.00,
    tresorerie: 45670.89,
    ecrituresEnAttente: 12,
    alertes: 3
  };

  // Mutation pour créer une nouvelle écriture
  const createEcriture = useMutation({
    mutationFn: async (data: typeof ecritureForm) => {
      return await apiRequest('/api/comptabilite/ecritures', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Écriture créée",
        description: "L'écriture comptable a été enregistrée avec succès.",
      });
      setIsNouvelleEcritureOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/comptabilite/ecritures'] });
      // Réinitialiser le formulaire
      setEcritureForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        journal: 'VTE',
        numeroCompte: '',
        libelle: '',
        debit: '',
        credit: '',
        numeroFacture: '',
        tva: '20'
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'écriture.",
        variant: "destructive"
      });
    }
  });

  // Mutation pour l'import bancaire
  const importBancaire = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/comptabilite/import-bancaire', {
        method: 'POST',
        body: data,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'import bancaire');
      }
      
      return await response.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: "Import réussi",
        description: `${result.count || 0} écritures importées avec succès.`,
      });
      setIsImportBancaireOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/comptabilite/ecritures'] });
    },
    onError: () => {
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer le fichier bancaire.",
        variant: "destructive"
      });
    }
  });

  // Mutation pour la saisie par pièce avec upload de document
  const saisieParPiece = useMutation({
    mutationFn: async (data: typeof saisieParPieceForm) => {
      // Si un fichier est présent, l'uploader d'abord
      let documentId = null;
      if (data.fichierJustificatif) {
        const formData = new FormData();
        formData.append('document', data.fichierJustificatif);
        formData.append('pieceId', data.numeroPiece);
        formData.append('type', data.typePiece);
        formData.append('description', data.libelle);
        
        const uploadResponse = await fetch('/api/comptabilite/documents/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Erreur upload document');
        }
        
        const uploadResult = await uploadResponse.json();
        documentId = uploadResult.document?.id;
      }
      
      // Ensuite, enregistrer la pièce comptable
      const response = await fetch('/api/comptabilite/saisie-piece', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          documentId // Associer le document uploadé
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement de la pièce');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pièce enregistrée",
        description: "La pièce comptable et son justificatif ont été enregistrés avec succès.",
      });
      setIsSaisieParPieceOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/comptabilite/pieces'] });
      // Réinitialiser le formulaire
      setSaisieParPieceForm({
        typePiece: 'facture_client',
        numeroPiece: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        montantTTC: '',
        tva: '20',
        libelle: '',
        tiers: '',
        fichierJustificatif: null,
        nomFichier: ''
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la pièce.",
        variant: "destructive"
      });
    }
  });

  return (
    <AppLayout>
      <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6 max-w-7xl">
        {/* En-tête avec gradient moderne - Optimisé mobile */}
        <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-6 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">Module Comptabilité</h1>
                <p className="text-sm sm:text-base text-blue-100">Gestion comptable conforme</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm px-3 sm:px-4"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Importer</span>
                  <span className="sm:hidden">Import</span>
                </Button>
                <Button 
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm px-3 sm:px-4"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export FEC</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateurs clés - 2 cartes par ligne sur mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card className="border-0 shadow-md sm:shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">Chiffre d'Affaires</p>
                  <p className="text-sm sm:text-2xl font-bold text-green-600 truncate">
                    125 450,67 €
                  </p>
                  <p className="text-xs text-green-500 flex items-center mt-0.5 sm:mt-1">
                    <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">+12% vs mois</span>
                  </p>
                </div>
                <div className="bg-green-100 p-1.5 sm:p-3 rounded-lg mt-1 sm:mt-0 sm:ml-2 self-end sm:self-auto">
                  <Euro className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md sm:shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">Charges</p>
                  <p className="text-sm sm:text-2xl font-bold text-red-600 truncate">
                    85 320,45 €
                  </p>
                  <p className="text-xs text-red-500 flex items-center mt-0.5 sm:mt-1">
                    <TrendingDown className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">-5% vs mois</span>
                  </p>
                </div>
                <div className="bg-red-100 p-1.5 sm:p-3 rounded-lg mt-1 sm:mt-0 sm:ml-2 self-end sm:self-auto">
                  <CreditCard className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md sm:shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">Résultat Net</p>
                  <p className="text-sm sm:text-2xl font-bold text-blue-600 truncate">
                    40 130,22 €
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Marge: 32%</p>
                </div>
                <div className="bg-blue-100 p-1.5 sm:p-3 rounded-lg mt-1 sm:mt-0 sm:ml-2 self-end sm:self-auto">
                  <PieChart className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md sm:shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">Trésorerie</p>
                  <p className="text-sm sm:text-2xl font-bold text-purple-600 truncate">
                    45 670,89 €
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Disponible</p>
                </div>
                <div className="bg-purple-100 p-1.5 sm:p-3 rounded-lg mt-1 sm:mt-0 sm:ml-2 self-end sm:self-auto">
                  <Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes et notifications - Optimisé mobile */}
        {statsComptables.alertes > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-orange-900">
                      {statsComptables.alertes} alertes
                    </p>
                    <p className="text-xs sm:text-sm text-orange-700 mt-1">
                      TVA • Factures • Rapprochement
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-100 text-xs sm:text-sm">
                  Voir
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Onglets principaux - Optimisé mobile */}
        <Tabs defaultValue="ecritures" className="space-y-4">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full bg-gray-100 h-auto">
            <TabsTrigger value="ecritures" className="data-[state=active]:bg-white flex-col sm:flex-row p-2 sm:p-3">
              <BookOpen className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="text-xs sm:text-sm">Écritures</span>
            </TabsTrigger>
            <TabsTrigger value="tva" className="data-[state=active]:bg-white flex-col sm:flex-row p-2 sm:p-3">
              <Calculator className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="text-xs sm:text-sm">TVA</span>
            </TabsTrigger>
            <TabsTrigger value="factures" className="data-[state=active]:bg-white flex-col sm:flex-row p-2 sm:p-3">
              <Receipt className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="text-xs sm:text-sm">Factures</span>
            </TabsTrigger>
            <TabsTrigger value="immobilisations" className="data-[state=active]:bg-white flex-col sm:flex-row p-2 sm:p-3">
              <Building2 className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="text-xs sm:text-sm">Immos</span>
            </TabsTrigger>
            <TabsTrigger value="rapports" className="data-[state=active]:bg-white flex-col sm:flex-row p-2 sm:p-3">
              <BarChart3 className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="text-xs sm:text-sm">Rapports</span>
            </TabsTrigger>
            <TabsTrigger value="parametres" className="data-[state=active]:bg-white flex-col sm:flex-row p-2 sm:p-3">
              <Settings className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="text-xs sm:text-sm">Params</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ecritures" className="space-y-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Saisie des Écritures Comptables</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Enregistrez vos opérations comptables conformément au PCG
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                    <Button 
                      onClick={() => setIsNouvelleEcritureOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Nouvelle Écriture
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/comptabilite/assistant-ia'}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs sm:text-sm text-white"
                    >
                      <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Assistant IA
                    </Button>
                    <Button 
                      onClick={() => setIsImportBancaireOpen(true)}
                      variant="outline" 
                      className="text-xs sm:text-sm"
                    >
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Import Bancaire
                    </Button>
                    <Button 
                      onClick={() => setIsSaisieParPieceOpen(true)}
                      variant="outline" 
                      className="text-xs sm:text-sm"
                    >
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Saisie par Pièce
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/rapprochement-bancaire'}
                      variant="outline" 
                      className="text-xs sm:text-sm"
                    >
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Rapprochement
                    </Button>
                  </div>

                  {/* Liste des écritures récentes - Optimisé mobile */}
                  <div className="border rounded-lg p-2 sm:p-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 hover:bg-gray-50 rounded gap-2">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-1 sm:mt-0 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm sm:text-base font-medium">Facture Client #2025-001</p>
                          <p className="text-xs sm:text-sm text-gray-500">411000 - Client XYZ</p>
                        </div>
                      </div>
                      <div className="text-right ml-6 sm:ml-0">
                        <p className="text-sm sm:text-base font-semibold text-green-600">+1 500,00 €</p>
                        <p className="text-xs text-gray-500">15/08/2025</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 hover:bg-gray-50 rounded gap-2">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                        <Clock className="h-4 w-4 text-orange-600 mt-1 sm:mt-0 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm sm:text-base font-medium">Achat Fournitures</p>
                          <p className="text-xs sm:text-sm text-gray-500">606400 - Fournitures</p>
                        </div>
                      </div>
                      <div className="text-right ml-6 sm:ml-0">
                        <p className="text-sm sm:text-base font-semibold text-red-600">-250,00 €</p>
                        <p className="text-xs text-gray-500">14/08/2025</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <p className="text-sm text-gray-500">
                      {statsComptables.ecrituresEnAttente} écritures en attente de validation
                    </p>
                    <Button variant="link" className="text-blue-600">
                      Voir toutes les écritures →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tva" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <span>📊</span>
                  <span>Gestion de la TVA</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Déclarations CA3/CA12 et suivi de la TVA collectée/déductible
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Layout responsive : stack sur mobile, grid sur desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* TVA du mois - Optimisé mobile */}
                  <div className="border rounded-lg p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <h3 className="font-semibold text-base sm:text-lg mb-3 text-blue-800 flex items-center gap-2">
                      <span>💰</span>
                      <span>TVA du mois en cours</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm sm:text-base text-gray-700 font-medium">TVA Collectée</span>
                        <span className="font-semibold text-green-600 text-sm sm:text-base">+12 450,00 €</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm sm:text-base text-gray-700 font-medium">TVA Déductible</span>
                        <span className="font-semibold text-red-600 text-sm sm:text-base">-3 907,70 €</span>
                      </div>
                      <div className="border-t border-blue-300 pt-2 flex justify-between items-center">
                        <span className="font-bold text-blue-800 text-sm sm:text-base">TVA à payer</span>
                        <span className="font-bold text-blue-600 text-base sm:text-lg">8 542,30 €</span>
                      </div>
                    </div>
                    <Button className="w-full mt-3 sm:mt-4 h-10 sm:h-11 text-sm sm:text-base" variant="outline">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Préparer la déclaration
                    </Button>
                  </div>

                  {/* Prochaines échéances - Optimisé mobile */}
                  <div className="border rounded-lg p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
                    <h3 className="font-semibold text-base sm:text-lg mb-3 text-orange-800 flex items-center gap-2">
                      <span>⏰</span>
                      <span>Prochaines échéances</span>
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-start sm:items-center gap-3 p-2 sm:p-3 bg-white rounded-md border border-orange-100">
                        <div className="p-1 bg-orange-100 rounded-full">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-gray-900">CA3 Août 2025</p>
                          <p className="text-xs sm:text-sm text-gray-500">Échéance: 15/09/2025</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start sm:items-center gap-3 p-2 sm:p-3 bg-white rounded-md border border-blue-100">
                        <div className="p-1 bg-blue-100 rounded-full">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-gray-900">Acompte IS T3</p>
                          <p className="text-xs sm:text-sm text-gray-500">Échéance: 15/09/2025</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions rapides - Mobile friendly */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-9 text-xs sm:text-sm">
                        <Bell className="h-3 w-3 mr-1" />
                        Configurer alertes
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-9 text-xs sm:text-sm">
                        <Download className="h-3 w-3 mr-1" />
                        Télécharger CA3
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Section résumé TVA - Nouvelle section mobile */}
                <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                  <h4 className="font-medium text-sm sm:text-base mb-3 text-gray-800 flex items-center gap-2">
                    <span>📈</span>
                    <span>Résumé période</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-xs sm:text-sm text-gray-500">Trimestre</p>
                      <p className="font-semibold text-sm sm:text-base text-blue-600">T3 2025</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-xs sm:text-sm text-gray-500">Chiffre d'affaires</p>
                      <p className="font-semibold text-sm sm:text-base text-green-600">62 250 €</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-xs sm:text-sm text-gray-500">TVA collectée</p>
                      <p className="font-semibold text-sm sm:text-base text-blue-600">12 450 €</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-xs sm:text-sm text-gray-500">Taux moyen</p>
                      <p className="font-semibold text-sm sm:text-base text-purple-600">20%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="factures">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Factures</CardTitle>
                <CardDescription>Factures clients et fournisseurs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Module de facturation intégré...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="immobilisations">
            <Card>
              <CardHeader>
                <CardTitle>Immobilisations et Amortissements</CardTitle>
                <CardDescription>Gestion du patrimoine et calcul des dotations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Registre des immobilisations...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rapports">
            <Card>
              <CardHeader>
                <CardTitle>États Financiers et Rapports</CardTitle>
                <CardDescription>Bilan, compte de résultat, et documents légaux</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Button variant="outline" className="h-24 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Bilan</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Compte de Résultat</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Grand Livre</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Balance</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Journaux</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>FEC</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parametres">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Comptables</CardTitle>
                <CardDescription>Configuration du plan comptable et des journaux</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Plan Comptable Général
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Journaux Comptables
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Exercices Comptables
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calculator className="h-4 w-4 mr-2" />
                    Taux de TVA
                  </Button>
                  
                  {/* Section Export Cabinet Comptable */}
                  <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50 mt-6">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                      Export Cabinet Comptable
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Préparer et télétransmettre les documents au cabinet comptable
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="include-docs" defaultChecked />
                        <label htmlFor="include-docs" className="text-sm">
                          Inclure les documents scannés
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="include-reports" defaultChecked />
                        <label htmlFor="include-reports" className="text-sm">
                          Inclure les rapports (Grand livre, Balance)
                        </label>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        onClick={() => {
                          toast({
                            title: "Export en cours",
                            description: "Préparation de l'archive pour le cabinet comptable...",
                          });
                          // Appel API pour générer l'export
                          fetch('/api/comptabilite/documents/export-cabinet', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              periode: selectedPeriod,
                              includeDocuments: true
                            }),
                            credentials: 'include'
                          })
                          .then(res => res.json())
                          .then(data => {
                            toast({
                              title: "Export prêt",
                              description: "L'archive est prête à être téléchargée et transmise au cabinet.",
                            });
                          })
                          .catch(err => {
                            toast({
                              title: "Erreur",
                              description: "Impossible de générer l'export.",
                              variant: "destructive"
                            });
                          });
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Générer et Télétransmettre
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Nouvelle Écriture */}
      <Dialog open={isNouvelleEcritureOpen} onOpenChange={setIsNouvelleEcritureOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle Écriture Comptable</DialogTitle>
            <DialogDescription>
              Enregistrez une nouvelle écriture dans votre journal comptable
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={ecritureForm.date}
                  onChange={(e) => setEcritureForm({ ...ecritureForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="journal">Journal</Label>
                <Select value={ecritureForm.journal} onValueChange={(value) => setEcritureForm({ ...ecritureForm, journal: value })}>
                  <SelectTrigger id="journal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VTE">Ventes</SelectItem>
                    <SelectItem value="ACH">Achats</SelectItem>
                    <SelectItem value="BQ">Banque</SelectItem>
                    <SelectItem value="CAI">Caisse</SelectItem>
                    <SelectItem value="OD">Opérations Diverses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="numeroCompte">Numéro de compte</Label>
              <Input
                id="numeroCompte"
                placeholder="Ex: 411000 (Client)"
                value={ecritureForm.numeroCompte}
                onChange={(e) => setEcritureForm({ ...ecritureForm, numeroCompte: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="libelle">Libellé de l'écriture</Label>
              <Input
                id="libelle"
                placeholder="Description de l'opération"
                value={ecritureForm.libelle}
                onChange={(e) => setEcritureForm({ ...ecritureForm, libelle: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="debit">Débit (€)</Label>
                <Input
                  id="debit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={ecritureForm.debit}
                  onChange={(e) => setEcritureForm({ ...ecritureForm, debit: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="credit">Crédit (€)</Label>
                <Input
                  id="credit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={ecritureForm.credit}
                  onChange={(e) => setEcritureForm({ ...ecritureForm, credit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroFacture">N° Facture (optionnel)</Label>
                <Input
                  id="numeroFacture"
                  placeholder="Ex: FAC-2025-001"
                  value={ecritureForm.numeroFacture}
                  onChange={(e) => setEcritureForm({ ...ecritureForm, numeroFacture: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tva">TVA (%)</Label>
                <Select value={ecritureForm.tva} onValueChange={(value) => setEcritureForm({ ...ecritureForm, tva: value })}>
                  <SelectTrigger id="tva">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Exonéré)</SelectItem>
                    <SelectItem value="5.5">5.5% (Réduit)</SelectItem>
                    <SelectItem value="10">10% (Intermédiaire)</SelectItem>
                    <SelectItem value="20">20% (Normal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNouvelleEcritureOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => createEcriture.mutate(ecritureForm)}
              disabled={createEcriture.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer l'écriture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Import Bancaire - Optimisé mobile */}
      <Dialog open={isImportBancaireOpen} onOpenChange={setIsImportBancaireOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] w-[95vw] sm:w-full overflow-y-auto">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg sm:text-xl">Import de Relevé Bancaire</DialogTitle>
            <DialogDescription className="text-sm">
              Importez votre relevé bancaire au format CSV pour générer automatiquement les écritures
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            {/* Sélection banque - Optimisé mobile */}
            <div>
              <Label htmlFor="banque" className="text-sm font-medium text-gray-700">Banque</Label>
              <Select value={importBancaireForm.banque} onValueChange={(value) => setImportBancaireForm({ ...importBancaireForm, banque: value })}>
                <SelectTrigger id="banque" className="mt-1 h-10 sm:h-11">
                  <SelectValue placeholder="Sélectionnez votre banque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bnp">BNP Paribas</SelectItem>
                  <SelectItem value="sg">Société Générale</SelectItem>
                  <SelectItem value="ca">Crédit Agricole</SelectItem>
                  <SelectItem value="lcl">LCL</SelectItem>
                  <SelectItem value="ce">Caisse d'Épargne</SelectItem>
                  <SelectItem value="bp">Banque Populaire</SelectItem>
                  <SelectItem value="cm">Crédit Mutuel</SelectItem>
                  <SelectItem value="laposte">La Banque Postale</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upload fichier - Interface mobile améliorée */}
            <div>
              <Label htmlFor="fichierCSV" className="text-sm font-medium text-gray-700">Fichier CSV</Label>
              <div className="mt-1">
                <Input
                  id="fichierCSV"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="h-10 sm:h-11 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImportBancaireForm({ ...importBancaireForm, fichierCSV: file });
                  }}
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                  Formats acceptés : CSV, XLS, XLSX
                </p>
                {importBancaireForm.fichierCSV && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600 p-2 bg-green-50 rounded-md">
                    <CheckCircle className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{importBancaireForm.fichierCSV.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates - Stack sur mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="dateDebut" className="text-sm font-medium text-gray-700">Date début</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  className="mt-1 h-10 sm:h-11 text-sm sm:text-base"
                  value={importBancaireForm.dateDebut}
                  onChange={(e) => setImportBancaireForm({ ...importBancaireForm, dateDebut: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dateFin" className="text-sm font-medium text-gray-700">Date fin</Label>
                <Input
                  id="dateFin"
                  type="date"
                  className="mt-1 h-10 sm:h-11 text-sm sm:text-base"
                  value={importBancaireForm.dateFin}
                  onChange={(e) => setImportBancaireForm({ ...importBancaireForm, dateFin: e.target.value })}
                />
              </div>
            </div>

            {/* Instructions - Format mobile optimisé */}
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm sm:text-base mb-2 text-blue-800 flex items-center gap-2">
                <span>📋</span>
                <span>Instructions</span>
              </h4>
              <ul className="text-xs sm:text-sm space-y-1 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Le fichier doit contenir les colonnes : Date, Libellé, Débit, Crédit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Les montants doivent être au format numérique (ex: 1234.56)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Les dates doivent être au format JJ/MM/AAAA</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Les lignes d'en-tête seront automatiquement détectées</span>
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-1 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsImportBancaireOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={() => {
                if (importBancaireForm.fichierCSV) {
                  const formData = new FormData();
                  formData.append('file', importBancaireForm.fichierCSV);
                  formData.append('banque', importBancaireForm.banque);
                  formData.append('dateDebut', importBancaireForm.dateDebut);
                  formData.append('dateFin', importBancaireForm.dateFin);
                  importBancaire.mutate(formData);
                } else {
                  toast({
                    title: "Erreur",
                    description: "Veuillez sélectionner un fichier",
                    variant: "destructive"
                  });
                }
              }}
              disabled={importBancaire.isPending || !importBancaireForm.fichierCSV}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">Importer le relevé</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Saisie par Pièce */}
      <Dialog open={isSaisieParPieceOpen} onOpenChange={setIsSaisieParPieceOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw] sm:w-full overflow-y-auto">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg sm:text-xl">Saisie par Pièce Comptable</DialogTitle>
            <DialogDescription className="text-sm">
              Enregistrez une facture avec son justificatif pour la comptabilité
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            {/* Upload de document - Optimisé mobile */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">
                  Scanner ou importer la facture
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  PDF, JPG, PNG jusqu'à 10MB - Analyse IA automatique
                </p>
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-center gap-2">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Choisir un fichier</span>
                      </span>
                    </Button>
                    <Input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleDocumentScan(file);
                        }
                      }}
                    />
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                    onClick={() => {
                      // Utiliser l'API native de sélection de fichier mobile
                      const input = document.getElementById('mobile-scanner') as HTMLInputElement;
                      
                      // Créer un nouvel input avec les bonnes propriétés pour le scan
                      const scanInput = document.createElement('input');
                      scanInput.type = 'file';
                      scanInput.accept = 'image/*';
                      scanInput.capture = 'environment';
                      scanInput.style.display = 'none';
                      
                      scanInput.onchange = async (e) => {
                        try {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            await handleDocumentScan(file);
                          }
                        } catch (error) {
                          console.error('Erreur scan:', error);
                          toast({
                            title: "Erreur scan",
                            description: "Impossible de traiter le document scanné",
                            variant: "destructive"
                          });
                        } finally {
                          // Nettoyer l'input temporaire
                          try {
                            if (document.body.contains(scanInput)) {
                              document.body.removeChild(scanInput);
                            }
                          } catch (cleanupError) {
                            console.warn('Erreur nettoyage input:', cleanupError);
                          }
                        }
                      };
                      
                      document.body.appendChild(scanInput);
                      scanInput.click();
                      
                      toast({
                        title: "Scanner activé",
                        description: "Sélectionnez la source : appareil photo ou galerie",
                      });
                    }}
                  >
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Scanner Document</span>
                  </Button>
                  <Input
                    id="mobile-scanner"
                    type="file"
                    className="sr-only"
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleDocumentScan(file);
                      }
                    }}
                  />
                </div>
                {saisieParPieceForm.nomFichier && (
                  <div className="mt-2 sm:mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-green-600 p-2 bg-green-50 rounded-md">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-full">{saisieParPieceForm.nomFichier}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Type de pièce - Optimisé mobile */}
            <div>
              <Label htmlFor="typePiece" className="text-sm font-medium text-gray-700">Type de pièce</Label>
              <Select value={saisieParPieceForm.typePiece} onValueChange={(value) => setSaisieParPieceForm({ ...saisieParPieceForm, typePiece: value })}>
                <SelectTrigger id="typePiece" className="mt-1 h-10 sm:h-11">
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facture_client">Facture Client</SelectItem>
                  <SelectItem value="facture_fournisseur">Facture Fournisseur</SelectItem>
                  <SelectItem value="avoir_client">Avoir Client</SelectItem>
                  <SelectItem value="avoir_fournisseur">Avoir Fournisseur</SelectItem>
                  <SelectItem value="note_frais">Note de Frais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Numéro et Date - Stack sur mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="numeroPiece" className="text-sm font-medium text-gray-700">Numéro de pièce</Label>
                <Input
                  id="numeroPiece"
                  className="mt-1 h-10 sm:h-11 text-sm sm:text-base"
                  placeholder="Ex: FAC-2025-001"
                  value={saisieParPieceForm.numeroPiece}
                  onChange={(e) => setSaisieParPieceForm({ ...saisieParPieceForm, numeroPiece: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="datePiece" className="text-sm font-medium text-gray-700">Date</Label>
                <Input
                  id="datePiece"
                  className="mt-1 h-10 sm:h-11 text-sm sm:text-base"
                  type="date"
                  value={saisieParPieceForm.date}
                  onChange={(e) => setSaisieParPieceForm({ ...saisieParPieceForm, date: e.target.value })}
                />
              </div>
            </div>

            {/* Tiers - Full width */}
            <div>
              <Label htmlFor="tiers" className="text-sm font-medium text-gray-700">Tiers (Client/Fournisseur)</Label>
              <Input
                id="tiers"
                className="mt-1 h-10 sm:h-11 text-sm sm:text-base"
                placeholder="Nom du client ou fournisseur"
                value={saisieParPieceForm.tiers}
                onChange={(e) => setSaisieParPieceForm({ ...saisieParPieceForm, tiers: e.target.value })}
              />
            </div>

            {/* Description - Optimisé mobile */}
            <div>
              <Label htmlFor="libellePiece" className="text-sm font-medium text-gray-700">Libellé / Description</Label>
              <Textarea
                id="libellePiece"
                className="mt-1 text-sm sm:text-base resize-none"
                placeholder="Description de la facture ou de la prestation"
                value={saisieParPieceForm.libelle}
                onChange={(e) => setSaisieParPieceForm({ ...saisieParPieceForm, libelle: e.target.value })}
                rows={2}
              />
            </div>

            {/* Montant et TVA - Stack sur mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="montantTTC" className="text-sm font-medium text-gray-700">Montant TTC (€)</Label>
                <Input
                  id="montantTTC"
                  className="mt-1 h-10 sm:h-11 text-sm sm:text-base"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={saisieParPieceForm.montantTTC}
                  onChange={(e) => setSaisieParPieceForm({ ...saisieParPieceForm, montantTTC: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tvaPiece" className="text-sm font-medium text-gray-700">TVA (%)</Label>
                <Select value={saisieParPieceForm.tva} onValueChange={(value) => setSaisieParPieceForm({ ...saisieParPieceForm, tva: value })}>
                  <SelectTrigger id="tvaPiece" className="mt-1 h-10 sm:h-11">
                    <SelectValue placeholder="Sélectionnez la TVA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Exonéré)</SelectItem>
                    <SelectItem value="5.5">5.5% (Réduit)</SelectItem>
                    <SelectItem value="10">10% (Intermédiaire)</SelectItem>
                    <SelectItem value="20">20% (Normal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ventilation des montants - Optimisé mobile */}
            {saisieParPieceForm.montantTTC && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm sm:text-base mb-2 text-blue-800 flex items-center gap-2">
                  <span>💰</span>
                  <span>Ventilation automatique</span>
                </h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-700">Montant HT :</span>
                    <span className="font-medium text-gray-900 text-right">
                      {(parseFloat(saisieParPieceForm.montantTTC) / (1 + parseFloat(saisieParPieceForm.tva) / 100)).toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-700">TVA ({saisieParPieceForm.tva}%) :</span>
                    <span className="font-medium text-gray-900 text-right">
                      {(parseFloat(saisieParPieceForm.montantTTC) - parseFloat(saisieParPieceForm.montantTTC) / (1 + parseFloat(saisieParPieceForm.tva) / 100)).toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-blue-300 pt-2 mt-2">
                    <span className="font-semibold text-blue-800">Total TTC :</span>
                    <span className="font-bold text-blue-600 text-sm sm:text-base">
                      {parseFloat(saisieParPieceForm.montantTTC).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-1 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsSaisieParPieceOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={() => {
                // Validation avant envoi
                if (!saisieParPieceForm.numeroPiece || !saisieParPieceForm.montantTTC || !saisieParPieceForm.libelle) {
                  toast({
                    title: "Validation échouée",
                    description: "Veuillez remplir tous les champs obligatoires : numéro de pièce, montant et libellé",
                    variant: "destructive"
                  });
                  return;
                }
                saisieParPiece.mutate(saisieParPieceForm);
              }}
              disabled={saisieParPiece.isPending}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {saisieParPiece.isPending ? (
                <>
                  <div className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="text-sm sm:text-base">Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-sm sm:text-base">Enregistrer la pièce</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}