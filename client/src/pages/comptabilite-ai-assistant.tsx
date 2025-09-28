import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Brain, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Shield,
  Sparkles,
  Calculator,
  ArrowRight,
  History,
  Info,
  Lightbulb,
  BookOpen,
  AlertTriangle,
  ChevronRight
} from "lucide-react";

interface EcritureGeneree {
  numeroCompte: string;
  libelle: string;
  debit: number;
  credit: number;
  nomCompte?: string;
}

interface ResultatAnalyse {
  compteDebit: string;
  compteCredit: string;
  journal: string;
  ecritures: EcritureGeneree[];
  suggestions?: string[];
  alertes?: string[];
}

export default function ComptabiliteAIAssistant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [typePiece, setTypePiece] = useState("FACTURE_ACHAT");
  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [montantHT, setMontantHT] = useState("");
  const [tauxTVA, setTauxTVA] = useState("20");
  const [dateOperation, setDateOperation] = useState(new Date().toISOString().split('T')[0]);
  const [numeroPiece, setNumeroPiece] = useState("");
  
  const [resultatAnalyse, setResultatAnalyse] = useState<ResultatAnalyse | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  // Types de pièces comptables
  const typesPieces = [
    { value: "FACTURE_ACHAT", label: "Facture d'achat", icon: "📥" },
    { value: "FACTURE_VENTE", label: "Facture de vente", icon: "📤" },
    { value: "NOTE_FRAIS", label: "Note de frais", icon: "🧾" },
    { value: "RELEVE_BANCAIRE", label: "Relevé bancaire", icon: "🏦" },
    { value: "TICKET_CAISSE", label: "Ticket de caisse", icon: "🛒" },
    { value: "BULLETIN_SALAIRE", label: "Bulletin de salaire", icon: "💰" },
    { value: "DECLARATION_TVA", label: "Déclaration TVA", icon: "📊" },
    { value: "AVOIR_FOURNISSEUR", label: "Avoir fournisseur", icon: "↩️" },
    { value: "AVOIR_CLIENT", label: "Avoir client", icon: "↪️" },
    { value: "AMORTISSEMENT", label: "Amortissement", icon: "📉" },
    { value: "PROVISION", label: "Provision", icon: "🔒" },
    { value: "OPERATION_DIVERSE", label: "Opération diverse", icon: "📝" }
  ];

  // Analyse intelligente de la pièce
  const analyserPieceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/comptabilite/ai/analyser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erreur analyse');
      return response.json();
    },
    onSuccess: (data) => {
      setResultatAnalyse(data);
      toast({
        title: "✅ Analyse terminée",
        description: "Les écritures ont été générées automatiquement"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'analyser la pièce",
        variant: "destructive"
      });
    }
  });

  // Validation et génération des écritures
  const genererEcrituresMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/comptabilite/ai/generer-ecritures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erreur génération');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Écritures enregistrées",
        description: "Les écritures comptables ont été créées avec succès",
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/comptabilite/ecritures'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer les écritures",
        variant: "destructive"
      });
    }
  });

  // Récupération des suggestions basées sur l'historique
  const { data: suggestions } = useQuery({
    queryKey: ['/api/comptabilite/ai/suggestions', typePiece, libelle],
    enabled: libelle.length > 3
  });

  const analyserPiece = () => {
    setIsAnalysing(true);
    
    // Calcul automatique TVA et TTC
    const montantHTNum = parseFloat(montantHT) || 0;
    const tauxTVANum = parseFloat(tauxTVA) || 20;
    const montantTVACalc = montantHTNum * (tauxTVANum / 100);
    const montantTTCCalc = montantHTNum + montantTVACalc;

    analyserPieceMutation.mutate({
      typePiece,
      libelle,
      description,
      montantHT: montantHTNum,
      montantTVA: montantTVACalc,
      montantTTC: montantTTCCalc,
      tauxTVA: tauxTVANum,
      dateOperation,
      numeroPiece: numeroPiece || `AUTO-${Date.now()}`
    });
    
    setIsAnalysing(false);
  };

  const validerEtGenerer = () => {
    if (!resultatAnalyse) return;
    
    const montantHTNum = parseFloat(montantHT) || 0;
    const tauxTVANum = parseFloat(tauxTVA) || 20;
    const montantTVACalc = montantHTNum * (tauxTVANum / 100);
    const montantTTCCalc = montantHTNum + montantTVACalc;

    genererEcrituresMutation.mutate({
      typePiece,
      libelle,
      description,
      montantHT: montantHTNum,
      montantTVA: montantTVACalc,
      montantTTC: montantTTCCalc,
      tauxTVA: tauxTVANum,
      dateOperation,
      numeroPiece: numeroPiece || `AUTO-${Date.now()}`,
      ...resultatAnalyse
    });
  };

  const resetForm = () => {
    setLibelle("");
    setDescription("");
    setMontantHT("");
    setNumeroPiece("");
    setResultatAnalyse(null);
  };

  // Calcul automatique des montants
  const montantHTNum = parseFloat(montantHT) || 0;
  const tauxTVANum = parseFloat(tauxTVA) || 20;
  const montantTVACalc = montantHTNum * (tauxTVANum / 100);
  const montantTTCCalc = montantHTNum + montantTVACalc;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* En-tête avec alertes de sécurité */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <Brain className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-bold">Assistant Comptable Intelligent</h1>
              <p className="text-blue-100 mt-1">Génération automatique d'écritures conformes au PCG</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-300" />
              <div>
                <p className="text-sm font-semibold">100% Conforme</p>
                <p className="text-xs text-blue-100">Normes françaises</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-yellow-300" />
              <div>
                <p className="text-sm font-semibold">IA Avancée</p>
                <p className="text-xs text-blue-100">Analyse sémantique</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-orange-300" />
              <div>
                <p className="text-sm font-semibold">Zéro Erreur</p>
                <p className="text-xs text-blue-100">Protection pénalités</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerte importante */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-800">Protection Anti-Pénalités Active</AlertTitle>
          <AlertDescription className="text-orange-700">
            L'assistant vérifie automatiquement la conformité de chaque écriture avec les normes comptables
            et fiscales françaises pour éviter tout risque de sanction.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Formulaire de saisie */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nouvelle Pièce Comptable
              </CardTitle>
              <CardDescription>
                Décrivez simplement votre document, l'IA s'occupe du reste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              
              {/* Type de pièce */}
              <div className="space-y-2">
                <Label>Type de document</Label>
                <Select value={typePiece} onValueChange={setTypePiece}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typesPieces.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Libellé avec suggestions */}
              <div className="space-y-2">
                <Label>Description de l'opération*</Label>
                <Input
                  placeholder="Ex: Achat fournitures bureau, Location bureaux janvier..."
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                />
                {suggestions && suggestions.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-2 space-y-1">
                    <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Suggestions basées sur votre historique:
                    </p>
                    {suggestions.slice(0, 3).map((sugg: any, idx: number) => (
                      <div 
                        key={idx}
                        className="text-xs text-blue-600 hover:bg-blue-100 rounded px-2 py-1 cursor-pointer"
                        onClick={() => setLibelle(sugg.libelle)}
                      >
                        → {sugg.libelle}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description détaillée */}
              <div className="space-y-2">
                <Label>Détails supplémentaires (optionnel)</Label>
                <Textarea
                  placeholder="Ajoutez des précisions pour une meilleure analyse..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Montants et TVA */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Montant HT (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={montantHT}
                    onChange={(e) => setMontantHT(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taux TVA (%)</Label>
                  <Select value={tauxTVA} onValueChange={setTauxTVA}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20% (Normal)</SelectItem>
                      <SelectItem value="10">10% (Réduit)</SelectItem>
                      <SelectItem value="5.5">5.5% (Réduit)</SelectItem>
                      <SelectItem value="2.1">2.1% (Super réduit)</SelectItem>
                      <SelectItem value="0">0% (Exonéré)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Calcul automatique affiché */}
              {montantHTNum > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Montant HT:</span>
                    <span className="font-semibold">{montantHTNum.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA ({tauxTVA}%):</span>
                    <span className="font-semibold">{montantTVACalc.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Montant TTC:</span>
                    <span className="text-blue-600">{montantTTCCalc.toFixed(2)} €</span>
                  </div>
                </div>
              )}

              {/* Date et numéro */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date opération</Label>
                  <Input
                    type="date"
                    value={dateOperation}
                    onChange={(e) => setDateOperation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>N° Pièce</Label>
                  <Input
                    placeholder="Auto-généré"
                    value={numeroPiece}
                    onChange={(e) => setNumeroPiece(e.target.value)}
                  />
                </div>
              </div>

              {/* Bouton d'analyse */}
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={analyserPiece}
                disabled={!libelle || !montantHT || isAnalysing}
              >
                {isAnalysing ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyser et Générer les Écritures
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Résultat de l'analyse */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Écritures Générées
              </CardTitle>
              <CardDescription>
                Vérifiez et validez les écritures avant enregistrement
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {resultatAnalyse ? (
                <div className="space-y-4">
                  
                  {/* Journal et comptes principaux */}
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">Journal: {resultatAnalyse.journal}</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Compte débit:</span>
                        <Badge variant="outline">{resultatAnalyse.compteDebit}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Compte crédit:</span>
                        <Badge variant="outline">{resultatAnalyse.compteCredit}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Tableau des écritures */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Compte</th>
                          <th className="px-3 py-2 text-left">Libellé</th>
                          <th className="px-3 py-2 text-right">Débit</th>
                          <th className="px-3 py-2 text-right">Crédit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {resultatAnalyse.ecritures?.map((ecriture, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-mono text-xs">{ecriture.numeroCompte}</td>
                            <td className="px-3 py-2 text-xs">{ecriture.libelle}</td>
                            <td className="px-3 py-2 text-right text-green-600">
                              {ecriture.debit > 0 ? `${ecriture.debit.toFixed(2)} €` : '-'}
                            </td>
                            <td className="px-3 py-2 text-right text-red-600">
                              {ecriture.credit > 0 ? `${ecriture.credit.toFixed(2)} €` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 font-semibold">
                        <tr>
                          <td colSpan={2} className="px-3 py-2">Total</td>
                          <td className="px-3 py-2 text-right text-green-600">
                            {resultatAnalyse.ecritures?.reduce((sum, e) => sum + e.debit, 0).toFixed(2)} €
                          </td>
                          <td className="px-3 py-2 text-right text-red-600">
                            {resultatAnalyse.ecritures?.reduce((sum, e) => sum + e.credit, 0).toFixed(2)} €
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Alertes et suggestions */}
                  {resultatAnalyse.alertes && resultatAnalyse.alertes.length > 0 && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-800">Points d'attention</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 text-sm text-orange-700 mt-2">
                          {resultatAnalyse.alertes.map((alerte, idx) => (
                            <li key={idx}>{alerte}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Boutons d'action */}
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                      onClick={validerEtGenerer}
                      disabled={genererEcrituresMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Valider et Enregistrer
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={resetForm}
                    >
                      Nouvelle Saisie
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-2">Aucune analyse en cours</p>
                  <p className="text-sm">Saisissez une pièce comptable pour commencer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Guide d'utilisation */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Comment ça marche ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-lg font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Décrivez</h4>
                  <p className="text-xs text-gray-600">Indiquez simplement de quoi il s'agit</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-lg font-bold text-purple-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Analysez</h4>
                  <p className="text-xs text-gray-600">L'IA identifie les comptes automatiquement</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-lg font-bold text-green-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Vérifiez</h4>
                  <p className="text-xs text-gray-600">Contrôlez les écritures proposées</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-lg font-bold text-orange-600">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Validez</h4>
                  <p className="text-xs text-gray-600">Enregistrez en toute sécurité</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}