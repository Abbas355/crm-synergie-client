import { Calculator } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export interface DirectSaleCommission {
  id: number;
  vendeurId: number;
  vendeurCode?: string;
  clientId: number;
  clientName: string;
  productType: string;
  points: number;
  date: string;
  commission: number;
  cumulativePoints: number;
  tier: number;
}

export interface CommissionTierConfig {
  min: number;
  max: number;
  freebox_pop: number;
  freebox_essentiel: number;
  freebox_ultra: number;
  forfait_5g: number;
}

export function DirectSalesView() {
  // Récupérer les données des commissions sur ventes directes
  const { data: commissions, isLoading: isLoadingCommissions } = useQuery<DirectSaleCommission[]>({
    queryKey: ["/api/mlm/direct-sales-commissions"],
  });

  // Vérifier si nous sommes en mode admin (basé sur la présence de codes vendeurs multiples)
  const isAdminView = commissions && commissions.length > 0 && 
    new Set(commissions.map(c => c.vendeurCode)).size > 1;

  // Récupérer la configuration des tranches de commission
  const { data: tiers, isLoading: isLoadingTiers } = useQuery<CommissionTierConfig[]>({
    queryKey: ["/api/mlm/commission-tiers"],
  });

  // Calculer les statistiques
  const totalCommission = commissions?.reduce((sum, sale) => sum + sale.commission, 0) || 0;
  const totalPoints = commissions?.reduce((sum, sale) => sum + sale.points, 0) || 0;
  const maxTier = commissions?.reduce((max, sale) => Math.max(max, sale.tier), 0) || 0;
  
  const currentMonthName = new Date().toLocaleString('fr-FR', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const getProductName = (type: string) => {
    switch (type) {
      case 'freebox_pop': return 'Freebox Pop';
      case 'freebox_essentiel': return 'Freebox Essentiel';
      case 'freebox_ultra': return 'Freebox Ultra';
      case 'forfait_5g': return 'Forfait 5G';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const getCommissionTierBadge = (tier: number) => {
    switch (tier) {
      case 1: return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Tranche 1</Badge>;
      case 2: return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">Tranche 2</Badge>;
      case 3: return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">Tranche 3</Badge>;
      case 4: return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">Tranche 4</Badge>;
      default: return <Badge variant="outline">Tranche {tier}</Badge>;
    }
  };

  if (isLoadingCommissions || isLoadingTiers) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Commission sur Ventes Directes (CVD)
        </CardTitle>
        <CardDescription>
          Suivi de vos points et commissions sur ventes personnelles - {currentMonthName} {currentYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistiques résumées */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Points cumulés</div>
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {maxTier > 0 ? `Tranche ${maxTier} atteinte` : 'Aucune vente ce mois-ci'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Commission totale</div>
              <div className="text-2xl font-bold">{totalCommission}€</div>
              <div className="text-xs text-muted-foreground mt-1">
                {commissions?.length || 0} ventes réalisées
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Prochaine tranche</div>
              {maxTier < 4 && tiers ? (
                <>
                  <div className="text-2xl font-bold">
                    {maxTier === 0 ? 25 : maxTier === 1 ? 50 : maxTier === 2 ? 100 : 101}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {maxTier === 0 
                      ? 'Points pour atteindre la tranche 1'
                      : `${tiers[maxTier].min - totalPoints} points pour la tranche ${maxTier + 1}`}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tranche maximale atteinte
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tableau des tranches de commission - Version desktop */}
        <div className="mb-6 hidden md:block overflow-x-auto">
          <p className="text-sm font-medium mb-2">Grille des commissions par tranche</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tranche</TableHead>
                <TableHead>Plage de points</TableHead>
                <TableHead className="text-center">Freebox Pop</TableHead>
                <TableHead className="text-center">Freebox Essentiel</TableHead>
                <TableHead className="text-center">Freebox Ultra</TableHead>
                <TableHead className="text-center">Forfait 5G</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers?.map((tier, index) => (
                <TableRow key={index} className={maxTier === index + 1 ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">
                    Tranche {index + 1}
                  </TableCell>
                  <TableCell>
                    {tier.min} à {tier.max === -1 ? '+' : tier.max} points
                  </TableCell>
                  <TableCell className="text-center">{tier.freebox_pop}€</TableCell>
                  <TableCell className="text-center">{tier.freebox_essentiel}€</TableCell>
                  <TableCell className="text-center">{tier.freebox_ultra}€</TableCell>
                  <TableCell className="text-center">{tier.forfait_5g}€</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Version mobile optimisée des tranches de commission */}
        <div className="mb-6 md:hidden">
          <p className="text-sm font-medium mb-2">Grille des commissions par tranche</p>
          <div className="space-y-3">
            {tiers?.map((tier, index) => (
              <Card key={index} className={maxTier === index + 1 ? "bg-primary/5 border-primary" : ""}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Tranche {index + 1}</span>
                    <Badge variant="outline" className="text-xs">
                      {tier.min} à {tier.max === -1 ? '+' : tier.max} points
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Freebox Pop:</span>
                      <span className="font-medium">{tier.freebox_pop}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FB Essentiel:</span>
                      <span className="font-medium">{tier.freebox_essentiel}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Freebox Ultra:</span>
                      <span className="font-medium">{tier.freebox_ultra}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Forfait 5G:</span>
                      <span className="font-medium">{tier.forfait_5g}€</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tableau détaillé des ventes - Version desktop */}
        <div className="hidden md:block overflow-x-auto">
          <p className="text-sm font-medium mb-2">Détail des ventes et commissions du mois</p>
          {commissions && commissions.length > 0 ? (
            <Table>
              <TableCaption>
                Les ventes sont triées par date de réalisation
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  {isAdminView && <TableHead>Vendeur</TableHead>}
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">Cumul points</TableHead>
                  <TableHead className="text-center">Tranche</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-sm">{formatDate(sale.date)}</TableCell>
                    <TableCell className="font-medium">{sale.clientName}</TableCell>
                    {isAdminView && <TableCell className="text-sm">{sale.vendeurCode}</TableCell>}
                    <TableCell>{getProductName(sale.productType)}</TableCell>
                    <TableCell className="text-center">{sale.points}</TableCell>
                    <TableCell className="text-center">{sale.cumulativePoints}</TableCell>
                    <TableCell className="text-center">
                      {getCommissionTierBadge(sale.tier)}
                    </TableCell>
                    <TableCell className="text-right">{sale.commission}€</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-md">
              <p className="text-muted-foreground">
                Aucune vente enregistrée pour ce mois-ci.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Les commissions sont calculées lorsque les clients passent au statut "Installation".
              </p>
            </div>
          )}
        </div>
        
        {/* Version mobile optimisée du détail des ventes */}
        <div className="md:hidden">
          <p className="text-sm font-medium mb-2">Détail des ventes et commissions du mois</p>
          {commissions && commissions.length > 0 ? (
            <div className="space-y-3">
              {commissions.map((sale) => (
                <Card key={sale.id} className="border border-muted overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-sm">{sale.clientName}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(sale.date)}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="font-bold text-primary">{sale.commission}€</div>
                        <div className="text-xs">{sale.points} pts</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Produit:</span>
                        <span>{getProductName(sale.productType)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Points cumulés:</span>
                        <span>{sale.cumulativePoints}</span>
                      </div>
                      <div className="flex justify-between col-span-2 mt-1">
                        <span className="text-muted-foreground">Tranche:</span>
                        <span>{getCommissionTierBadge(sale.tier)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-md">
              <p className="text-muted-foreground">
                Aucune vente enregistrée pour ce mois-ci.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Les commissions sont calculées lorsque les clients passent au statut "Installation".
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}