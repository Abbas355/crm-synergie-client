import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  Link2,
  Unlink,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Download,
  Check,
  X,
  Eye,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MouvementBancaire {
  id: string;
  date: string;
  libelle: string;
  debit: number;
  credit: number;
  solde: number;
  rapproche: boolean;
  factureAssociee?: string;
}

interface FactureNonRapprochee {
  id: string;
  numero: string;
  date: string;
  tiers: string;
  montant: number;
  type: 'client' | 'fournisseur';
  statut: 'en_attente' | 'partiellement_payee' | 'payee';
}

export default function RapprochementBancaire() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedBank, setSelectedBank] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRapproches, setShowRapproches] = useState(false);
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const [selectedFacture, setSelectedFacture] = useState<string | null>(null);

  // Données simulées pour démonstration
  const mouvementsBancaires: MouvementBancaire[] = [
    {
      id: '1',
      date: '2025-08-15',
      libelle: 'VIREMENT FREE TELECOM',
      debit: 0,
      credit: 500.00,
      solde: 15670.89,
      rapproche: false
    },
    {
      id: '2',
      date: '2025-08-14',
      libelle: 'PRLV SEPA EDF',
      debit: 245.67,
      credit: 0,
      solde: 15170.89,
      rapproche: true,
      factureAssociee: 'FAC-2025-078'
    },
    {
      id: '3',
      date: '2025-08-13',
      libelle: 'CB CARREFOUR',
      debit: 156.32,
      credit: 0,
      solde: 15416.56,
      rapproche: false
    },
    {
      id: '4',
      date: '2025-08-12',
      libelle: 'VIREMENT CLIENT DUPONT',
      debit: 0,
      credit: 1200.00,
      solde: 15572.88,
      rapproche: true,
      factureAssociee: 'FAC-2025-076'
    },
    {
      id: '5',
      date: '2025-08-10',
      libelle: 'FRAIS BANCAIRES',
      debit: 12.50,
      credit: 0,
      solde: 14372.88,
      rapproche: false
    }
  ];

  const facturesNonRapprochees: FactureNonRapprochee[] = [
    {
      id: 'F1',
      numero: 'FAC-2025-080',
      date: '2025-08-16',
      tiers: 'FREE TELECOM',
      montant: 500.00,
      type: 'client',
      statut: 'en_attente'
    },
    {
      id: 'F2',
      numero: 'FAC-2025-079',
      date: '2025-08-14',
      tiers: 'CARREFOUR',
      montant: 156.32,
      type: 'fournisseur',
      statut: 'en_attente'
    },
    {
      id: 'F3',
      numero: 'FAC-2025-077',
      date: '2025-08-11',
      tiers: 'ORANGE',
      montant: 89.90,
      type: 'fournisseur',
      statut: 'en_attente'
    }
  ];

  // Filtrer les mouvements
  const filteredMovements = mouvementsBancaires.filter(m => {
    if (!showRapproches && m.rapproche) return false;
    if (searchTerm && !m.libelle.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Fonction de rapprochement automatique
  const handleRapprochementAuto = () => {
    toast({
      title: "Rapprochement automatique",
      description: "3 correspondances trouvées et rapprochées automatiquement",
    });
  };

  // Fonction de rapprochement manuel
  const handleRapprochementManuel = (mouvementId: string, factureId: string) => {
    toast({
      title: "Rapprochement effectué",
      description: "Le mouvement a été associé à la facture",
    });
    setSelectedMovements([]);
    setSelectedFacture(null);
  };

  // Fonction d'annulation de rapprochement
  const handleAnnulerRapprochement = (mouvementId: string) => {
    toast({
      title: "Rapprochement annulé",
      description: "L'association a été supprimée",
    });
  };

  return (
    <AppLayout title="Rapprochement Bancaire">
      <div className="space-y-6">
        {/* Header avec statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600">Solde bancaire</p>
                  <p className="text-xl font-bold text-blue-900">15 670,89 €</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600">Mouvements rapprochés</p>
                  <p className="text-xl font-bold text-green-900">12 / 18</p>
                </div>
                <Link2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600">En attente</p>
                  <p className="text-xl font-bold text-orange-900">6</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600">Écart comptable</p>
                  <p className="text-xl font-bold text-purple-900">-234,50 €</p>
                </div>
                <XCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Rapprochement Bancaire</CardTitle>
                <CardDescription>
                  Associez vos mouvements bancaires avec vos factures
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRapprochementAuto} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rapprochement auto
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="search">Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Rechercher un mouvement..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="month">Période</Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="bank">Banque</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger id="bank">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les banques</SelectItem>
                    <SelectItem value="bnp">BNP Paribas</SelectItem>
                    <SelectItem value="sg">Société Générale</SelectItem>
                    <SelectItem value="ca">Crédit Agricole</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showRapproches"
                    checked={showRapproches}
                    onCheckedChange={(checked) => setShowRapproches(checked as boolean)}
                  />
                  <Label htmlFor="showRapproches" className="text-sm">
                    Afficher rapprochés
                  </Label>
                </div>
              </div>
            </div>

            <Tabs defaultValue="mouvements" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mouvements">
                  Mouvements bancaires ({filteredMovements.length})
                </TabsTrigger>
                <TabsTrigger value="factures">
                  Factures en attente ({facturesNonRapprochees.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mouvements">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left text-xs font-medium text-gray-500">
                          <Checkbox />
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500">Libellé</th>
                        <th className="p-3 text-right text-xs font-medium text-gray-500">Débit</th>
                        <th className="p-3 text-right text-xs font-medium text-gray-500">Crédit</th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500">Statut</th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMovements.map((mouvement) => (
                        <tr key={mouvement.id} className="hover:bg-gray-50">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedMovements.includes(mouvement.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMovements([...selectedMovements, mouvement.id]);
                                } else {
                                  setSelectedMovements(selectedMovements.filter(id => id !== mouvement.id));
                                }
                              }}
                              disabled={mouvement.rapproche}
                            />
                          </td>
                          <td className="p-3 text-sm">
                            {format(new Date(mouvement.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="p-3 text-sm font-medium">{mouvement.libelle}</td>
                          <td className="p-3 text-sm text-right text-red-600">
                            {mouvement.debit > 0 ? `${mouvement.debit.toFixed(2)} €` : '-'}
                          </td>
                          <td className="p-3 text-sm text-right text-green-600">
                            {mouvement.credit > 0 ? `${mouvement.credit.toFixed(2)} €` : '-'}
                          </td>
                          <td className="p-3 text-center">
                            {mouvement.rapproche ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Rapproché
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                En attente
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-1">
                              {mouvement.rapproche ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      toast({
                                        title: "Facture associée",
                                        description: `Facture ${mouvement.factureAssociee}`,
                                      });
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleAnnulerRapprochement(mouvement.id)}
                                  >
                                    <Unlink className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (selectedFacture) {
                                      handleRapprochementManuel(mouvement.id, selectedFacture);
                                    } else {
                                      toast({
                                        title: "Sélectionnez une facture",
                                        description: "Veuillez d'abord sélectionner une facture dans l'onglet 'Factures en attente'",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  <Link2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="factures">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left text-xs font-medium text-gray-500">
                          Sélection
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500">N° Facture</th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500">Tiers</th>
                        <th className="p-3 text-right text-xs font-medium text-gray-500">Montant</th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500">Type</th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {facturesNonRapprochees.map((facture) => (
                        <tr 
                          key={facture.id} 
                          className={`hover:bg-gray-50 cursor-pointer ${selectedFacture === facture.id ? 'bg-blue-50' : ''}`}
                          onClick={() => setSelectedFacture(facture.id)}
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={selectedFacture === facture.id}
                              onCheckedChange={(checked) => {
                                setSelectedFacture(checked ? facture.id : null);
                              }}
                            />
                          </td>
                          <td className="p-3 text-sm font-medium">{facture.numero}</td>
                          <td className="p-3 text-sm">
                            {format(new Date(facture.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="p-3 text-sm">{facture.tiers}</td>
                          <td className="p-3 text-sm text-right font-medium">
                            {facture.montant.toFixed(2)} €
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={facture.type === 'client' ? 'default' : 'secondary'}>
                              {facture.type === 'client' ? 'Client' : 'Fournisseur'}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="text-orange-600">
                              En attente
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedMovements.length > 0 && selectedFacture && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Rapprochement prêt
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {selectedMovements.length} mouvement(s) sélectionné(s) - 1 facture sélectionnée
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          selectedMovements.forEach(mouvementId => {
                            handleRapprochementManuel(mouvementId, selectedFacture);
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Confirmer le rapprochement
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}