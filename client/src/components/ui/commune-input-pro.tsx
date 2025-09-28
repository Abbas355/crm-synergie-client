import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface CommuneInputProProps {
  form: UseFormReturn<any>;
  className?: string;
}

interface Commune {
  nom: string;
  code: string;
}

function nullToEmpty(value: string | null | undefined): string {
  return value ?? "";
}

export function CommuneInputPro({ form, className = "" }: CommuneInputProProps) {
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSelect, setShowSelect] = useState(false);

  const codePostal = form.watch("codePostal");

  useEffect(() => {
    if (codePostal && codePostal.length === 5 && /^\d+$/.test(codePostal)) {
      setLoading(true);
      
      fetch(`https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=nom,code`)
        .then(res => res.json())
        .then((data: Commune[]) => {
          setCommunes(data);
          
          if (data.length === 1) {
            // Une seule commune : remplissage automatique
            form.setValue("ville", data[0].nom);
            setShowSelect(false);
          } else if (data.length > 1) {
            // Plusieurs communes : afficher le menu déroulant
            form.setValue("ville", "");
            setShowSelect(true);
          } else {
            // Aucune commune trouvée
            setShowSelect(false);
          }
        })
        .catch(() => {
          setCommunes([]);
          setShowSelect(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setCommunes([]);
      setShowSelect(false);
      setLoading(false);
    }
  }, [codePostal, form]);

  return (
    <div className="space-y-4">
      {/* Champ Adresse facultatif */}
      <FormField
        control={form.control}
        name="adresse"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700 font-medium">Adresse (facultatif)</FormLabel>
            <FormControl>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="123 rue de la Paix" 
                  {...field} 
                  value={nullToEmpty(field.value)}
                  className={`pl-10 ${className}`}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Code postal */}
        <FormField
          control={form.control}
          name="codePostal"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Code postal</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="75001" 
                    {...field} 
                    value={nullToEmpty(field.value)}
                    className={className}
                  />
                  {loading && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 text-purple-600 animate-spin" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Ville avec menu déroulant si plusieurs communes */}
        <FormField
          control={form.control}
          name="ville"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Ville</FormLabel>
              <FormControl>
                {showSelect && communes.length > 1 ? (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger className={className}>
                      <SelectValue placeholder="Sélectionnez votre commune" />
                    </SelectTrigger>
                    <SelectContent>
                      {communes.map((commune) => (
                        <SelectItem key={commune.code} value={commune.nom}>
                          {commune.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    placeholder="Paris" 
                    {...field} 
                    value={nullToEmpty(field.value)}
                    className={className}
                    readOnly={communes.length === 1}
                  />
                )}
              </FormControl>
              <FormMessage />
              {communes.length > 1 && (
                <p className="text-xs text-purple-600 mt-1">
                  {communes.length} communes trouvées pour ce code postal
                </p>
              )}
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}