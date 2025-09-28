import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Upload, 
  Download, 
  Send, 
  History, 
  Calculator,
  Users,
  Euro,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Banknote,
  FileCheck,
  Settings,
  BarChart3,
  Edit,
  User,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  facturesTotal: number;
  facturesEnAttente: number;
  facturesProgrammees: number;
  facturesPayees: number;
  montantTotalEnAttente: number;
  montantMensuelMoyen: number;
  vendeursPaiements: number;
  bordereauxEnCours: number;
  dernieresMiseAJour?: Date;
}

interface FactureVendeur {
  id: string;
  vendeurId: number;
  vendeurNom: string;
  vendeurCode: string;
  vendeurEmail: string;
  moisPeriode: string;
  typeCommission: string;
  montantTotal: number;
  nombreClients: number;
  nombrePoints: number;
  trancheCommission: number;
  statutPaiement: string;
  dateEcheance: Date;
  dateGeneration: Date;
  numeroFacture: string;
}

interface BordereauVirement {
  id: number;
  numeroBordereau: string;
  dateCreation: Date;
  dateExecution: Date;
  montantTotal: number;
  nombreVirements: number;
  statut: string;
  facturesIncluses: string[];
  organismeDestination: string;
  motifExecution: string;
  referenceUnique: string;
}

interface HistoriqueItem {
  id: number;
  date: Date;
  type: string;
  description: string;
  montant: number;
  statut: string;
  reference: string;
  nombreBeneficiaires: number;
}

