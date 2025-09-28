import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, StandardizedTabsList, StandardizedTabsTrigger } from "@/components/ui/standardized-tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Users, BarChart3, FileText, Settings, DollarSign, CheckSquare, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function MLMAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("distributeurs");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistributeurId, setSelectedDistributeurId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("virement");

  // Rediriger si l'utilisateur n'est pas admin
  if (user && !user.isAdmin) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertTitle>Accès refusé</AlertTitle>
            <AlertDescription>
              Vous n'avez pas les droits d'accès nécessaires pour cette page.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Récupérer tous les distributeurs
  const { 
    data: distributeurs, 
    isLoading: isLoadingDistributeurs,
    isError: isDistributeursError,
    error: distributeursError
  } = useQuery({
    queryKey: ["/api/mlm/all-distributeurs"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/mlm/all-distributeurs");
        return await response.json();
      } catch (error) {
        throw error;
      }
    }
  });

  // Récupérer toutes les règles de commission
  const { 
    data: rules, 
    isLoading: isLoadingRules 
  } = useQuery({
    queryKey: ["/api/mlm/rules"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/rules");
      return await response.json();
    }
  });

  // Récupérer le rapport mensuel pour le distributeur sélectionné
  const { 
    data: report, 
    isLoading: isLoadingReport,
    refetch: refetchReport
  } = useQuery({
    queryKey: ["/api/mlm/admin/report", selectedDistributeurId, selectedMonth],
    queryFn: async () => {
      if (!selectedDistributeurId) return null;
      const response = await apiRequest("GET", `/api/mlm/admin/report/${selectedDistributeurId}/${selectedMonth}`);
      return await response.json();
    },
    enabled: !!selectedDistributeurId && !!selectedMonth
  });

  // Mutation pour valider les commissions d'un mois
  const validateCommissionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDistributeurId || !selectedMonth) {
        throw new Error("Distributeur et mois requis");
      }
      const response = await apiRequest("POST", `/api/mlm/validate-commissions/${selectedMonth}`, {
        distributeurId: selectedDistributeurId
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Commissions validées",
        description: "Les commissions ont été validées avec succès.",
      });
      refetchReport();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de validation",
        description: error.message || "Une erreur est survenue lors de la validation des commissions.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour payer les commissions d'un mois
  const payCommissionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDistributeurId || !selectedMonth || !selectedPaymentMethod) {
        throw new Error("Distributeur, mois et méthode de paiement requis");
      }
      const response = await apiRequest("POST", `/api/mlm/pay-commissions/${selectedMonth}`, {
        distributeurId: selectedDistributeurId,
        methodePaiement: selectedPaymentMethod
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Paiement effectué",
        description: `Les commissions ont été marquées comme payées par ${selectedPaymentMethod}.`,
      });
      refetchReport();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de paiement",
        description: error.message || "Une erreur est survenue lors du paiement des commissions.",
        variant: "destructive",
      });
    },
  });

  // Filtrer les distributeurs en fonction de la recherche
  const filteredDistributeurs = distributeurs?.filter((distributeur: any) => {
    const searchLower = searchQuery.toLowerCase();
    const searchFields = [
      distributeur.codeVendeur,
      distributeur.user?.username,
      distributeur.prenom,
      distributeur.nom
    ].filter(Boolean).map(field => field.toLowerCase());
    
    return searchFields.some(field => field.includes(searchLower));
  });

  // Formatage des données pour l'affichage
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return 'Date invalide';
    }
  };

  // Afficher la page de chargement
  if (isLoadingDistributeurs) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-medium">Chargement des données MLM...</h2>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Afficher l'erreur si nécessaire
  if (isDistributeursError) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>
              Une erreur s'est produite lors du chargement des données MLM : {distributeursError instanceof Error ? distributeursError.message : "Erreur inconnue"}
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Administration MLM</h1>
            <p className="text-muted-foreground">
              Gérez les distributeurs, les commissions et les règles MLM
            </p>
          </div>
        </div>

        {/* Onglets */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <StandardizedTabsList className="grid w-full grid-cols-2 sm:grid-cols-4" variant="gradient">
            <StandardizedTabsTrigger value="distributeurs" variant="gradient" icon={<Users className="h-4 w-4" />}>
              <span className="hidden sm:inline">Distributeurs</span>
              <span className="sm:hidden">Dist.</span>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="commissions" variant="gradient" icon={<DollarSign className="h-4 w-4" />}>
              <span className="hidden sm:inline">Commissions</span>
              <span className="sm:hidden">Com.</span>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="regles" variant="gradient" icon={<Settings className="h-4 w-4" />}>
              <span className="hidden sm:inline">Règles</span>
              <span className="sm:hidden">Règles</span>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="rapports" variant="gradient" icon={<BarChart3 className="h-4 w-4" />}>
              <span className="hidden sm:inline">Statistiques</span>
              <span className="sm:hidden">Stats</span>
            </StandardizedTabsTrigger>
          </StandardizedTabsList>

          {/* Onglet Distributeurs */}
          <TabsContent value="distributeurs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Liste des distributeurs</CardTitle>
                <CardDescription>
                  {distributeurs?.length || 0} distributeurs enregistrés dans le système MLM
                </CardDescription>
                <div className="flex items-center space-x-2 mt-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un distributeur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {/* Version desktop */}
                  <div className="hidden md:block">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-4 text-sm font-medium">Code Vendeur</th>
                          <th className="text-left py-2 px-4 text-sm font-medium">Distributeur</th>
                          <th className="text-left py-2 px-4 text-sm font-medium">Email</th>
                          <th className="text-center py-2 px-4 text-sm font-medium">Niveau</th>
                          <th className="text-center py-2 px-4 text-sm font-medium">Statut</th>
                          <th className="text-right py-2 px-4 text-sm font-medium">Inscription</th>
                          <th className="text-right py-2 px-4 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDistributeurs?.map((distributeur: any) => (
                          <tr key={distributeur.id} className="border-b border-border hover:bg-accent/10">
                            <td className="py-2 px-4 text-sm font-medium">{distributeur.codeVendeur}</td>
                            <td className="py-2 px-4 text-sm">
                              {distributeur.prenom} {distributeur.nom}
                            </td>
                            <td className="py-2 px-4 text-sm">{distributeur.user?.username}</td>
                            <td className="py-2 px-4 text-sm text-center">{distributeur.niveau}</td>
                            <td className="py-2 px-4 text-sm text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${distributeur.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {distributeur.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-sm text-right">
                              {formatDate(distributeur.dateRecrutement)}
                            </td>
                            <td className="py-2 px-4 text-sm text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedDistributeurId(distributeur.id);
                                  setActiveTab("commissions");
                                }}
                              >
                                Gérer
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Version mobile optimisée */}
                  <div className="md:hidden">
                    <div className="grid gap-3">
                      {filteredDistributeurs?.map((distributeur: any) => (
                        <div key={distributeur.id} className="border border-border rounded-md p-3 hover:bg-accent/5">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">
                                {distributeur.prenom} {distributeur.nom}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Code: {distributeur.codeVendeur}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Email: {distributeur.user?.username}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${distributeur.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {distributeur.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div>
                              <span>Niveau: {distributeur.niveau}</span>
                              <span className="mx-2">•</span>
                              <span>Inscrit: {formatDate(distributeur.dateRecrutement)}</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedDistributeurId(distributeur.id);
                                setActiveTab("commissions");
                              }}
                            >
                              Gérer
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {filteredDistributeurs?.length === 0 && (
                    <Alert className="bg-muted mt-4">
                      <AlertTitle>Aucun résultat</AlertTitle>
                      <AlertDescription>
                        Aucun distributeur ne correspond à votre recherche.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Commissions */}
          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des commissions</CardTitle>
                <CardDescription className="mb-4">
                  Validez et effectuez le paiement des commissions des distributeurs
                </CardDescription>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:items-end space-y-2 lg:space-y-0 lg:space-x-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Distributeur</label>
                    <Select
                      value={selectedDistributeurId?.toString() || ""}
                      onValueChange={(value) => setSelectedDistributeurId(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez un distributeur" />
                      </SelectTrigger>
                      <SelectContent>
                        {distributeurs?.map((distributeur: any) => (
                          <SelectItem key={distributeur.id} value={distributeur.id.toString()}>
                            {distributeur.codeVendeur} - {distributeur.prenom} {distributeur.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Période (AAAA-MM)</label>
                    <Input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => refetchReport()}
                      disabled={!selectedDistributeurId || !selectedMonth}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Afficher
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingReport ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !report ? (
                  <Alert className="bg-muted">
                    <AlertTitle>Aucune donnée</AlertTitle>
                    <AlertDescription>
                      Sélectionnez un distributeur et une période pour afficher les commissions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total des commissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {Number(report.totalCommissions || 0).toFixed(2)} €
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Période: {selectedMonth}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Statut des commissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(report.commissionsParStatut || {}).map(([statut, montant]: [string, any]) => (
                              <div key={statut} className="flex justify-between items-center">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs",
                                  statut === 'calculee' ? 'bg-yellow-100 text-yellow-800' : 
                                  statut === 'validee' ? 'bg-green-100 text-green-800' : 
                                  statut === 'payee' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-gray-100 text-gray-800'
                                )}>
                                  {statut.charAt(0).toUpperCase() + statut.slice(1)}
                                </span>
                                <span className="font-medium">{Number(montant).toFixed(2)} €</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Actions disponibles</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Button 
                              variant="outline" 
                              className="w-full justify-start"
                              onClick={() => validateCommissionsMutation.mutate()}
                              disabled={validateCommissionsMutation.isPending || !report.commissionsParStatut?.calculee}
                            >
                              {validateCommissionsMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <CheckSquare className="h-4 w-4 mr-2" />
                              )}
                              Valider les commissions
                            </Button>

                            <div className="space-y-2">
                              <Select
                                value={selectedPaymentMethod}
                                onValueChange={setSelectedPaymentMethod}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Méthode de paiement" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="virement">Virement bancaire</SelectItem>
                                  <SelectItem value="cheque">Chèque</SelectItem>
                                  <SelectItem value="especes">Espèces</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button 
                                variant="default" 
                                className="w-full justify-start"
                                onClick={() => payCommissionsMutation.mutate()}
                                disabled={payCommissionsMutation.isPending || !report.commissionsParStatut?.validee}
                              >
                                {payCommissionsMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <DollarSign className="h-4 w-4 mr-2" />
                                )}
                                Payer les commissions
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Détail des commissions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          {/* Version desktop */}
                          <div className="hidden md:block">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 px-4 text-sm font-medium">Date</th>
                                  <th className="text-left py-2 px-4 text-sm font-medium">Client</th>
                                  <th className="text-left py-2 px-4 text-sm font-medium">Produit</th>
                                  <th className="text-center py-2 px-4 text-sm font-medium">Niveau</th>
                                  <th className="text-center py-2 px-4 text-sm font-medium">Taux</th>
                                  <th className="text-right py-2 px-4 text-sm font-medium">Montant</th>
                                  <th className="text-center py-2 px-4 text-sm font-medium">Statut</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.transactions?.map((transaction: any) => (
                                  <tr key={transaction.id} className="border-b border-border hover:bg-accent/10">
                                    <td className="py-2 px-4 text-sm">
                                      {formatDate(transaction.createdAt)}
                                    </td>
                                    <td className="py-2 px-4 text-sm">
                                      {transaction.client?.prenom} {transaction.client?.nom}
                                    </td>
                                    <td className="py-2 px-4 text-sm">
                                      {transaction.produitType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </td>
                                    <td className="py-2 px-4 text-sm text-center">{transaction.niveau}</td>
                                    <td className="py-2 px-4 text-sm text-center">{transaction.taux}%</td>
                                    <td className="py-2 px-4 text-sm text-right font-medium">
                                      {Number(transaction.montant).toFixed(2)} €
                                    </td>
                                    <td className="py-2 px-4 text-sm text-center">
                                      <span className={cn(
                                        "px-2 py-1 rounded-full text-xs",
                                        transaction.statut === 'calculee' ? 'bg-yellow-100 text-yellow-800' : 
                                        transaction.statut === 'validee' ? 'bg-green-100 text-green-800' : 
                                        transaction.statut === 'payee' ? 'bg-blue-100 text-blue-800' : 
                                        'bg-gray-100 text-gray-800'
                                      )}>
                                        {transaction.statut.charAt(0).toUpperCase() + transaction.statut.slice(1)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Version mobile */}
                          <div className="md:hidden">
                            <div className="grid gap-3">
                              {report.transactions?.map((transaction: any) => (
                                <div key={transaction.id} className="border border-border rounded-md p-3 hover:bg-accent/5">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="text-sm font-medium mb-1">
                                        {transaction.produitType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Client: {transaction.client?.prenom} {transaction.client?.nom}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Date: {formatDate(transaction.createdAt)}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-base">
                                        {Number(transaction.montant).toFixed(2)} €
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Niveau {transaction.niveau} • {transaction.taux}%
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
                                    <span className={cn(
                                      "px-2 py-1 rounded-full text-xs",
                                      transaction.statut === 'calculee' ? 'bg-yellow-100 text-yellow-800' : 
                                      transaction.statut === 'validee' ? 'bg-green-100 text-green-800' : 
                                      transaction.statut === 'payee' ? 'bg-blue-100 text-blue-800' : 
                                      'bg-gray-100 text-gray-800'
                                    )}>
                                      {transaction.statut.charAt(0).toUpperCase() + transaction.statut.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {!report.transactions?.length && (
                            <Alert className="bg-muted mt-4">
                              <AlertTitle>Aucune commission</AlertTitle>
                              <AlertDescription>
                                Aucune commission enregistrée pour ce distributeur sur cette période.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Règles de commission */}
          <TabsContent value="regles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Règles de commission MLM</CardTitle>
                <CardDescription>
                  Configuration des taux de commission par niveau et type de produit
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRules ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Version desktop */}
                    <div className="hidden md:block">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-4 text-sm font-medium">Niveau</th>
                            <th className="text-left py-2 px-4 text-sm font-medium">Type de produit</th>
                            <th className="text-center py-2 px-4 text-sm font-medium">Taux (%)</th>
                            <th className="text-center py-2 px-4 text-sm font-medium">Volume minimum</th>
                            <th className="text-center py-2 px-4 text-sm font-medium">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rules?.map((rule: any) => (
                            <tr key={rule.id} className="border-b border-border hover:bg-accent/10">
                              <td className="py-2 px-4 text-sm">{rule.niveau}</td>
                              <td className="py-2 px-4 text-sm">
                                {rule.produitType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </td>
                              <td className="py-2 px-4 text-sm text-center font-medium">{rule.tauxCommission}%</td>
                              <td className="py-2 px-4 text-sm text-center">{rule.volumeMinimum || '-'}</td>
                              <td className="py-2 px-4 text-sm text-center">
                                <span className={`px-2 py-1 rounded-full text-xs ${rule.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {rule.actif ? 'Actif' : 'Inactif'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Version mobile */}
                    <div className="md:hidden">
                      <div className="grid gap-3">
                        {rules?.map((rule: any) => (
                          <div key={rule.id} className="border border-border rounded-md p-3 hover:bg-accent/5">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="font-semibold">Niveau {rule.niveau}</span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${rule.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {rule.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                            <div className="text-sm">
                              {rule.produitType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Taux: <span className="font-semibold">{rule.tauxCommission}%</span></span>
                              <span>Vol. min: {rule.volumeMinimum || '-'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Rapports et statistiques */}
          <TabsContent value="rapports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rapports et statistiques MLM</CardTitle>
                <CardDescription>
                  Analyse des performances du réseau de distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Fonctionnalité en développement</AlertTitle>
                  <AlertDescription>
                    Les rapports et statistiques détaillés seront disponibles prochainement dans une prochaine mise à jour.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}