import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Edit3, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SimCardSelect } from "./sim-card-select";

interface Client {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  civilite: string;
  dateNaissance: string | null;
  adresse: string;
  codePostal: string | null;
  ville: string;
  produit: string;
  identifiantContrat: string | null;
  carteSim: string | null;
  portabilite: string;
  numeroPorter: string | null;
  source: string;
  commentaire: string | null;
  status: string;
  codeVendeur: string;
  userid: number;
}

interface ClientMissingFieldsProps {
  client: Client;
  onUpdate?: () => void;
}

export function ClientMissingFields({ client, onUpdate }: ClientMissingFieldsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    dateNaissance: client.dateNaissance || "",
    codePostal: client.codePostal || "",
    identifiantContrat: client.identifiantContrat || "",
    carteSim: client.carteSim || "",
    telephone: client.telephone || "",
    numeroPorter: client.numeroPorter || ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/clients/${client.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Les informations client ont été mises à jour avec succès",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", client.id] });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const generateContractId = () => {
    const isFreebox = client.produit?.toLowerCase?.().includes("freebox") || false;
    const prefix = isFreebox ? "FO" : "";
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
    const contractId = prefix + randomNumber.toString();
    
    setFormData(prev => ({
      ...prev,
      identifiantContrat: contractId
    }));
  };

  const handleSimCardChange = (simNumber: string) => {
    setFormData(prev => ({
      ...prev,
      carteSim: simNumber
    }));
  };

  // Détecter les champs manquants
  const missingFields = [];
  if (!client.dateNaissance) missingFields.push("Date de naissance");
  if (!client.codePostal) missingFields.push("Code postal");
  if (!client.identifiantContrat) missingFields.push("Identifiant contrat");
  if (!client.telephone) missingFields.push("Téléphone");
  if (client.produit?.toLowerCase?.().includes("5g") && !client.carteSim) missingFields.push("Carte SIM");

  if (missingFields.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <Check className="h-5 w-5" />
            <span className="font-medium">Toutes les informations sont complètes</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertCircle className="h-5 w-5" />
          Informations manquantes
        </CardTitle>
        <CardDescription>
          Ce client a {missingFields.length} champ(s) manquant(s) qui doivent être complétés
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badge des champs manquants */}
        <div className="flex flex-wrap gap-2">
          {missingFields.map((field) => (
            <Badge key={field} variant="destructive" className="text-xs">
              {field}
            </Badge>
          ))}
        </div>

        {/* Bouton d'édition */}
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Compléter les informations
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date de naissance */}
              {!client.dateNaissance && (
                <div className="space-y-2">
                  <Label htmlFor="dateNaissance">Date de naissance *</Label>
                  <Input
                    id="dateNaissance"
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={formData.dateNaissance}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateNaissance: e.target.value }))}
                    className="h-10"
                  />
                </div>
              )}

              {/* Code postal */}
              {!client.codePostal && (
                <div className="space-y-2">
                  <Label htmlFor="codePostal">Code postal *</Label>
                  <Input
                    id="codePostal"
                    type="text"
                    placeholder="75000"
                    value={formData.codePostal}
                    onChange={(e) => setFormData(prev => ({ ...prev, codePostal: e.target.value }))}
                    className="h-10"
                  />
                </div>
              )}

              {/* Téléphone */}
              {!client.telephone && (
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone *</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="0123456789"
                    value={formData.telephone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                    className="h-10"
                  />
                </div>
              )}

              {/* Identifiant contrat */}
              {!client.identifiantContrat && (
                <div className="space-y-2">
                  <Label htmlFor="identifiantContrat">Identifiant contrat *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="identifiantContrat"
                      type="text"
                      placeholder={client.produit.toLowerCase().includes("freebox") ? "FO12345678" : "12345678"}
                      value={formData.identifiantContrat}
                      onChange={(e) => setFormData(prev => ({ ...prev, identifiantContrat: e.target.value }))}
                      className="h-10"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={generateContractId}
                      className="h-10"
                    >
                      Générer
                    </Button>
                  </div>
                </div>
              )}

              {/* Carte SIM pour produits 5G */}
              {client.produit.toLowerCase().includes("5g") && !client.carteSim && (
                <div className="col-span-2">
                  <SimCardSelect
                    value={formData.carteSim}
                    onChange={handleSimCardChange}
                    clientId={client.id}
                  />
                </div>
              )}

              {/* Numéro à porter */}
              {client.portabilite === "oui" && !client.numeroPorter && (
                <div className="space-y-2">
                  <Label htmlFor="numeroPorter">Numéro à porter</Label>
                  <Input
                    id="numeroPorter"
                    type="tel"
                    placeholder="0123456789"
                    value={formData.numeroPorter}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroPorter: e.target.value }))}
                    className="h-10"
                  />
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}