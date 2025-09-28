import { Loader2, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Commission {
  id: number;
  date_creation: string;
  client_nom: string;
  client_prenom: string;
  produit_type: string;
  niveau: number;
  taux_commission: number;
  montant: number;
  validee: boolean;
  payee: boolean;
  date_paiement?: string;
  vendeur_id?: number;
  vendeur_nom?: string;
  vendeur_prenom?: string;
}

interface CommissionsViewProps {
  commissions: Commission[] | null;
  isLoading: boolean;
  rules: any[] | null;
  isLoadingRules: boolean;
  distributeurId: number;
}

export function CommissionsView({ commissions, isLoading, rules, isLoadingRules, distributeurId }: CommissionsViewProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!commissions || commissions.length === 0) {
    return (
      <div className="space-y-6">
        <Alert className="bg-muted">
          <AlertTitle>Aucune commission</AlertTitle>
          <AlertDescription>
            Vous n'avez pas encore de commissions enregistrées. 
            Les commissions sont générées automatiquement lorsque des ventes sont réalisées par vous ou votre réseau.
          </AlertDescription>
        </Alert>
        
        <div className="bg-accent/10 p-4 rounded-md">
          <h3 className="font-medium mb-3">Comment gagner des commissions ?</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="mr-2 mt-0.5">1️⃣</div>
              <div className="text-sm">
                <span className="font-medium">Ventes directes</span> - Commissions sur vos propres ventes
              </div>
            </li>
            <li className="flex items-start">
              <div className="mr-2 mt-0.5">2️⃣</div>
              <div className="text-sm">
                <span className="font-medium">Réseau</span> - Commissions sur les ventes réalisées par les vendeurs que vous avez recrutés
              </div>
            </li>
            <li className="flex items-start">
              <div className="mr-2 mt-0.5">3️⃣</div>
              <div className="text-sm">
                <span className="font-medium">Profondeur</span> - Commissions sur plusieurs niveaux en fonction de votre niveau MLM
              </div>
            </li>
          </ul>
          
          <div className="mt-4 p-3 border border-dashed border-border rounded-md">
            <p className="text-sm font-medium mb-2">Taux de commission actuels :</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {isLoadingRules ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                rules?.slice(0, 4).map((rule: any) => (
                  <div key={rule.id} className="flex justify-between">
                    <span>Niveau {rule.niveau}</span>
                    <span className="font-medium">{rule.tauxCommission}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculs des statistiques
  const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.montant), 0);
  const pendingCommissions = commissions.filter(c => !c.validee && !c.payee)
    .reduce((sum, c) => sum + Number(c.montant), 0);
  const validatedCommissions = commissions.filter(c => c.validee && !c.payee)
    .reduce((sum, c) => sum + Number(c.montant), 0);
  const paidCommissions = commissions.filter(c => c.payee)
    .reduce((sum, c) => sum + Number(c.montant), 0);
    
  // Commissions par produit
  const commissionsByProduct = commissions.reduce((acc: Record<string, number>, commission) => {
    const produit = commission.produit_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    acc[produit] = (acc[produit] || 0) + Number(commission.montant);
    return acc;
  }, {});
  
  // Commissions directes vs réseau
  const directCommissions = commissions.filter(c => c.niveau === 1)
    .reduce((sum, c) => sum + Number(c.montant), 0);
  const networkCommissions = commissions.filter(c => c.niveau > 1)
    .reduce((sum, c) => sum + Number(c.montant), 0);
  
  // Commissions ce mois-ci
  const today = new Date();
  const thisMonth = commissions.filter(c => {
    const date = new Date(c.date_creation);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }).reduce((sum, c) => sum + Number(c.montant), 0);
  
  // Commissions mois dernier
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
  const lastMonthCommissions = commissions.filter(c => {
    const date = new Date(c.date_creation);
    return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
  }).reduce((sum, c) => sum + Number(c.montant), 0);
  
  // Calculer le pourcentage d'évolution
  const percentChange = lastMonthCommissions > 0 
    ? ((thisMonth - lastMonthCommissions) / lastMonthCommissions) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* En-tête récapitulatif */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="text-sm text-muted-foreground mb-1">Commissions en attente</div>
          <div className="text-xl font-bold">{Number(pendingCommissions).toFixed(2)} €</div>
        </div>
        
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="text-sm text-muted-foreground mb-1">Commissions validées</div>
          <div className="text-xl font-bold">{Number(validatedCommissions).toFixed(2)} €</div>
        </div>
        
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="text-sm text-muted-foreground mb-1">Commissions payées</div>
          <div className="text-xl font-bold">{Number(paidCommissions).toFixed(2)} €</div>
        </div>
      </div>

      {/* Graphiques et statistiques */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Répartition par produit */}
        <div className="border border-border rounded-md p-4">
          <h3 className="text-sm font-medium mb-3">Répartition par produit</h3>
          <div className="space-y-3">
            {Object.entries(commissionsByProduct).map(([produit, montant], index) => {
              const colors = ['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
              const percentage = Math.round((montant / totalCommissions) * 100);
              return (
                <div key={produit} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{produit}</span>
                    <span>{percentage}% ({Number(montant).toFixed(2)} €)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`${colors[index % colors.length]} h-2 rounded-full`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparaison direct vs réseau */}
        <div className="border border-border rounded-md p-4">
          <h3 className="text-sm font-medium mb-3">Origine des commissions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-3 rounded-md text-center">
              <div className="text-sm text-muted-foreground mb-2">Ventes directes</div>
              <div className="text-lg font-bold mb-1">{Number(directCommissions).toFixed(2)} €</div>
              <div className="text-xs text-muted-foreground">
                {commissions.filter(c => c.niveau === 1).length} commissions
              </div>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-md text-center">
              <div className="text-sm text-muted-foreground mb-2">Réseau</div>
              <div className="text-lg font-bold mb-1">{Number(networkCommissions).toFixed(2)} €</div>
              <div className="text-xs text-muted-foreground">
                {commissions.filter(c => c.niveau > 1).length} commissions
              </div>
            </div>
          </div>

          {/* Tendance mensuelle */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-3">Évolution mensuelle</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Ce mois-ci</div>
                <div className="text-lg font-bold">{Number(thisMonth).toFixed(2)} €</div>
              </div>
              {lastMonthCommissions > 0 && (
                <div className="flex items-center">
                  <TrendingUp className={`h-4 w-4 mr-1 ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {percentChange >= 0 ? '+' : ''}{Math.round(percentChange)}%
                  </span>
                </div>
              )}
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Mois dernier</div>
                <div className="text-lg font-bold">{Number(lastMonthCommissions).toFixed(2)} €</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des commissions */}
      <div>
        <h3 className="text-sm font-medium mb-3">Détail des commissions ({commissions.length})</h3>
        
        {/* Filtres et synthèse */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 bg-muted p-4 rounded-md mb-4">
          <div className="space-y-2">
            <h4 className="text-xs font-medium">Synthèse par statut</h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <span>En attente: {commissions.filter(c => !c.validee && !c.payee).length}</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                <span>Validées: {commissions.filter(c => c.validee && !c.payee).length}</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span>Payées: {commissions.filter(c => c.payee).length}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Version desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-4 text-sm font-medium">Date</th>
                <th className="text-left py-2 px-4 text-sm font-medium">Client</th>
                <th className="text-left py-2 px-4 text-sm font-medium">Produit</th>
                <th className="text-left py-2 px-4 text-sm font-medium">Niveau</th>
                <th className="text-left py-2 px-4 text-sm font-medium">Taux</th>
                <th className="text-right py-2 px-4 text-sm font-medium">Montant</th>
                <th className="text-left py-2 px-4 text-sm font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.id} className="border-b border-border hover:bg-accent/10">
                  <td className="py-2 px-4 text-sm">
                    {new Date(commission.date_creation).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 text-sm">
                    {commission.client_nom} {commission.client_prenom}
                  </td>
                  <td className="py-2 px-4 text-sm">
                    {commission.produit_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </td>
                  <td className="py-2 px-4 text-sm">
                    {commission.niveau || 1}
                  </td>
                  <td className="py-2 px-4 text-sm">
                    {commission.taux_commission}%
                  </td>
                  <td className="py-2 px-4 text-sm text-right font-medium">
                    {Number(commission.montant).toFixed(2)} €
                  </td>
                  <td className="py-2 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      commission.payee 
                        ? 'bg-green-100 text-green-800' 
                        : commission.validee 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {commission.payee 
                        ? 'Payée' 
                        : commission.validee 
                          ? 'Validée' 
                          : 'En attente'
                      }
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
            {commissions.map((commission) => (
              <div key={commission.id} className="border rounded-md p-3">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {Number(commission.montant).toFixed(2)} €
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {commission.produit_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs self-start ${
                    commission.payee 
                      ? 'bg-green-100 text-green-800' 
                      : commission.validee 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {commission.payee 
                      ? 'Payée' 
                      : commission.validee 
                        ? 'Validée' 
                        : 'En attente'
                    }
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <div>Client: {commission.client_nom} {commission.client_prenom}</div>
                  <div>Niveau: {commission.niveau || 1}</div>
                  <div>Date: {new Date(commission.date_creation).toLocaleDateString()}</div>
                  <div>Taux: {commission.taux_commission}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}