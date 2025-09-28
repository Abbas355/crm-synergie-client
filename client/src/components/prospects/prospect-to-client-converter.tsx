import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProspectToClientConverterProps {
  prospectData: {
    id: number;
    prenom: string;
    nom: string;
    email?: string;
    telephone: string;
    ville?: string;
    codePostal?: string;
    adresse?: string;
    source?: string;
    potentielEstime?: string;
    economyData?: {
      details: string;
      freeCost: number;
      products: string[];
      currentCost: number;
      annualSavings: number;
      monthlySavings: number;
      simulationSummary?: string;
    };
  };
  onConvert: (clientData: any) => void;
  onCancel: () => void;
}

export function ProspectToClientConverter({ prospectData, onConvert, onCancel }: ProspectToClientConverterProps) {
  const { toast } = useToast();
  
  const [clientData, setClientData] = useState({
    // Données pré-remplies depuis le prospect
    prenom: prospectData.prenom || '',
    nom: prospectData.nom || '',
    email: prospectData.email || '',
    telephone: prospectData.telephone || '',
    ville: prospectData.ville || '',
    codePostal: prospectData.codePostal || '',
    adresse: prospectData.adresse || '',
    
    // Nouvelles données client
    dateNaissance: '',
    typeDocument: '',
    numeroDocument: '',
    operateurActuel: '',
    numeroPortabilite: '',
    
    // Offre Free sélectionnée (basée sur la simulation)
    offreFreebox: 'freebox_pop',
    forfaitMobile: 'forfait_5g_50go',
    optionsComplementaires: [] as string[],
    
    // Données économiques héritées
    simulationEconomique: prospectData.economyData?.simulationSummary || '',
    economiesMensuelles: prospectData.economyData?.monthlySavings || 0,
    economiesAnnuelles: prospectData.economyData?.annualSavings || 0,
    
    // Statut et suivi
    statut: 'signature',
    commentaire: `Prospect converti en client le ${new Date().toLocaleDateString('fr-FR')}. Source: ${prospectData.source || 'Non renseigné'}. Potentiel estimé: ${prospectData.potentielEstime || 'Non évalué'}.`
  });

  const handleChange = (field: string, value: string | string[]) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!clientData.prenom && !clientData.nom) {
      toast({
        title: "Erreur de validation",
        description: "Au moins le prénom ou le nom est requis",
        variant: "destructive"
      });
      return;
    }
    
    if (!clientData.telephone) {
      toast({
        title: "Erreur de validation", 
        description: "Le téléphone est obligatoire",
        variant: "destructive"
      });
      return;
    }

    // Créer le client final
    const finalClientData = {
      ...clientData,
      type: 'client',
      source: `Conversion prospect #${prospectData.id}`,
      prospectOrigineId: prospectData.id,
      dateConversion: new Date().toISOString(),
    };

    console.log("🔄 CONVERSION PROSPECT → CLIENT:", finalClientData);
    onConvert(finalClientData);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6" />
          <div>
            <h2 className="text-lg font-bold">Conversion Prospect → Client</h2>
            <p className="text-sm opacity-90">{prospectData.prenom} {prospectData.nom}</p>
          </div>
          <ArrowRight className="h-5 w-5 ml-auto" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Informations personnelles pré-remplies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-green-700">📋 Informations personnelles (pré-remplies)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom *</Label>
                <Input
                  value={clientData.prenom}
                  onChange={(e) => handleChange('prenom', e.target.value)}
                  className="bg-green-50 border-green-200"
                />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input
                  value={clientData.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  className="bg-green-50 border-green-200"
                />
              </div>
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                value={clientData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="bg-green-50 border-green-200"
              />
            </div>
            
            <div>
              <Label>Téléphone *</Label>
              <Input
                value={clientData.telephone}
                onChange={(e) => handleChange('telephone', e.target.value)}
                className="bg-green-50 border-green-200"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code postal</Label>
                <Input
                  value={clientData.codePostal}
                  onChange={(e) => handleChange('codePostal', e.target.value)}
                  className="bg-green-50 border-green-200"
                />
              </div>
              <div>
                <Label>Ville</Label>
                <Input
                  value={clientData.ville}
                  onChange={(e) => handleChange('ville', e.target.value)}
                  className="bg-green-50 border-green-200"
                />
              </div>
            </div>
            
            <div>
              <Label>Adresse complète</Label>
              <Input
                value={clientData.adresse}
                onChange={(e) => handleChange('adresse', e.target.value)}
                className="bg-green-50 border-green-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Informations complémentaires client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-blue-700">🆔 Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={clientData.dateNaissance}
                onChange={(e) => handleChange('dateNaissance', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de document</Label>
                <Select value={clientData.typeDocument} onValueChange={(value) => handleChange('typeDocument', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cni">Carte nationale d'identité</SelectItem>
                    <SelectItem value="passeport">Passeport</SelectItem>
                    <SelectItem value="permis">Permis de conduire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Numéro de document</Label>
                <Input
                  value={clientData.numeroDocument}
                  onChange={(e) => handleChange('numeroDocument', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simulation économique héritée */}
        {prospectData.economyData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-purple-700">💰 Simulation économique (héritée)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Économies mensuelles</p>
                    <p className="text-lg font-bold text-green-600">+{prospectData.economyData.monthlySavings?.toFixed(2) || 0}€</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Économies annuelles</p>
                    <p className="text-lg font-bold text-green-600">+{prospectData.economyData.annualSavings?.toFixed(0) || 0}€</p>
                  </div>
                </div>
                {prospectData.economyData.simulationSummary && (
                  <details className="text-xs bg-white p-2 rounded border">
                    <summary className="cursor-pointer font-medium">Détails de la simulation</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">{prospectData.economyData.simulationSummary}</pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Convertir en client
          </Button>
        </div>
      </form>
    </div>
  );
}