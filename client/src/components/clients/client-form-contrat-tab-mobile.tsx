import { useEffect } from "react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MobileSafeDatePicker } from "@/components/mobile-safe-date-picker";
import { BasicDatePicker } from "@/components/basic-date-picker";
import { SimCardSelector } from "@/components/clients/sim-card-selector";

// Détecte si nous sommes en mode production
const isProduction = import.meta.env.MODE === 'production';

// Composant de menu déroulant simplifié pour la production spécifique à ce composant
function ContratTabSimpleSelect({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled 
}: { 
  options: { value: string; label: string }[]; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string; 
  disabled?: boolean 
}) {
  // En production, nous devons spécifiquement gérer les événements pour mobile
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      // Prévenir le comportement par défaut qui pourrait causer un rechargement
      e.preventDefault();
      
      const newValue = e.target.value;
      console.log("ContratTabSimpleSelect onChange appelé avec la valeur:", newValue);
      
      // Appliquer directement le changement sans setTimeout qui peut causer des problèmes
      if (newValue) {
        onChange(newValue);
        
        // Force un blur pour fermer le sélecteur sur certains appareils mobiles
        // mais sans utiliser setTimeout qui peut causer des problèmes
        e.target.blur();
      }
    } catch (err) {
      console.error("Erreur lors du changement de valeur dans ContratTabSimpleSelect:", err);
      // Si une erreur se produit, on essaie quand même de mettre à jour la valeur
      try {
        onChange(e.target.value);
      } catch (innerErr) {
        console.error("Echec de la tentative de récupération après erreur:", innerErr);
      }
    }
  };

  return (
    <select
      className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      aria-label={placeholder}
      role="combobox"
      style={{ WebkitAppearance: 'menulist', appearance: 'menulist' }}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map(option => (
        <option key={option.value} value={option.value} role="option">
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface ClientFormContratTabProps {
  form: UseFormReturn<any>;
  isPending: boolean;
  produitOptions: { value: string; label: string }[];
  portabiliteOptions: { value: string; label: string }[];
  carteSIMOptions?: { value: string; label: string }[];
  handleTabChange?: (tab: string) => void;
  clientStatusOptions?: { value: string; label: string }[];
  client?: any;
  editMode?: boolean;
  dateSignatureOpen?: boolean;
  setDateSignatureOpen?: (open: boolean) => void;
  dateRendezVousOpen?: boolean;
  setDateRendezVousOpen?: (open: boolean) => void;
  dateInstallationOpen?: boolean;
  setDateInstallationOpen?: (open: boolean) => void;
}

/**
 * Version simplifiée du composant pour l'onglet Contrat du formulaire client optimisé pour mobile
 */
export function ClientFormContratTab({
  form,
  isPending,
  produitOptions,
  portabiliteOptions,
  carteSIMOptions = [],
  handleTabChange,
  clientStatusOptions,
  client,
  editMode,
  dateSignatureOpen,
  setDateSignatureOpen,
  dateRendezVousOpen,
  setDateRendezVousOpen,
  dateInstallationOpen,
  setDateInstallationOpen
}: ClientFormContratTabProps) {
  // Obtenir le produit sélectionné pour afficher des indications spécifiques
  
  // Fonction pour gérer la sélection de carte SIM et mise à jour automatique
  const handleSimCardSelection = async (simCardId: string) => {
    try {
      console.log("🔄 Mise à jour automatique carte SIM:", simCardId);
      
      // Mettre à jour immédiatement le statut de la carte SIM de "disponible" à "Activé"
      const response = await fetch(`/api/sim-cards/${simCardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: 'Activé',
          clientId: client?.id,
          dateAttribution: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log("✅ Carte SIM mise à jour automatiquement");
        // Déclencher une actualisation de la liste des cartes SIM si nécessaire
        window.dispatchEvent(new CustomEvent('sim-card-updated'));
      } else {
        console.error("❌ Erreur lors de la mise à jour automatique de la carte SIM");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la sélection de carte SIM:", error);
    }
  };
  const selectedProduit = form.watch('produit');
  const selectedPortabilite = form.watch('portabilite');
  const selectedForfaitType = form.watch('forfaitType');
  
  // Synchroniser le produit et le forfaitType
  useEffect(() => {
    // Convertir le forfaitType en produit si le produit n'est pas déjà défini
    if (!selectedProduit && selectedForfaitType) {
      // Conversion du format technique vers le format d'affichage
      let produitValue = "";
      switch (selectedForfaitType) {
        case 'freebox_ultra':
          produitValue = 'Freebox Ultra';
          break;
        case 'freebox_pop':
          produitValue = 'Freebox Pop';
          break;
        case 'freebox_essentiel':
          produitValue = 'Freebox Essentiel';
          break;
        case 'forfait_5g':
          produitValue = 'Forfait 5G';
          break;
      }
      
      if (produitValue) {
        form.setValue('produit', produitValue);
      }
    }
  }, [selectedForfaitType, selectedProduit, form]);
  
  // Déterminer le placeholder et le pattern en fonction du produit sélectionné
  const getIdentifiantContratPlaceholder = () => {
    switch (selectedProduit) {
      case 'Freebox Pop':
      case 'Freebox Essentiel':
      case 'Freebox Ultra':
        return 'FO35012345';
      case 'Forfait 5G':
        return '52123456';
      default:
        return 'Sélectionnez un produit';
    }
  };

  return (
    <div className="flex flex-col space-y-5 overflow-y-auto">
      {/* Produit */}
      <FormField
        control={form.control}
        name="produit"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700 font-medium">Produit <span className="text-red-500">*</span></FormLabel>
            {isProduction ? (
              <FormControl>
                <ContratTabSimpleSelect
                  options={produitOptions}
                  value={field.value || ""}
                  onChange={(value) => {
                    field.onChange(value);
                    
                    // Mettre à jour le forfaitType en fonction du produit choisi
                    let forfaitTypeValue = "";
                    switch (value) {
                      case 'Freebox Ultra':
                        forfaitTypeValue = 'freebox_ultra';
                        break;
                      case 'Freebox Pop':
                        forfaitTypeValue = 'freebox_pop';
                        break;
                      case 'Freebox Essentiel':
                        forfaitTypeValue = 'freebox_essentiel';
                        break;
                      case 'Forfait 5G':
                        forfaitTypeValue = 'forfait_5g';
                        break;
                    }
                    
                    if (forfaitTypeValue) {
                      form.setValue('forfaitType', forfaitTypeValue);
                      console.log("forfaitType mis à jour:", forfaitTypeValue);
                    }
                    
                    // Réinitialiser l'identifiant contrat lors du changement de produit
                    form.setValue('identifiantContrat', '');
                    
                    // Réinitialiser la carte SIM si le produit n'est pas Forfait 5G
                    if (value !== 'Forfait 5G') {
                      form.setValue('carteSIM', '');
                      form.setValue('portabilite', '');
                      form.setValue('numeroPorter', '');
                    }
                  }}
                  placeholder="Sélectionner un produit"
                  disabled={isPending || editMode === false}
                />
              </FormControl>
            ) : (
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // Réinitialiser l'identifiant contrat lors du changement de produit
                  form.setValue('identifiantContrat', '');
                  // Réinitialiser la carte SIM si le produit n'est pas Forfait 5G
                  if (value !== 'Forfait 5G') {
                    form.setValue('carteSIM', '');
                    form.setValue('portabilite', '');
                    form.setValue('numeroPorter', '');
                  }
                }}
                defaultValue={field.value}
                disabled={isPending || editMode === false}
              >
                <FormControl>
                  <SelectTrigger className="bg-white border-gray-200 h-10">
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {produitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Identifiant contrat (toujours affiché) - MODIFICATION CRITIQUE */}
      <FormField
        control={form.control}
        name="identifiantContrat"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700 font-medium">Identifiant contrat <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input 
                placeholder={getIdentifiantContratPlaceholder()} 
                className="bg-white border-gray-200 h-10 font-medium"
                disabled={isPending || editMode === false}
                value={field.value || ""}
                onChange={(e) => {
                  // S'assurer que la valeur est propagée correctement
                  field.onChange(e.target.value);
                  console.log("Identifiant contrat mis à jour:", e.target.value);
                }}
              />
            </FormControl>
            <FormDescription className="text-xs">
              {['Freebox Pop', 'Freebox Essentiel', 'Freebox Ultra'].includes(selectedProduit || "") ? 
                'Format: FO + 8 chiffres' : 
                selectedProduit === 'Forfait 5G' ? 
                'Format: 8 chiffres' : 
                'Format: FO + 8 chiffres (ex: FO12345678)'}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Carte SIM (affiché uniquement pour Forfait 5G) */}
      {selectedProduit === 'Forfait 5G' && (
        <FormField
          control={form.control}
          name="carteSIM"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Carte SIM <span className="text-red-500">*</span></FormLabel>
              {isProduction ? (
                <FormControl>
                  <ContratTabSimpleSelect
                    options={carteSIMOptions}
                    value={field.value || ""}
                    onChange={(value) => {
                      field.onChange(value);
                      // Déclencher mise à jour immédiate de la carte SIM lors de la sélection
                      if (value && selectedProduit === 'Forfait 5G') {
                        handleSimCardSelection(value);
                      }
                    }}
                    placeholder="Sélectionner une carte SIM"
                    disabled={isPending || editMode === false}
                  />
                </FormControl>
              ) : (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Déclencher mise à jour immédiate de la carte SIM lors de la sélection
                    if (value && selectedProduit === 'Forfait 5G') {
                      handleSimCardSelection(value);
                    }
                  }}
                  value={field.value || ""}
                  disabled={isPending || editMode === false}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white border-gray-200 h-10">
                      <SelectValue placeholder="Sélectionner une carte SIM" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {carteSIMOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Portabilité (affiché uniquement pour Forfait 5G) */}
      {selectedProduit === 'Forfait 5G' && (
        <FormField
          control={form.control}
          name="portabilite"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Portabilité <span className="text-red-500">*</span></FormLabel>
              {isProduction ? (
                <FormControl>
                  <ContratTabSimpleSelect
                    options={portabiliteOptions}
                    value={field.value || ""}
                    onChange={(value) => {
                      field.onChange(value);
                      // Réinitialiser le numéro à porter si on change la portabilité
                      if (value !== 'Portabilité') {
                        form.setValue('numeroPorter', '');
                      }
                    }}
                    placeholder="Sélectionner..."
                    disabled={isPending || editMode === false}
                  />
                </FormControl>
              ) : (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Réinitialiser le numéro à porter si on change la portabilité
                    if (value !== 'Portabilité') {
                      form.setValue('numeroPorter', '');
                    }
                  }}
                  value={field.value || ""}
                  disabled={isPending || editMode === false}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white border-gray-200 h-10">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {portabiliteOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Champ conditionnel pour la portabilité */}
      {selectedPortabilite === 'Portabilité' && selectedProduit === 'Forfait 5G' && (
        <FormField
          control={form.control}
          name="numeroPorter"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Numéro à porter <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="+33612345678" 
                  className="bg-white border-gray-200 h-10"
                  disabled={isPending || editMode === false}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* ⚠️ GESTION CARTE SIM SUPPRIMÉE - VALIDATION MANUELLE OBLIGATOIRE */}
      {/* La carte SIM sera attribuée manuellement après création du client via le bouton "Carte SIM" */}
      {selectedProduit === 'Forfait 5G' && !client?.id && (
        <div className="space-y-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <p className="text-sm font-medium text-orange-700">Attribution carte SIM</p>
          </div>
          <p className="text-xs text-orange-600">
            La carte SIM sera attribuée manuellement après création du client via le bouton "Carte SIM"
          </p>
        </div>
      )}

      {/* Date de signature avec input date natif pour meilleure compatibilité mobile */}
      <FormField
        control={form.control}
        name="dateSignature"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="text-gray-700 font-medium">Date de signature <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <BasicDatePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => field.onChange(date)}
                label="Date de signature"
                disabled={isPending || editMode === false}
                placeholder="Sélectionner une date"
                className="w-full"
              />
            </FormControl>
            <FormDescription className="text-xs">
              Sélectionnez la date de signature du contrat
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Boutons de navigation */}
      <div className="flex justify-between mt-8">
        <Button 
          type="button"
          variant="outline" 
          className="bg-white border-gray-200"
          onClick={() => handleTabChange && handleTabChange('adresse')}
          disabled={isPending || editMode === false}
        >
          Précédent
        </Button>
        <div className="flex gap-2">
          <Button 
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isPending || editMode === false}
          >
            {isPending ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin">⟳</span>
                En cours...
              </>
            ) : "Enregistrer"}
          </Button>
          <Button 
            type="button"
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => handleTabChange && handleTabChange('infos')}
            disabled={isPending || editMode === false}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}