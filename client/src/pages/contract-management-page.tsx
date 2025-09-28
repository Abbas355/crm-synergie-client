import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Upload, 
  Edit, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  X,
  Settings,
  Save,
  BookOpen,
  Tag,
  List,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Image,
  ImageIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Contract {
  id: number;
  type: string;
  status: 'draft' | 'pending' | 'active' | 'expired' | 'terminated';
  vendorName: string;
  distributorName: string;
  startDate: string;
  endDate: string;
  commissionRate: string | number;
  territoryAssigned?: string;
  createdAt: string;
  updatedAt: string;
  contractData?: {
    legalCompliance?: {
      isCompliant: boolean;
      lastReview: string;
      issues: string[];
    };
  } | null;
}

interface ContractTemplate {
  id: number;
  name: string;
  type: string;
  version: string;
  description?: string;
  fields: string[];
  legalRequirements: string[];
  templatePath: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContractImage {
  filename: string;
  url: string;
  uploadedAt: string;
}

const CONTRACT_STATUSES = {
  draft: { label: "Brouillon", color: "bg-gray-500", icon: Edit },
  pending: { label: "En attente", color: "bg-yellow-500", icon: Clock },
  active: { label: "Actif", color: "bg-green-500", icon: CheckCircle },
  expired: { label: "Expiré", color: "bg-red-500", icon: AlertCircle },
  terminated: { label: "Résilié", color: "bg-red-700", icon: AlertCircle },
};

export default function ContractManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [showNewContractDialog, setShowNewContractDialog] = useState(false);

