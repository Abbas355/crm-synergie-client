import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Euro, TrendingUp, Calendar, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function SimpleCommissionsView() {
  const { data: commissions, isLoading } = useQuery({
    queryKey: ["mlm-commissions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/commissions");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!commissions || commissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Aucune commission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aucune commission n'a été générée pour le moment. Les commissions sont calculées automatiquement 
            à partir des ventes de vos clients avec forfait.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalCommissions = commissions.reduce((sum: number, comm: any) => sum + (comm.montant || 0), 0);
  const commissionsValidees = commissions.filter((c: any) => c.validee).length;
  const commissionsPayees = commissions.filter((c: any) => c.payee).length;

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commissions</p>
                <p className="text-2xl font-bold">{totalCommissions.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold">{commissionsValidees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payées</p>
                <p className="text-2xl font-bold">{commissionsPayees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Détail des commissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission: any, index: number) => (
                <TableRow key={commission.id || index}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{commission.client_prenom} {commission.client_nom}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{commission.produit_type}</Badge>
                  </TableCell>
                  <TableCell>{commission.taux_commission}%</TableCell>
                  <TableCell className="font-medium">{commission.montant.toFixed(2)} €</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={commission.validee ? "default" : "secondary"}>
                        {commission.validee ? "Validée" : "En attente"}
                      </Badge>
                      {commission.payee && (
                        <Badge variant="outline" className="text-green-600">
                          Payée
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(commission.date_creation).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}