export default function AdminFacturationPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFactures, setSelectedFactures] = useState<string[]>([]);
  const [showBordereauDialog, setShowBordereauDialog] = useState(false);
  const [showXmlDialog, setShowXmlDialog] = useState(false);
  const [selectedBordereau, setSelectedBordereau] = useState<string>('');
  const [selectedFactureDetails, setSelectedFactureDetails] = useState<FactureVendeur | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBordereauDetail, setSelectedBordereauDetail] = useState<any>(null);
  const [showFactureDetailsModal, setShowFactureDetailsModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dashboard statistics
  const { data: dashboardStats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/facturation/dashboard'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Factures en attente
  const { data: facturesEnAttente, isLoading: loadingFactures } = useQuery<FactureVendeur[]>({
    queryKey: ['/api/admin/facturation/factures-en-attente'],
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Historique
  const { data: historique, isLoading: loadingHistorique } = useQuery<HistoriqueItem[]>({
    queryKey: ['/api/admin/facturation/historique'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour générer un bordereau
  const genererBordereauMutation = useMutation({
    mutationFn: async (data: { factureIds: string[]; dateExecution: string; motif: string }) => {
      const response = await fetch('/api/admin/facturation/generer-bordereau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur génération bordereau');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bordereau généré",
        description: `Bordereau ${data.bordereau.numeroBordereau} créé avec succès`,
      });
      setShowBordereauDialog(false);
      setSelectedFactures([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/facturation/factures-en-attente'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le bordereau",
        variant: "destructive",
      });
    }
  });

  // Mutation pour générer XML SEPA
  const genererXmlMutation = useMutation({
    mutationFn: async (bordereauId: string) => {
      const response = await fetch(`/api/admin/facturation/generer-xml-sepa/${bordereauId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur génération XML');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "XML SEPA généré",
        description: `Fichier ${data.fichierXml} créé avec succès`,
      });
      setShowXmlDialog(false);
      // Télécharger automatiquement le fichier XML
      const blob = new Blob([data.contenuXml], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fichierXml;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le fichier XML",
        variant: "destructive",
      });
    }
  });

  const handleSelectFacture = (factureId: string, checked: boolean) => {
    if (checked) {
      setSelectedFactures([...selectedFactures, factureId]);
    } else {
      setSelectedFactures(selectedFactures.filter(id => id !== factureId));
    }
  };

  const handleSelectAllFactures = (checked: boolean) => {
    if (checked && facturesEnAttente) {
      setSelectedFactures(facturesEnAttente.map(f => f.id));
    } else {
      setSelectedFactures([]);
    }
  };

  const handleVoirFacture = (facture: FactureVendeur) => {
    setSelectedFactureDetails(facture);
    setShowFactureDetailsModal(true);
  };

  const handleVoirDetailsBordereau = (bordereau: any) => {
    setSelectedBordereauDetail(bordereau);
    setShowDetailModal(true);
  };

  const getStatutBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'default';
      case 'programme': return 'secondary';
      case 'paye': return 'default';
      case 'execute': return 'default';
      case 'transmis': return 'secondary';
      case 'brouillon': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatutText = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'programme': return 'Programmé';
      case 'paye': return 'Payé';
      case 'execute': return 'Exécuté';
      case 'transmis': return 'Transmis';
      case 'brouillon': return 'Brouillon';
      default: return statut;
    }
  };

  if (loadingStats) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 sm:p-6">
      {/* Header modernisé avec style cohérent */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight mb-2">
                Administration Facturation
              </h1>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Gestion des factures vendeurs et bordereaux de virements SEPA
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Badge variant="outline" className="px-3 py-1.5 w-fit bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 text-orange-700 hover:shadow-md transition-all duration-200">
                <Settings className="h-4 w-4 mr-2" />
                Mode Admin
              </Badge>
              {dashboardStats?.dernieresMiseAJour && (
                <span className="text-xs sm:text-sm text-gray-500 bg-gray-100/60 px-3 py-1.5 rounded-full">
                  Mis à jour: {format(new Date(dashboardStats.dernieresMiseAJour), 'dd/MM HH:mm', { locale: fr })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        {/* Navigation ultra-moderne avec design chic et sophistiqué - 5 boutons compacts */}
        <TabsList className="flex w-full bg-gradient-to-r from-white/95 via-blue-50/90 to-indigo-50/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-2 gap-1 ring-1 ring-white/20 hover:shadow-3xl transition-all duration-500">
          <div className="grid grid-cols-4 flex-1 gap-1">
            <TabsTrigger 
              value="dashboard" 
              className="group relative flex flex-col items-center justify-center gap-1 text-xs py-2 px-1 rounded-xl font-semibold transition-all duration-300 ease-out data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:via-blue-500 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 data-[state=active]:scale-102 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 hover:shadow-md hover:scale-101 min-h-[50px] bg-white/70 backdrop-blur-md border border-white/60 hover:border-blue-300/50"
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="p-1 rounded-lg bg-gradient-to-br from-blue-100/80 to-blue-200/80 group-data-[state=active]:from-white/20 group-data-[state=active]:to-white/10 transition-all duration-300">
                  <TrendingUp className="h-3 w-3 text-blue-600 group-data-[state=active]:text-white transition-colors duration-300" />
                </div>
                <span className="font-bold text-[9px] leading-tight text-center tracking-wide group-data-[state=active]:drop-shadow-sm">Vue</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="factures" 
              className="group relative flex flex-col items-center justify-center gap-1 text-xs py-2 px-1 rounded-xl font-semibold transition-all duration-300 ease-out data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:via-purple-500 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20 data-[state=active]:scale-102 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 hover:shadow-md hover:scale-101 min-h-[50px] bg-white/70 backdrop-blur-md border border-white/60 hover:border-purple-300/50"
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="p-1 rounded-lg bg-gradient-to-br from-purple-100/80 to-purple-200/80 group-data-[state=active]:from-white/20 group-data-[state=active]:to-white/10 transition-all duration-300">
                  <FileText className="h-3 w-3 text-purple-600 group-data-[state=active]:text-white transition-colors duration-300" />
                </div>
                <span className="font-bold text-[9px] leading-tight text-center tracking-wide group-data-[state=active]:drop-shadow-sm">Factures</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="bordereaux" 
              className="group relative flex flex-col items-center justify-center gap-1 text-xs py-2 px-1 rounded-xl font-semibold transition-all duration-300 ease-out data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:via-emerald-500 data-[state=active]:to-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20 data-[state=active]:scale-102 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-emerald-100 hover:shadow-md hover:scale-101 min-h-[50px] bg-white/70 backdrop-blur-md border border-white/60 hover:border-emerald-300/50"
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="p-1 rounded-lg bg-gradient-to-br from-emerald-100/80 to-emerald-200/80 group-data-[state=active]:from-white/20 group-data-[state=active]:to-white/10 transition-all duration-300">
                  <Banknote className="h-3 w-3 text-emerald-600 group-data-[state=active]:text-white transition-colors duration-300" />
                </div>
                <span className="font-bold text-[9px] leading-tight text-center tracking-wide group-data-[state=active]:drop-shadow-sm">SEPA</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="historique" 
              className="group relative flex flex-col items-center justify-center gap-1 text-xs py-2 px-1 rounded-xl font-semibold transition-all duration-300 ease-out data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-600 data-[state=active]:via-orange-500 data-[state=active]:to-orange-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/20 data-[state=active]:scale-102 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 hover:shadow-md hover:scale-101 min-h-[50px] bg-white/70 backdrop-blur-md border border-white/60 hover:border-orange-300/50"
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="p-1 rounded-lg bg-gradient-to-br from-orange-100/80 to-orange-200/80 group-data-[state=active]:from-white/20 group-data-[state=active]:to-white/10 transition-all duration-300">
                  <Clock className="h-3 w-3 text-orange-600 group-data-[state=active]:text-white transition-colors duration-300" />
                </div>
                <span className="font-bold text-[9px] leading-tight text-center tracking-wide group-data-[state=active]:drop-shadow-sm">Historique</span>
              </div>
            </TabsTrigger>
          </div>
        </TabsList>

        {/* Dashboard Tab - Mobile Ultra-Optimisé */}
        <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
          {/* Grille moderne des cartes statistiques */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Carte Total Factures modernisée */}
            <Card 
              className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl cursor-pointer hover:scale-105 hover:bg-white/90 group min-h-[140px] sm:min-h-[130px]"
              onClick={() => setActiveTab('factures')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">Total Factures</CardTitle>
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">
                  {dashboardStats?.facturesTotal || 43}
                </div>
                <p className="text-xs text-gray-600 leading-tight">
                  +{dashboardStats?.facturesEnAttente || 25} en attente
                </p>
              </CardContent>
            </Card>

            {/* Carte Montant en Attente modernisée */}
            <Card 
              className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl cursor-pointer hover:scale-105 hover:bg-white/90 group min-h-[140px] sm:min-h-[130px]"
              onClick={() => setActiveTab('factures')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">Montant en Attente</CardTitle>
                <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-xl group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
                  <Euro className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-1">
                  {dashboardStats?.montantTotalEnAttente?.toLocaleString('fr-FR') || '1 935'}€
                </div>
                <p className="text-xs text-gray-600 leading-tight">
                  Moyenne: {dashboardStats?.montantMensuelMoyen?.toLocaleString('fr-FR') || '1 075'}€
                </p>
              </CardContent>
            </Card>
            {/* Carte Vendeurs à Payer modernisée */}
            <Card 
              className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl cursor-pointer hover:scale-105 hover:bg-white/90 group min-h-[140px] sm:min-h-[130px]"
              onClick={() => setActiveTab('bordereaux')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">Vendeurs à Payer</CardTitle>
                <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-1">
                  {dashboardStats?.vendeursPaiements || 2}
                </div>
                <p className="text-xs text-gray-600 leading-tight">
                  {dashboardStats?.bordereauxEnCours || 1} bordereau en cours
                </p>
              </CardContent>
            </Card>

            {/* Carte Statut Paiements modernisée */}
            <Card 
              className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl cursor-pointer hover:scale-105 hover:bg-white/90 group min-h-[140px] sm:min-h-[130px]"
              onClick={() => setActiveTab('historique')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">Statut Paiements</CardTitle>
                <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
                  <CheckCircle2 className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Payées</span>
                    <span className="font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{dashboardStats?.facturesPayees || 4}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Programmées</span>
                    <span className="font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{dashboardStats?.facturesProgrammees || 12}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Résumé des prochaines échéances modernisé */}
          <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl">
                  <Clock className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Prochaines Échéances</span>
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-2">
                Factures programmées pour les prochains paiements
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {/* CVD modernisé */}
                <div className="group p-4 bg-gradient-to-r from-blue-50/80 to-blue-100/60 backdrop-blur-sm rounded-2xl border border-blue-200/50 hover:border-blue-300/70 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-blue-900 text-sm mb-1">CVD - 15 Juillet 2025</p>
                      <p className="text-xs text-blue-700/80">Commissions Vente Directe</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-bold bg-gradient-to-r from-blue-700 to-blue-800 bg-clip-text text-transparent text-base">
                        {Math.floor((dashboardStats?.montantTotalEnAttente || 1845) * 0.7).toLocaleString('fr-FR')}€
                      </p>
                      <p className="text-xs text-blue-700/80">{Math.floor((dashboardStats?.vendeursPaiements || 12) * 0.8)} vendeurs</p>
                    </div>
                  </div>
                </div>
                
                {/* CCA modernisé */}
                <div className="group p-4 bg-gradient-to-r from-green-50/80 to-green-100/60 backdrop-blur-sm rounded-2xl border border-green-200/50 hover:border-green-300/70 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-green-900 text-sm mb-1">CCA - 22 Juillet 2025</p>
                      <p className="text-xs text-green-700/80">Commission Chiffre d'Affaires</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-bold bg-gradient-to-r from-green-700 to-green-800 bg-clip-text text-transparent text-base">
                        {Math.floor((dashboardStats?.montantTotalEnAttente || 1845) * 0.3).toLocaleString('fr-FR')}€
                      </p>
                      <p className="text-xs text-green-700/80">{Math.floor((dashboardStats?.vendeursPaiements || 12) * 0.4)} vendeurs</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Factures en attente Tab - Mobile Optimisé */}
        <TabsContent value="factures" className="space-y-4 sm:space-y-6">
          {/* Bouton Retour */}
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('dashboard')}
            className="mb-4 bg-white/90 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
          
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg rounded-xl">
            <CardHeader className="px-4 pt-4 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileText className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-gray-800">Factures en Attente</span>
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-1">
                    {facturesEnAttente?.length || 24} factures prêtes pour le paiement
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  {selectedFactures.length > 0 && (
                    <>
                      <Badge variant="secondary" className="px-3 py-1.5 w-fit text-xs">
                        {selectedFactures.length} sélectionnée(s)
                      </Badge>
                      <Dialog open={showBordereauDialog} onOpenChange={setShowBordereauDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm px-4 py-2">
                            <Send className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Générer Bordereau</span>
                            <span className="sm:hidden">Bordereau</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Générer un Bordereau de Virement</DialogTitle>
                            <DialogDescription>
                              Créer un bordereau SEPA pour {selectedFactures.length} facture(s) sélectionnée(s)
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            genererBordereauMutation.mutate({
                              factureIds: selectedFactures,
                              dateExecution: formData.get('dateExecution') as string,
                              motif: formData.get('motif') as string || 'Commission vendeurs'
                            });
                          }}>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="dateExecution">Date d'exécution</Label>
                                <Input
                                  id="dateExecution"
                                  name="dateExecution"
                                  type="date"
                                  required
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </div>
                              <div>
                                <Label htmlFor="motif">Motif du virement</Label>
                                <Textarea
                                  id="motif"
                                  name="motif"
                                  placeholder="Commission vendeurs"
                                  defaultValue="Commission vendeurs"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" disabled={genererBordereauMutation.isPending}>
                                {genererBordereauMutation.isPending ? 'Génération...' : 'Générer Bordereau'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loadingFactures ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Vue Mobile - Cartes Compactes */}
                  <div className="block lg:hidden space-y-3">
                    {facturesEnAttente?.map((facture) => (
                      <div key={facture.id} className="p-3 bg-gray-50/50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedFactures.includes(facture.id)}
                              onCheckedChange={(checked) => handleSelectFacture(facture.id, checked as boolean)}
                              className="mt-1"
                            />
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{facture.vendeurNom}</p>
                              <p className="text-xs text-gray-500">{facture.vendeurCode}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono shrink-0">
                              {facture.typeCommission}
                            </Badge>
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs px-1.5 py-0.5 h-6 min-w-0 flex-shrink-0"
                                onClick={() => handleVoirFacture(facture)}
                              >
                                <FileCheck className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs px-1.5 py-0.5 h-6 min-w-0 flex-shrink-0"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600 text-xs">Montant</p>
                            <p className="font-bold text-green-600">{facture.montantTotal.toLocaleString('fr-FR')}€</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Clients</p>
                            <p className="font-medium text-gray-900">
                              {facture.nombreClients}
                              {facture.nombrePoints > 0 && (
                                <span className="text-xs text-gray-500 ml-1">({facture.nombrePoints} pts)</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Échéance</p>
                            <p className="font-medium text-gray-900">{format(new Date(facture.dateEcheance), 'dd/MM/yyyy', { locale: fr })}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Statut</p>
                            <Badge variant={getStatutBadgeVariant(facture.statutPaiement)} className="text-xs">
                              {getStatutText(facture.statutPaiement)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vue Desktop - Tableau Complet */}
                  <div className="hidden lg:block rounded-xl border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedFactures.length === facturesEnAttente?.length && facturesEnAttente.length > 0}
                              onCheckedChange={handleSelectAllFactures}
                            />
                          </TableHead>
                          <TableHead className="font-semibold">Vendeur</TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="font-semibold">Montant</TableHead>
                          <TableHead className="font-semibold">Clients</TableHead>
                          <TableHead className="font-semibold">Échéance</TableHead>
                          <TableHead className="font-semibold">Statut</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturesEnAttente?.map((facture) => (
                          <TableRow key={facture.id} className="hover:bg-gray-50/50 transition-colors">
                            <TableCell>
                              <Checkbox
                                checked={selectedFactures.includes(facture.id)}
                                onCheckedChange={(checked) => handleSelectFacture(facture.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{facture.vendeurNom}</p>
                                <p className="text-sm text-gray-500">{facture.vendeurCode}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {facture.typeCommission}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {facture.montantTotal.toLocaleString('fr-FR')}€
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <span className="font-medium">{facture.nombreClients}</span>
                                {facture.nombrePoints > 0 && (
                                  <p className="text-xs text-gray-500">{facture.nombrePoints} pts</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(facture.dateEcheance), 'dd/MM/yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatutBadgeVariant(facture.statutPaiement)}>
                                {getStatutText(facture.statutPaiement)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {/* Boutons d'actions modernisés */}
                                <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl border border-white/30 shadow-md p-0.5 hover:shadow-lg transition-all duration-300">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100/80 hover:text-blue-700 group transition-all duration-300"
                                    onClick={() => handleVoirFacture(facture)}
                                    title="Voir les détails"
                                  >
                                    <FileCheck className="h-3 w-3 transition-transform group-hover:scale-110" />
                                  </Button>
                                  <div className="w-px h-4 bg-gray-200/50"></div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-green-100/80 hover:text-green-700 group transition-all duration-300"
                                    title="Télécharger PDF"
                                  >
                                    <Download className="h-3 w-3 transition-transform group-hover:scale-110" />
                                  </Button>
                                </div>
                              </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bordereaux SEPA Tab */}
        <TabsContent value="bordereaux" className="space-y-6">
          {/* Bouton Retour */}
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('dashboard')}
            className="mb-4 bg-white/90 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
          
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Banknote className="h-5 w-5 text-indigo-600" />
                <span>Bordereaux de Virements SEPA</span>
              </CardTitle>
              <CardDescription>
                Gestion des fichiers XML SEPA pour transmission bancaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Actions rapides modernisées */}
                <div className="group p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 backdrop-blur-sm rounded-2xl border border-blue-200/50 hover:border-blue-300/70 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900 text-lg mb-2">Génération XML SEPA</h3>
                      <p className="text-sm text-blue-700/80">Créer le fichier XML pour transmission bancaire</p>
                    </div>
                    <Dialog open={showXmlDialog} onOpenChange={setShowXmlDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 rounded-xl group-hover:scale-105"
                        >
                          <Upload className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                          <span className="font-medium">Générer XML</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Générer Fichier XML SEPA</DialogTitle>
                        <DialogDescription>
                          Sélectionnez le bordereau pour générer le fichier XML de transmission
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="bordereau">Bordereau de virement</Label>
                          <Select value={selectedBordereau} onValueChange={setSelectedBordereau}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un bordereau..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BV-2025-0001">BV-2025-0001 (1,250€)</SelectItem>
                              <SelectItem value="BV-2025-0002">BV-2025-0002 (890€)</SelectItem>
                              <SelectItem value="BV-2025-0003">BV-2025-0003 (2,340€)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={() => genererXmlMutation.mutate(selectedBordereau)}
                          disabled={!selectedBordereau || genererXmlMutation.isPending}
                        >
                          {genererXmlMutation.isPending ? 'Génération...' : 'Générer et Télécharger'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  </div>
                </div>

                {/* Liste des bordereaux récents */}
                <div>
                  <h3 className="font-medium mb-4">Bordereaux Récents</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'BV-2025-0003', date: '2025-07-02', montant: 2340, statut: 'brouillon', virements: 8 },
                      { id: 'BV-2025-0002', date: '2025-06-22', montant: 890, statut: 'transmis', virements: 3 },
                      { id: 'BV-2025-0001', date: '2025-06-15', montant: 1250, statut: 'execute', virements: 5 },
                    ].map((bordereau) => (
                      <div key={bordereau.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{bordereau.id}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(bordereau.date), 'dd MMMM yyyy', { locale: fr })} • {bordereau.virements} virements
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-medium">{bordereau.montant.toLocaleString('fr-FR')}€</p>
                            <Badge variant={getStatutBadgeVariant(bordereau.statut)} className="text-xs">
                              {getStatutText(bordereau.statut)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Boutons d'actions modernisés */}
                            <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-1 hover:shadow-xl transition-all duration-300">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-10 w-10 p-0 rounded-xl hover:bg-blue-100/80 hover:text-blue-700 group transition-all duration-300"
                                onClick={() => handleVoirDetailsBordereau(bordereau)}
                                title="Voir les détails"
                              >
                                <FileCheck className="h-4 w-4 transition-transform group-hover:scale-110" />
                              </Button>
                              <div className="w-px h-6 bg-gray-200/50"></div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-10 w-10 p-0 rounded-xl hover:bg-green-100/80 hover:text-green-700 group transition-all duration-300"
                                title="Télécharger XML"
                              >
                                <Download className="h-4 w-4 transition-transform group-hover:scale-110" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique Tab */}
        <TabsContent value="historique" className="space-y-6">
          {/* Bouton Retour */}
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('dashboard')}
            className="mb-4 bg-white/90 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
          
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5 text-indigo-600" />
                <span>Historique des Paiements</span>
              </CardTitle>
              <CardDescription>
                Suivi complet des virements et bordereaux traités
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistorique ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {historique?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          item.statut === 'execute' ? 'bg-green-100 text-green-600' :
                          item.statut === 'transmis' ? 'bg-blue-100 text-blue-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {item.type === 'paiement' ? (
                            <Euro className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(item.date), 'dd MMMM yyyy', { locale: fr })} • 
                            {item.nombreBeneficiaires} bénéficiaire(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-medium">{item.montant.toLocaleString('fr-FR')}€</p>
                          <Badge variant={getStatutBadgeVariant(item.statut)} className="text-xs">
                            {getStatutText(item.statut)}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Détails de Facture */}
      <Dialog open={showFactureDetailsModal} onOpenChange={setShowFactureDetailsModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Détails de l'Ordre de Virement
            </DialogTitle>
            <DialogDescription>
              Consultez toutes les informations détaillées de cette facture vendeur
            </DialogDescription>
          </DialogHeader>
          
          {selectedFactureDetails && (
            <div className="space-y-6 py-4">
              {/* Informations Générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Informations Vendeur
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Nom :</span>
                        <span className="font-medium text-blue-900">{selectedFactureDetails.vendeurNom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Code :</span>
                        <span className="font-medium text-blue-900">{selectedFactureDetails.vendeurCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Email :</span>
                        <span className="font-medium text-blue-900">{selectedFactureDetails.vendeurEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Détails Facture
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Numéro :</span>
                        <span className="font-medium text-purple-900">{selectedFactureDetails.numeroFacture}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Période :</span>
                        <span className="font-medium text-purple-900">{selectedFactureDetails.moisPeriode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Type :</span>
                        <span className="font-medium text-purple-900">{selectedFactureDetails.typeCommission}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Montants et Détails */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <div className="text-green-700 text-sm font-medium">Montant Total</div>
                  <div className="text-2xl font-bold text-green-900">
                    {selectedFactureDetails.montantTotal.toLocaleString('fr-FR')}€
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-center">
                  <div className="text-orange-700 text-sm font-medium">Nombre de Clients</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {selectedFactureDetails.nombreClients}
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 text-center">
                  <div className="text-indigo-700 text-sm font-medium">Points CVD</div>
                  <div className="text-2xl font-bold text-indigo-900">
                    {selectedFactureDetails.nombrePoints}
                  </div>
                </div>
              </div>

              {/* Statut et Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Informations Temporelles
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Date Génération :</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(selectedFactureDetails.dateGeneration), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Date Échéance :</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(selectedFactureDetails.dateEcheance), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <Badge className="h-4 w-4" />
                    Statut de Paiement
                  </h3>
                  <div className="text-center">
                    <Badge 
                      variant={getStatutBadgeVariant(selectedFactureDetails.statutPaiement)}
                      className="text-base px-4 py-2"
                    >
                      {getStatutText(selectedFactureDetails.statutPaiement)}
                    </Badge>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-sm text-yellow-700">Tranche Commission</div>
                    <div className="text-lg font-bold text-yellow-900">
                      Tranche {selectedFactureDetails.trancheCommission}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Modifier Statut
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setShowFactureDetailsModal(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Détails Bordereau SEPA */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4 pt-2">
            <DialogTitle className="flex items-center space-x-2 text-xl sm:text-2xl font-bold">
              <Banknote className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600" />
              <span className="text-gray-900">Détails du Bordereau SEPA</span>
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              Bordereau {selectedBordereauDetail?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBordereauDetail && (
            <div className="space-y-4 py-4">
              {/* Informations générales */}
              <div className="grid grid-cols-1 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg text-blue-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                      Informations du Bordereau
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Numéro :</span>
                      <span className="font-mono font-bold text-blue-600 text-sm">{selectedBordereauDetail.id}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Date de création :</span>
                      <span className="text-sm">{format(new Date(selectedBordereauDetail.date), 'dd MMMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Statut :</span>
                      <Badge variant={getStatutBadgeVariant(selectedBordereauDetail.statut)} className="text-xs w-fit">
                        {getStatutText(selectedBordereauDetail.statut)}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Nombre de virements :</span>
                      <span className="font-semibold text-sm">{selectedBordereauDetail.virements}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg text-green-800 flex items-center gap-2">
                      <Euro className="h-4 w-4 sm:h-5 sm:w-5" />
                      Informations Financières
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Montant total :</span>
                      <span className="font-bold text-lg sm:text-2xl text-green-600">
                        {selectedBordereauDetail.montant.toLocaleString('fr-FR')}€
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Montant moyen :</span>
                      <span className="font-semibold text-sm">
                        {(selectedBordereauDetail.montant / selectedBordereauDetail.virements).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}€
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Type de virement :</span>
                      <span className="font-semibold text-sm">SEPA Crédit</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Détail des virements */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                    Détail des Virements ({selectedBordereauDetail.virements})
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Liste des bénéficiaires inclus dans ce bordereau
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-xs sm:text-sm">Bénéficiaire</TableHead>
                          <TableHead className="font-semibold text-xs sm:text-sm">Type</TableHead>
                          <TableHead className="font-semibold text-xs sm:text-sm text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Génération simulée de données basée sur le bordereau */}
                        {Array.from({ length: selectedBordereauDetail.virements }, (_, index) => {
                          const vendeurs = [
                            { nom: 'Eric Rostand', type: 'CVD', iban: 'FR76 3000 4000 0100 0012 3456' },
                            { nom: 'Marie Dubois', type: 'CCA', iban: 'FR76 3000 4000 0100 0012 3457' },
                            { nom: 'Pierre Martin', type: 'CAE', iban: 'FR76 3000 4000 0100 0012 3458' },
                            { nom: 'Sophie Bernard', type: 'CVD', iban: 'FR76 3000 4000 0100 0012 3459' },
                            { nom: 'Antoine Moreau', type: 'CCA', iban: 'FR76 3000 4000 0100 0012 3460' },
                            { nom: 'Isabelle Laurent', type: 'CAE', iban: 'FR76 3000 4000 0100 0012 3461' },
                            { nom: 'Thomas Girard', type: 'CVD', iban: 'FR76 3000 4000 0100 0012 3462' },
                            { nom: 'Caroline Roux', type: 'CCA', iban: 'FR76 3000 4000 0100 0012 3463' }
                          ];
                          
                          const vendeur = vendeurs[index % vendeurs.length];
                          const montant = Math.floor((selectedBordereauDetail.montant / selectedBordereauDetail.virements) + (Math.random() * 200) - 100);
                          
                          return (
                            <TableRow key={index} className="hover:bg-gray-50">
                              <TableCell className="py-2">
                                <div>
                                  <p className="font-medium text-xs sm:text-sm">{vendeur.nom}</p>
                                  <p className="text-xs text-gray-500">#{index + 1}</p>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {vendeur.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-600 py-2 text-xs sm:text-sm">
                                {montant.toLocaleString('fr-FR')}€
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Informations techniques SEPA */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base sm:text-lg">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    Informations Techniques SEPA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Format de fichier :</span>
                      <span className="font-mono text-xs sm:text-sm">ISO 20022 pain.001.001.03</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Caractère d'encodage :</span>
                      <span className="font-mono text-xs sm:text-sm">UTF-8</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Créancier :</span>
                      <span className="text-xs sm:text-sm">Synergie Marketing Group</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">IBAN Débiteur :</span>
                      <span className="font-mono text-xs sm:text-sm break-all">FR76 3000 4000 0100 0012 3400</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Date d'exécution :</span>
                      <span className="text-xs sm:text-sm">
                        {format(new Date(selectedBordereauDetail.date), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-gray-600 text-sm">Référence unique :</span>
                      <span className="font-mono text-xs sm:text-sm break-all">
                        SEPA{selectedBordereauDetail.id.replace('-', '')}{format(new Date(), 'yyyyMMdd')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:flex sm:flex-row gap-2 sm:gap-3 pt-3 border-t">
                <Button 
                  variant="default" 
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm py-2"
                  onClick={() => {
                    // Ici on pourrait déclencher le téléchargement du XML
                    toast({ 
                      title: "Téléchargement en cours", 
                      description: `Génération du fichier XML SEPA pour ${selectedBordereauDetail.id}` 
                    });
                  }}
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Télécharger XML SEPA
                </Button>
                <Button variant="outline" className="text-sm py-2">
                  <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="hidden sm:inline">Transmettre à la Banque</span>
                  <span className="sm:hidden">Transmettre</span>
                </Button>
                <Button variant="outline" className="text-sm py-2">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="hidden sm:inline">Modifier le Bordereau</span>
                  <span className="sm:hidden">Modifier</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailModal(false)}
                  className="sm:ml-auto text-sm py-2"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}