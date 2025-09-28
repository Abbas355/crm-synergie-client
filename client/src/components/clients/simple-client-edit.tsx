import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface SimpleClientEditProps {
  client: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SimpleClientEdit({ client, onSave, onCancel, isSubmitting = false }: SimpleClientEditProps) {
  const [formData, setFormData] = useState({
    civilite: client.civilite || "",
    prenom: client.prenom || "",
    nom: client.nom || "",
    email: client.email || "",
    telephone: client.telephone || "",
    adresse: client.adresse || "",
    codePostal: client.codePostal || "",
    ville: client.ville || "",
    produit: client.produit || "",
    status: client.status || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    console.log("🔥 Sauvegarde simple client:", formData);
    onSave(formData);
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Modifier le client</h3>
      
      {/* Civilité */}
      <div className="space-y-2">
        <Label>Civilité</Label>
        <Select value={formData.civilite} onValueChange={(value) => handleInputChange("civilite", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M.">M.</SelectItem>
            <SelectItem value="Mme">Mme</SelectItem>
            <SelectItem value="Mlle">Mlle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prénom */}
      <div className="space-y-2">
        <Label>Prénom</Label>
        <Input
          value={formData.prenom}
          onChange={(e) => handleInputChange("prenom", e.target.value)}
          placeholder="Prénom"
        />
      </div>

      {/* Nom */}
      <div className="space-y-2">
        <Label>Nom</Label>
        <Input
          value={formData.nom}
          onChange={(e) => handleInputChange("nom", e.target.value)}
          placeholder="Nom"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          placeholder="email@exemple.com"
        />
      </div>

      {/* Téléphone */}
      <div className="space-y-2">
        <Label>Téléphone</Label>
        <Input
          value={formData.telephone}
          onChange={(e) => handleInputChange("telephone", e.target.value)}
          placeholder="Téléphone"
        />
      </div>

      {/* Adresse */}
      <div className="space-y-2">
        <Label>Adresse</Label>
        <Input
          value={formData.adresse}
          onChange={(e) => handleInputChange("adresse", e.target.value)}
          placeholder="Adresse"
        />
      </div>

      {/* Code postal */}
      <div className="space-y-2">
        <Label>Code postal</Label>
        <Input
          value={formData.codePostal}
          onChange={(e) => handleInputChange("codePostal", e.target.value)}
          placeholder="Code postal"
        />
      </div>

      {/* Ville */}
      <div className="space-y-2">
        <Label>Ville</Label>
        <Input
          value={formData.ville}
          onChange={(e) => handleInputChange("ville", e.target.value)}
          placeholder="Ville"
        />
      </div>

      {/* Produit */}
      <div className="space-y-2">
        <Label>Produit</Label>
        <Select value={formData.produit} onValueChange={(value) => handleInputChange("produit", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un produit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Freebox Ultra">Freebox Ultra</SelectItem>
            <SelectItem value="Freebox Pop">Freebox Pop</SelectItem>
            <SelectItem value="Forfait 5G">Forfait 5G</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statut */}
      <div className="space-y-2">
        <Label>Statut</Label>
        <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="rdv">Rendez-vous</SelectItem>
            <SelectItem value="valide">Validé</SelectItem>
            <SelectItem value="installation">Installation</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Boutons */}
      <div className="flex space-x-2 pt-4">
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isSubmitting}
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}