  // Récupération des contrats
  const { data: contracts, isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
  });

  // Récupération des templates
  const { data: templates, isLoading: templatesLoading } = useQuery<ContractTemplate[]>({
    queryKey: ['/api/contract-templates'],
  });

  // Mutation pour créer un nouveau contrat
  const createContractMutation = useMutation({
    mutationFn: async (contractData: Partial<Contract>) => {
      return apiRequest('POST', '/api/contracts', contractData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      toast({
        title: "Contrat créé",
        description: "Le nouveau contrat a été créé avec succès.",
      });
      setShowNewContractDialog(false);
    },
  });

  // Mutation pour générer un contrat
  const generateContractMutation = useMutation({
    mutationFn: async (contractId: number) => {
      return apiRequest('POST', `/api/contracts/${contractId}/generate`);
    },
    onSuccess: async (response) => {
      // Téléchargement automatique du contrat généré
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `contrat_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Contrat généré",
        description: "Le contrat a été généré et téléchargé avec succès.",
      });
    },
  });



  const handleClose = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header Mobile Optimisé avec croix de fermeture */}
        <div className="space-y-4">
          <div className="flex flex-col space-y-2 relative">
            {/* Croix de fermeture en haut à droite */}
            <button
              onClick={handleClose}
              className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200 z-10"
              aria-label="Fermer la page"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent pr-12">
              Gestion des Contrats
            </h1>
            <p className="text-sm md:text-base text-slate-600">
              Interface complète de gestion des contrats de distribution
            </p>
          </div>
          
          {/* Actions Header Mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Dialog open={showNewContractDialog} onOpenChange={setShowNewContractDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg">
                  <FileText className="w-4 h-4 mr-2" />
                  Nouveau Contrat
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-2 sm:mx-4 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] lg:max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-slate-900">
                    Créer un nouveau contrat
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-600">
                    Sélectionnez le type de contrat et remplissez les informations de base
                  </DialogDescription>
                </DialogHeader>
                <NewContractForm 
                  onSubmit={(data) => createContractMutation.mutate(data)}
                  templates={templates || []}
                  isLoading={createContractMutation.isPending}
                />
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" className="flex-1 sm:flex-none border-indigo-200 hover:bg-indigo-50">
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Importer</span>
              <span className="sm:hidden">Import</span>
            </Button>
          </div>
        </div>

        {/* Tabs Mobile-First */}
        <Tabs defaultValue="contracts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto p-1 bg-white/60 backdrop-blur-lg border border-white/20 shadow-lg rounded-xl">
            <TabsTrigger 
              value="contracts"
              className="text-xs sm:text-sm py-2 px-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <span className="hidden sm:inline">Contrats Actifs</span>
              <span className="sm:hidden">Contrats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="templates"
              className="text-xs sm:text-sm py-2 px-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="terms"
              className="text-xs sm:text-sm py-2 px-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <span className="hidden sm:inline">Termes</span>
              <span className="sm:hidden">Termes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="compliance"
              className="text-xs sm:text-sm py-2 px-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <span className="hidden sm:inline">Conformité</span>
              <span className="sm:hidden">Legal</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="text-xs sm:text-sm py-2 px-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Onglet Contrats Mobile-First */}
          <TabsContent value="contracts" className="space-y-4">
            {contracts?.length === 0 && !contractsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucun contrat</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm">
                  Commencez par créer votre premier contrat de distribution
                </p>
                <Button 
                  onClick={() => setShowNewContractDialog(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Créer mon premier contrat
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {contracts?.map((contract) => (
                  <ContractCard 
                    key={contract.id}
                    contract={contract}
                    onView={() => setSelectedContract(contract)}
                    onGenerate={() => generateContractMutation.mutate(contract.id)}
                    isGenerating={generateContractMutation.isPending}
                  />
                ))}
              </div>
            )}
            
            {contractsLoading && (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </TabsContent>

        {/* Onglet Templates */}
        <TabsContent value="templates" className="space-y-4">
          <TemplatesManager 
            templates={templates || []}
            isLoading={templatesLoading}
            onEdit={setEditingTemplate}
          />
        </TabsContent>

        {/* Onglet Termes Contractuels */}
        <TabsContent value="terms" className="space-y-4">
          <ContractTermsManager templates={templates || []} />
        </TabsContent>

        {/* Onglet Conformité Légale */}
        <TabsContent value="compliance" className="space-y-4">
          <LegalComplianceDashboard contracts={contracts || []} />
        </TabsContent>

        {/* Onglet Analytiques */}
        <TabsContent value="analytics" className="space-y-4">
          <ContractAnalytics contracts={contracts || []} />
        </TabsContent>
        </Tabs>

        {/* Dialog de détail du contrat */}
        {selectedContract && (
          <ContractDetailDialog 
            contract={selectedContract}
            open={!!selectedContract}
            onClose={() => setSelectedContract(null)}
          />
        )}

        {/* Dialog de modification des templates */}
        {editingTemplate && (
          <TemplateEditDialog 
            template={editingTemplate}
            open={!!editingTemplate}
            onClose={() => setEditingTemplate(null)}
          />
        )}
      </div>
    </div>
  );
}

// Composant Carte de Contrat - Mobile Optimisé
function ContractCard({ 
  contract, 
  onView, 
  onGenerate, 
  isGenerating 
}: { 
  contract: Contract;
  onView: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const getStatusBadge = (status: Contract['status']) => {
    const statusInfo = CONTRACT_STATUSES[status];
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant="secondary" className={`${statusInfo.color} text-white text-xs`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <Card className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-800 mb-1">
              {contract.type}
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm">
              {contract.vendorName}
            </CardDescription>
          </div>
          {getStatusBadge(contract.status)}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Informations principales */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Distributeur:</span>
              <span className="font-semibold text-slate-700 text-right flex-1 ml-2 truncate">
                {contract.distributorName}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Commission:</span>
              <span className="font-semibold text-emerald-600">
                {typeof contract.commissionRate === 'string' ? parseFloat(contract.commissionRate) : contract.commissionRate}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Territoire:</span>
              <span className="font-semibold text-slate-700 text-right flex-1 ml-2 truncate">
                {contract.territoryAssigned}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Expire le:</span>
              <span className="font-semibold text-slate-700">
                {new Date(contract.endDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onView}
              className="flex-1 border-indigo-200 hover:bg-indigo-50 text-indigo-700"
            >
              <Eye className="w-4 h-4 mr-1" />
              Voir
            </Button>
            
            <Button 
              size="sm" 
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Download className="w-4 h-4 mr-1" />
              {isGenerating ? 'Génération...' : 'Générer'}
            </Button>
          </div>
          
          {/* Alerte conformité */}
          {contract.contractData?.legalCompliance && !contract.contractData.legalCompliance.isCompliant && (
            <div className="mt-3 flex items-center bg-red-50 text-red-600 text-xs p-2 rounded-md">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-xs">Problèmes de conformité détectés</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Formulaire de nouveau contrat
function NewContractForm({ 
  onSubmit, 
  templates, 
  isLoading 
}: { 
  onSubmit: (data: Partial<Contract>) => void;
  templates: ContractTemplate[];
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    type: '',
    vendorName: '',
    distributorName: '',
    commissionRate: 8,
    territoryAssigned: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type de contrat - Full width sur mobile */}
      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium text-slate-700">
          Type de contrat
        </Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
          <SelectTrigger className="h-11 border-slate-300 focus:border-indigo-500">
            <SelectValue placeholder="Sélectionnez un type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distribution">Distribution Indépendante</SelectItem>
            <SelectItem value="agent">Agent Commercial</SelectItem>
            <SelectItem value="vendor">Vendeur Direct</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Informations principales - Mobile-first */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendorName" className="text-sm font-medium text-slate-700">
            Nom du vendeur
          </Label>
          <Input
            id="vendorName"
            value={formData.vendorName}
            onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
            className="h-11 border-slate-300 focus:border-indigo-500"
            placeholder="Nom complet du vendeur"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="distributorName" className="text-sm font-medium text-slate-700">
            Nom du distributeur
          </Label>
          <Input
            id="distributorName"
            value={formData.distributorName}
            onChange={(e) => setFormData({...formData, distributorName: e.target.value})}
            className="h-11 border-slate-300 focus:border-indigo-500"
            placeholder="Nom de l'entreprise"
            required
          />
        </div>
      </div>

      {/* Commission */}
      <div className="space-y-2">
        <Label htmlFor="commissionRate" className="text-sm font-medium text-slate-700">
          Taux de commission (%)
        </Label>
        <Input
          id="commissionRate"
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={formData.commissionRate}
          onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value)})}
          className="h-11 border-slate-300 focus:border-indigo-500"
          required
        />
      </div>

      {/* Territoire */}
      <div className="space-y-2">
        <Label htmlFor="territoryAssigned" className="text-sm font-medium text-slate-700">
          Territoire assigné
        </Label>
        <Input
          id="territoryAssigned"
          value={formData.territoryAssigned}
          onChange={(e) => setFormData({...formData, territoryAssigned: e.target.value})}
          className="h-11 border-slate-300 focus:border-indigo-500"
          placeholder="Ex: Bouches-du-Rhône, Région PACA..."
          required
        />
      </div>

      {/* Dates - Mobile responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">
            Date de début
          </Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
            className="h-11 border-slate-300 focus:border-indigo-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-sm font-medium text-slate-700">
            Date de fin
          </Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
            className="h-11 border-slate-300 focus:border-indigo-500"
            required
          />
        </div>
      </div>

      <DialogFooter className="pt-6">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 h-11 font-medium"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
              Création...
            </>
          ) : (
            'Créer le contrat'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Gestionnaire de templates - Mobile Optimisé
function TemplatesManager({ 
  templates, 
  isLoading, 
  onEdit 
}: { 
  templates: ContractTemplate[];
  isLoading: boolean;
  onEdit: (template: ContractTemplate) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-10 h-10 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucun template disponible</h3>
        <p className="text-slate-500 text-sm mb-6 max-w-sm">
          Les templates de contrats seront créés automatiquement par l'admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <Card key={template.id} className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  {template.name}
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  Version {template.version} • {template.type}
                </CardDescription>
              </div>
              <Badge className={template.isActive ? "bg-green-500" : "bg-red-500"}>
                {template.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Description compacte */}
              <p className="text-sm text-slate-600 line-clamp-2">
                {template.description || "Template de contrat de distribution"}
              </p>
              
              {/* Statistiques compactes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-indigo-600">
                    {Array.isArray(template.fields) ? template.fields.length : 0}
                  </div>
                  <div className="text-xs text-slate-600">Champs</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {Array.isArray(template.legalRequirements) ? template.legalRequirements.length : 0}
                  </div>
                  <div className="text-xs text-slate-600">Exigences</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-3 rounded-lg sm:block hidden">
                  <div className="text-lg font-bold text-purple-600">
                    {new Date(template.createdAt).getFullYear()}
                  </div>
                  <div className="text-xs text-slate-600">Créé</div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => onEdit(template)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier Template
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 sm:flex-none border-indigo-200 hover:bg-indigo-50 text-indigo-700"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  <span className="sm:hidden">Voir</span>
                  <span className="hidden sm:inline">Prévisualiser</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Dialog de détail du contrat - Mobile Optimisé
function ContractDetailDialog({ 
  contract, 
  open, 
  onClose 
}: { 
  contract: Contract;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Détail du contrat - {contract.type}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Informations complètes du contrat de distribution
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status et informations principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Statut:</span>
                  <Badge variant="secondary" className={`${CONTRACT_STATUSES[contract.status].color} text-white`}>
                    {CONTRACT_STATUSES[contract.status].label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Vendeur:</span>
                  <span className="font-semibold">{contract.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Distributeur:</span>
                  <span className="font-semibold">{contract.distributorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Commission:</span>
                  <span className="font-semibold text-emerald-600">{contract.commissionRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Dates importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Date de début:</span>
                  <span className="font-semibold">{new Date(contract.startDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Date de fin:</span>
                  <span className="font-semibold">{new Date(contract.endDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Créé le:</span>
                  <span className="font-semibold">{new Date(contract.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Modifié le:</span>
                  <span className="font-semibold">{new Date(contract.updatedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Territoire et conformité */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Territoire et conformité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-600">Territoire assigné</Label>
                <p className="font-semibold mt-1">{contract.territoryAssigned}</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-slate-600">Conformité légale</Label>
                  {contract.contractData?.legalCompliance?.isCompliant ? (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Conforme
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Non conforme
                    </Badge>
                  )}
                </div>
                
                {contract.contractData?.legalCompliance && !contract.contractData.legalCompliance.isCompliant && contract.contractData.legalCompliance.issues.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-sm text-red-800 font-medium mb-2">Problèmes identifiés :</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {contract.contractData.legalCompliance.issues.map((issue, index) => (
                        <li key={index} className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <p className="text-xs text-slate-500 mt-2">
                  Dernière révision : {contract.contractData?.legalCompliance?.lastReview ? new Date(contract.contractData.legalCompliance.lastReview).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="pt-6">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Tableau de bord de conformité légale
function LegalComplianceDashboard({ contracts }: { contracts: Contract[] }) {
  const totalContracts = contracts.length;
  const compliantContracts = contracts.filter(c => c.contractData?.legalCompliance?.isCompliant).length;
  const complianceRate = totalContracts > 0 ? (compliantContracts / totalContracts * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taux de Conformité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {complianceRate.toFixed(1)}%
            </div>
            <p className="text-gray-600">{compliantContracts}/{totalContracts} contrats conformes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contrats Expirés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {contracts.filter(c => c.status === 'expired').length}
            </div>
            <p className="text-gray-600">Nécessitent un renouvellement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Révisions Requises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {contracts.filter(c => !c.contractData?.legalCompliance?.isCompliant).length}
            </div>
            <p className="text-gray-600">Problèmes à résoudre</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contrats Non-Conformes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contracts
              .filter(c => !c.contractData?.legalCompliance?.isCompliant)
              .map((contract) => (
                <div key={contract.id} className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="font-medium">{contract.vendorName} - {contract.type}</div>
                  <div className="text-sm text-gray-600">
                    Problèmes: {contract.contractData?.legalCompliance?.issues?.join(', ') || 'Aucun'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Dernière révision: {contract.contractData?.legalCompliance?.lastReview ? new Date(contract.contractData.legalCompliance.lastReview).toLocaleDateString('fr-FR') : 'N/A'}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Analytiques des contrats
function ContractAnalytics({ contracts }: { contracts: Contract[] }) {
  const statusCounts = contracts.reduce((acc, contract) => {
    acc[contract.status] = (acc[contract.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => {
          const statusInfo = CONTRACT_STATUSES[status as Contract['status']];
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-gray-600">{statusInfo.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Répartition par Commission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {contracts.map((contract) => (
              <div key={contract.id} className="flex justify-between items-center py-2 border-b">
                <span>{contract.vendorName}</span>
                <span className="font-medium">{contract.commissionRate}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Dialog de modification de template - Mobile Optimisé
function TemplateEditDialog({ 
  template, 
  open, 
  onClose 
}: { 
  template: ContractTemplate;
  open: boolean;
  onClose: () => void;
}) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [templateContent, setTemplateContent] = useState<{
    content: string;
    tags: string[];
    totalCharacters: number;
  } | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const { toast } = useToast();

  // Gestionnaire pour les zones cliquables du logo SMG
  useEffect(() => {
    const handleLogoSMGMessage = (event: MessageEvent) => {
      if (event.data.type === 'ADD_LOGO_SMG') {
        toast({
          title: "Zone de signature SMG",
          description: "Utilisez l'upload d'images pour ajouter votre logo SMG dans cette section.",
          duration: 4000
        });
      }
    };

    window.addEventListener('message', handleLogoSMGMessage);
    return () => window.removeEventListener('message', handleLogoSMGMessage);
  }, [toast]);
  const queryClient = useQueryClient();

  const loadTemplateContent = async () => {
    setLoadingContent(true);
    try {
      // Forcer l'utilisation du template principal (ID 1) pour afficher les nouvelles balises
      const url = `/api/contract-template-content?templateId=1&cache=${Date.now()}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplateContent(data);
        setShowFullContent(true);
        console.log('🏷️ Balises chargées:', data.tags);
      } else {
        console.error('Erreur lors du chargement du contenu');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  // Mutation pour sauvegarder le template modifié
  const saveTemplateMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log('💾 Sauvegarde du contenu modifié - Longueur:', content.length);
      const response = await fetch('/api/contract-template-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: content,
          templateId: 1 // Forcer l'utilisation du template principal
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erreur sauvegarde:', errorData);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsEditingTemplate(false);
      toast({
        title: "Template sauvegardé",
        description: "Le contenu du template a été mis à jour avec succès"
      });
      // Recharger le contenu pour afficher les modifications
      loadTemplateContent();
      // Invalider le cache des templates
      queryClient.invalidateQueries({ queryKey: ['/api/contract-templates'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le template",
        variant: "destructive"
      });
    }
  });

  const handleSaveTemplate = (content: string) => {
    saveTemplateMutation.mutate(content);
  };

  // Fonction pour générer la prévisualisation
  const generatePreview = async () => {
    setLoadingPreview(true);
    try {
      const response = await fetch('/api/contract-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          templateId: 1,
          sampleData: {
            PRENOM_VENDEUR: "Marie",
            NOM_VENDEUR: "MARTIN", 
            NOM_ENTREPRISE_VENDEUR: "SARL TECH DISTRIBUTION",
            CODE_POSTAL: "69001",
            VILLE: "LYON",
            ADRESSE_VENDEUR: "15 Avenue de la République",
            TELEPHONE_VENDEUR: "01.23.45.67.89",
            EMAIL_VENDEUR: "marie.martin@tech-distrib.fr",
            SIRET_VENDEUR: "12345678901234",
            NUMERO_SECURITE_SOCIALE: "1234567890123",
            DATE_DEBUT: new Date().toLocaleDateString('fr-FR'),
            DATE_SIGNATURE: new Date().toLocaleDateString('fr-FR'),
            SALAIRE_BASE: "1500€",
            TAUX_COMMISSION: "15%"
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        setShowPreview(true);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de générer la prévisualisation",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur prévisualisation:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération de la prévisualisation",
        variant: "destructive"
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="mx-2 sm:mx-4 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] lg:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
            Modifier le template - {template.name}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Configuration du template de contrat
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informations du template */}
          <Card className="bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-600">Nom du template</Label>
                  <Input 
                    value={template.name}
                    className="mt-1 h-10"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-slate-600">Version</Label>
                  <Input 
                    value={template.version}
                    className="mt-1 h-10"
                    readOnly
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-600">Type</Label>
                <Input 
                  value={template.type}
                  className="mt-1 h-10"
                  readOnly
                />
              </div>
              <div>
                <Label className="text-slate-600">Description</Label>
                <Textarea 
                  value={template.description || "Aucune description disponible"}
                  className="mt-1"
                  rows={3}
                  readOnly
                />
              </div>
            </CardContent>
          </Card>

          {/* Champs configurés */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Champs configurés ({Array.isArray(template.fields) ? template.fields.length : 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.isArray(template.fields) ? 
                  template.fields.map((field: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">{field}</span>
                      </div>
                    </div>
                  )) : 
                  <div className="text-gray-500 text-sm">Aucun champ défini</div>
                }
              </div>
            </CardContent>
          </Card>

          {/* Exigences légales */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Exigences légales ({Array.isArray(template.legalRequirements) ? template.legalRequirements.length : 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(template.legalRequirements) ? 
                  template.legalRequirements.map((requirement: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 mr-3 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{requirement}</span>
                      </div>
                    </div>
                  )) :
                  <div className="text-gray-500 text-sm">Aucune exigence définie</div>
                }
              </div>
            </CardContent>
          </Card>

          {/* Informations techniques */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Informations techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Chemin du template:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-slate-700">
                  {template.templatePath}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Statut:</span>
                <Badge className={template.isActive ? "bg-green-500" : "bg-red-500"}>
                  {template.isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Créé le:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Modifié le:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(template.updatedAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            onClick={loadTemplateContent}
            disabled={loadingContent}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-11"
          >
            {loadingContent ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                Chargement...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Voir le contenu complet avec balises
              </>
            )}
          </Button>
          <Button 
            onClick={onClose}
            className="w-full sm:w-auto bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white h-11"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Dialog pour afficher le contenu complet - Optimisé Mobile */}
      <Dialog open={showFullContent} onOpenChange={setShowFullContent}>
        <DialogContent className="mx-2 sm:mx-4 max-w-[calc(100vw-1rem)] sm:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Contenu complet du template - Contrat de Distribution
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Document Word complet avec toutes les balises de substitution
            </DialogDescription>
          </DialogHeader>

          {templateContent && (
            <div className="space-y-4 sm:space-y-6 overflow-y-auto flex-1 px-1 sm:px-0">
              {/* Statistiques du template */}
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Statistiques du document</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{templateContent.totalCharacters.toLocaleString()}</div>
                      <div className="text-slate-600">Caractères</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{templateContent.tags.length}</div>
                      <div className="text-slate-600">Balises trouvées</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">24</div>
                      <div className="text-slate-600">Pages environ</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Balises détectées */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Balises de substitution détectées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {templateContent.tags.map((tag, index) => (
                      <div key={index} className="bg-white p-2 rounded-lg border border-green-200 text-center">
                        <code className="text-sm font-mono text-green-700">
                          {tag}
                        </code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Éditeur de contenu complet */}
              <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-800">Contenu complet du document</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">Modifiez directement le contenu et placez vos balises</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                      variant={isEditingTemplate ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {isEditingTemplate ? "Aperçu" : "Modifier"}
                    </Button>
                    <Button
                      onClick={generatePreview}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
                      disabled={loadingPreview}
                    >
                      {loadingPreview ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      Prévisualisation
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingTemplate ? (
                    <TemplateEditor
                      content={templateContent.content}
                      onSave={handleSaveTemplate}
                      onCancel={() => setIsEditingTemplate(false)}
                      isLoading={saveTemplateMutation.isPending}
                    />
                  ) : (
                    <div className="bg-white p-2 sm:p-4 rounded-lg border max-h-60 sm:max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs sm:text-sm font-mono text-slate-700 leading-relaxed break-words">
                        {templateContent.content}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="pt-4 sm:pt-6 flex-shrink-0">
            <Button 
              onClick={() => setShowFullContent(false)}
              className="w-full sm:w-auto bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white h-11 sm:h-12"
            >
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de prévisualisation */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="mx-2 sm:mx-4 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] lg:max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Prévisualisation du contrat
            </DialogTitle>
            <DialogDescription>
              Aperçu du contrat final avec mise en page et formatage
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-4">
              {/* Statistiques de la prévisualisation - Mobile Optimisé */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-lg sm:text-xl font-bold text-blue-600">{previewData.stats?.pages || 0}</div>
                  <div className="text-xs text-blue-700">Pages</div>
                </div>
                <div className="bg-green-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-lg sm:text-xl font-bold text-green-600">{Math.floor((previewData.stats?.characters || 0) / 1000)}k</div>
                  <div className="text-xs text-green-700">Caractères</div>
                </div>
                <div className="bg-orange-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-lg sm:text-xl font-bold text-orange-600">{previewData.stats?.replacements || 0}</div>
                  <div className="text-xs text-orange-700">Balises</div>
                </div>
                <div className="bg-purple-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-lg sm:text-xl font-bold text-purple-600">{previewData.stats?.articles || 0}</div>
                  <div className="text-xs text-purple-700">Articles</div>
                </div>
                <div className="bg-indigo-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-lg sm:text-xl font-bold text-indigo-600">{Math.floor((previewData.stats?.wordsCount || 0) / 100) / 10}k</div>
                  <div className="text-xs text-indigo-700">Mots</div>
                </div>
                <div className="bg-teal-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-lg sm:text-xl font-bold text-teal-600">{previewData.stats?.estimatedReadingTime || "0"}</div>
                  <div className="text-xs text-teal-700">Lecture</div>
                </div>
              </div>
              
              {/* Contenu formaté avec sauts de page */}
              <div className="bg-white border rounded-lg shadow-sm">
                <div className="bg-gray-50 p-2 sm:p-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="font-medium text-gray-800">Document final</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                      <Download className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="sm:hidden">PDF</span>
                      <span className="hidden sm:inline">Télécharger PDF</span>
                    </Button>
                  </div>
                </div>
                <div 
                  className="p-3 sm:p-6 max-h-[400px] sm:max-h-[600px] overflow-y-auto"
                  style={{
                    fontFamily: 'Georgia, serif',
                    lineHeight: '1.6',
                    fontSize: '12px'
                  }}
                >

                  <div 
                    dangerouslySetInnerHTML={{ __html: previewData.formattedContent }}
                    className="mx-auto prose prose-sm max-w-none bg-white border border-gray-200 shadow-lg rounded-lg p-6"
                    style={{
                      maxWidth: '210mm',
                      fontFamily: 'Georgia, serif',
                      lineHeight: '1.6'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-4 sm:pt-6">
            <Button onClick={() => setShowPreview(false)} variant="outline" className="w-full sm:w-auto">
              <X className="w-4 h-4 mr-2" />
              Fermer la prévisualisation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Interface pour les termes contractuels
interface ContractTerm {
  id: number;
  templateId: number;
  title: string;
  content: string;
  position: number;
  isRequired: boolean;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Composant d'édition de template
function TemplateEditor({ 
  content, 
  onSave, 
  onCancel, 
  isLoading 
}: { 
  content: string; 
  onSave: (content: string) => void; 
  onCancel: () => void; 
  isLoading: boolean;
}) {
  const [editedContent, setEditedContent] = useState(content);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

  // Fonction pour upload d'images
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/contract-images/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Erreur upload');

      const result = await response.json();
      
      // Extraire seulement l'ID de fichier pour la balise (sans "contract-image-" prefix)
      const fileId = result.filename.replace('contract-image-', '').replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
      const imageTag = `\n\n{{IMAGE:${fileId}}}\n\n`;
      
      // Obtenir la référence au textarea dans l'éditeur
      const textarea = document.getElementById('contract-editor') as HTMLTextAreaElement;
      const cursorPos = textarea?.selectionStart || editedContent.length;
      
      const newContent = 
        editedContent.slice(0, cursorPos) + 
        imageTag + 
        editedContent.slice(cursorPos);
      
      setEditedContent(newContent);

      // Mettre le focus sur le textarea après insertion
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(cursorPos + imageTag.length, cursorPos + imageTag.length);
        }
      }, 100);

      toast({
        title: "Image uploadée",
        description: `Image ajoutée: ${imageTag.trim()}`,
        variant: "default"
      });
      
      console.log(`📷 Image uploadée et balise insérée: ${imageTag.trim()}`);

    } catch (error) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur upload",
        description: "Impossible d'uploader l'image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleSave = () => {
    onSave(editedContent);
  };

  // Recherche et surlignage des balises
  const highlightTags = (text: string) => {
    const tagRegex = /{{[^}]+}}/g;
    return text.replace(tagRegex, (match) => `<mark class="bg-yellow-200 px-1 rounded">${match}</mark>`);
  };

  return (
    <div className="space-y-4">
      {/* Barre d'outils - Mobile Optimisé */}
      <div className="space-y-3">
        {/* Recherche */}
        <div className="w-full">
          <Input
            placeholder="Rechercher dans le contenu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11"
          />
        </div>
        
        {/* Upload d'images et actions */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex flex-col gap-2 sm:w-auto w-full">
            <div className="flex items-center gap-2 w-full">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImage}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploadingImage}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0 flex-1 sm:flex-none h-11"
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                    <span className="sm:hidden">Upload...</span>
                    <span className="hidden sm:inline">Upload...</span>
                  </>
                ) : (
                  <>
                    <Image className="w-4 h-4 mr-2" />
                    <span className="sm:hidden">📷 Image</span>
                    <span className="hidden sm:inline">📷 Insérer Image</span>
                  </>
                )}
              </Button>
            </div>
            <div className="text-xs text-slate-500 text-center sm:text-left">
              Génère une balise {`{{IMAGE:id}}`}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 sm:flex-none h-11"
            >
              <X className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="sm:hidden">Annuler</span>
              <span className="hidden sm:inline">Annuler</span>
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none h-11"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-1 sm:mr-2"></div>
                  <span className="sm:hidden">Save...</span>
                  <span className="hidden sm:inline">Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="sm:hidden">Save</span>
                  <span className="hidden sm:inline">Sauvegarder</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Éditeur de texte - Mobile Optimisé */}
      <div className="border rounded-lg">
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="min-h-64 sm:min-h-96 font-mono text-xs sm:text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20"
          placeholder="Modifiez le contenu du template ici... Cliquez sur 📷 Insérer Image pour ajouter des captures d'écran"
          id="contract-editor"
        />
      </div>

      {/* Informations */}
      <div className="flex justify-between items-center text-sm text-slate-600">
        <span>Caractères: {editedContent.length}</span>
        <span>Balises détectées: {(editedContent.match(/{{[^}]+}}/g) || []).length}</span>
        {(editedContent.match(/{{IMAGE:[^}]+}}/g) || []).length > 0 && (
          <span className="text-purple-600 font-medium">
            📷 {(editedContent.match(/{{IMAGE:[^}]+}}/g) || []).length} image(s)
          </span>
        )}
      </div>
    </div>
  );
}

// Gestionnaire complet des termes contractuels
function ContractTermsManager({ templates }: { templates: ContractTemplate[] }) {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [editingTerm, setEditingTerm] = useState<ContractTerm | null>(null);
  const [showNewTermDialog, setShowNewTermDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des balises françaises disponibles
  const { data: frenchTags } = useQuery({
    queryKey: ['/api/contract-tags'],
    enabled: true
  });

  // Balises vendeur spécialement pour la localisation
  const locationTags = [
    { name: "CODE_POSTAL", description: "Code postal du vendeur", category: "localisation" },
    { name: "VILLE", description: "Ville de résidence du vendeur", category: "localisation" }
  ];

  // Récupération des termes pour le template sélectionné
  const { data: terms, isLoading: termsLoading } = useQuery({
    queryKey: ['/api/contract-terms', selectedTemplate?.id],
    enabled: !!selectedTemplate?.id,
  });

  // Mutation pour créer un terme
  const createTermMutation = useMutation({
    mutationFn: async (termData: Partial<ContractTerm>) => {
      const response = await fetch('/api/contract-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termData)
      });
      if (!response.ok) throw new Error('Erreur création');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contract-terms'] });
      setShowNewTermDialog(false);
      toast({
        title: "Terme créé",
        description: "Le terme contractuel a été ajouté avec succès"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le terme contractuel",
        variant: "destructive"
      });
    }
  });

  // Mutation pour modifier un terme
  const updateTermMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<ContractTerm> }) => {
      const response = await fetch(`/api/contract-terms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erreur modification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contract-terms'] });
      setEditingTerm(null);
      toast({
        title: "Terme modifié",
        description: "Le terme contractuel a été mis à jour avec succès"
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <Settings className="w-6 h-6" />
            Gestion des Termes Contractuels
          </CardTitle>
          <CardDescription className="text-slate-600">
            Personnalisez et organisez les termes de vos contrats avec gestion des balises de substitution
          </CardDescription>
        </CardHeader>
      </Card>

      {/* NOUVELLES BALISES - Section de localisation vendeur */}
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-emerald-700">
            <Tag className="w-5 h-5" />
            🆕 Nouvelles Balises de Localisation Vendeur
          </CardTitle>
          <CardDescription className="text-emerald-600">
            Utilisez ces nouvelles balises pour récupérer automatiquement le code postal et la ville du vendeur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {locationTags.map((tag) => (
              <div 
                key={tag.name} 
                className="bg-white p-4 rounded-lg border-2 border-emerald-200 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-800">{`{{${tag.name}}}`}</div>
                    <div className="text-sm text-emerald-600 mt-1">{tag.description}</div>
                    <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-700">
                      {tag.category}
                    </Badge>
                  </div>
                  <div className="ml-4 text-2xl">📍</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
            <div className="text-sm text-emerald-700">
              <strong>ℹ️ Comment utiliser :</strong>
              <br />
              Copiez-collez <code className="bg-white px-2 py-1 rounded">{`{{CODE_POSTAL}}`}</code> ou <code className="bg-white px-2 py-1 rounded">{`{{VILLE}}`}</code> dans vos templates.
              <br />
              Ces balises récupèrent automatiquement les données du profil vendeur.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sélection du template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Sélectionner un Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedTemplate?.id.toString() || ""} 
            onValueChange={(value) => {
              const template = templates.find(t => t.id.toString() === value);
              setSelectedTemplate(template || null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisissez un template à éditer" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{template.name}</span>
                    <span className="text-xs text-slate-500">Version {String(template.version)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Termes du template sélectionné */}
      {selectedTemplate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5" />
                Termes - {selectedTemplate.name}
              </CardTitle>
              <CardDescription>
{Array.isArray(terms) ? terms.length : 0} terme(s) configuré(s)
              </CardDescription>
            </div>
            <Dialog open={showNewTermDialog} onOpenChange={setShowNewTermDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Terme
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau terme</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouveau terme contractuel avec ses balises de substitution
                  </DialogDescription>
                </DialogHeader>
                <TermForm 
                  templateId={selectedTemplate.id}
                  onSubmit={(data) => createTermMutation.mutate(data)}
                  isLoading={createTermMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {termsLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (!terms || (Array.isArray(terms) && terms.length === 0)) ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Aucun terme configuré</h3>
                <p className="text-slate-500 mb-4">Commencez par ajouter votre premier terme contractuel</p>
                <Button 
                  onClick={() => setShowNewTermDialog(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un terme
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {terms && Array.isArray(terms) && terms.map((term: any) => (
                  <TermCard 
                    key={term.id} 
                    term={term as ContractTerm} 
                    onEdit={setEditingTerm}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section des balises françaises disponibles */}
      {frenchTags && Array.isArray(frenchTags) && frenchTags.length > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Tag className="w-5 h-5" />
              Balises Françaises Disponibles
            </CardTitle>
            <CardDescription className="text-green-700">
              Utilisez ces balises dans vos termes contractuels pour personnaliser vos contrats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {frenchTags.map((tag: any, index: number) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-green-200 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="bg-green-100 px-2 py-1 rounded text-sm font-mono text-green-800">
                      {`{{${tag.name}}}`}
                    </code>
                    <Badge variant="outline" className="text-xs">{tag.category}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{tag.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'édition d'un terme */}
      {editingTerm && (
        <Dialog open={!!editingTerm} onOpenChange={() => setEditingTerm(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le terme</DialogTitle>
              <DialogDescription>
                Éditez le contenu et les balises de ce terme contractuel
              </DialogDescription>
            </DialogHeader>
            <TermForm 
              templateId={selectedTemplate?.id!}
              term={editingTerm}
              onSubmit={(data) => updateTermMutation.mutate({ id: editingTerm.id, data })}
              isLoading={updateTermMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Bouton de fermeture en bas de page */}
      <div className="mt-8 flex justify-center pb-6">
        <Button
          onClick={handleClose}
          variant="outline"
          size="lg"
          className="bg-white/80 backdrop-blur-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
        >
          <X className="h-5 w-5 mr-2" />
          Fermer
        </Button>
      </div>
    </div>
  );
}

// Carte d'affichage d'un terme
function TermCard({ term, onEdit }: { term: ContractTerm; onEdit: (term: ContractTerm) => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-slate-800">{term.title}</h4>
              {term.isRequired && (
                <Badge variant="destructive" className="text-xs">Obligatoire</Badge>
              )}
              <Badge variant="outline" className="text-xs">{term.category}</Badge>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{term.content}</p>
            {term.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {term.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 ml-2 sm:ml-4">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEdit(term)}
              className="hover:bg-blue-50 w-full sm:w-auto"
            >
              <Edit className="w-4 h-4 mr-1" />
              <span className="sm:hidden">Modifier</span>
              <span className="hidden sm:inline">Modifier terme</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Formulaire de création/édition de terme
function TermForm({ 
  templateId, 
  term, 
  onSubmit, 
  isLoading 
}: { 
  templateId: number;
  term?: ContractTerm;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    templateId,
    title: term?.title || '',
    content: term?.content || '',
    position: term?.position || 1,
    isRequired: term?.isRequired || false,
    category: term?.category || 'general',
    tags: term?.tags?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre du terme</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Ex: Obligations du distributeur"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Général</SelectItem>
              <SelectItem value="obligations">Obligations</SelectItem>
              <SelectItem value="commissions">Commissions</SelectItem>
              <SelectItem value="territory">Territoire</SelectItem>
              <SelectItem value="legal">Légal</SelectItem>
              <SelectItem value="termination">Résiliation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Contenu du terme</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({...formData, content: e.target.value})}
          placeholder="Saisissez le contenu du terme avec les balises pour les éléments à remplacer..."
          rows={8}
          required
        />
        <p className="text-xs text-slate-500">
          Utilisez des balises françaises comme PRENOM_VENDEUR, NOM_VENDEUR, TERRITOIRE, TAUX_COMMISSION, DATE_DEBUT, etc.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            type="number"
            value={formData.position}
            onChange={(e) => setFormData({...formData, position: parseInt(e.target.value)})}
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Balises (séparées par des virgules)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
            placeholder="PRENOM_VENDEUR, NOM_VENDEUR, TERRITOIRE, TAUX_COMMISSION"
          />
        </div>
        <div className="flex items-center space-x-2 pt-8">
          <input
            id="required"
            type="checkbox"
            checked={formData.isRequired}
            onChange={(e) => setFormData({...formData, isRequired: e.target.checked})}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Label htmlFor="required" className="text-sm">Terme obligatoire</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-indigo-500 to-purple-600">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {term ? 'Mettre à jour' : 'Créer le terme'}
        </Button>
      </DialogFooter>
    </form>
  );
}


