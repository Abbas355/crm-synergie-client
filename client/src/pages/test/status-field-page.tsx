import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Définir les options de statut
const statusOptions = [
  { value: "nouveau", label: "Nouveau" },
  { value: "en-attente", label: "En attente" },
  { value: "signe", label: "Signé" },
  { value: "rendez-vous", label: "Rendez-vous" },
  { value: "refus", label: "Refus" },
  { value: "installation", label: "Installation" },
  { value: "termine", label: "Terminé" },
  { value: "valide_7j", label: "Validé 7 jours" },
  { value: "post-production", label: "Post-production" },
];

// Schéma simple avec juste le champ status
const schema = z.object({
  status: z.string().min(1, "Statut est requis")
});

type FormValues = z.infer<typeof schema>;

export default function StatusFieldTestPage() {
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  // Initialisation du formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "nouveau",
    },
  });

  // Soumission du formulaire
  const onSubmit = (data: FormValues) => {
    console.log("Statut sélectionné:", data.status);
    setSubmittedStatus(data.status);
  };

  // Rendu
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test du champ Statut vente</h1>
      
      <div className="flex gap-8">
        <div className="w-1/2 border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Formulaire</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Version 1: Select de Shadcn */}
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Version 1: Select de Shadcn</h3>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut vente *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Version 2: Select HTML standard */}
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Version 2: Select HTML standard</h3>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut vente *</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="" disabled>Sélectionner un statut</option>
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full">
                Enregistrer le statut
              </Button>
            </form>
          </Form>
        </div>
        
        <div className="w-1/2 border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Résultat</h2>
          
          {submittedStatus ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p>Statut soumis: <strong>{submittedStatus}</strong></p>
              <p>Label correspondant: <strong>
                {statusOptions.find(opt => opt.value === submittedStatus)?.label || "Inconnu"}
              </strong></p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-500">
              Veuillez soumettre le formulaire pour voir le résultat
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Valeur actuelle du formulaire</h3>
            <pre className="p-3 bg-gray-50 border rounded overflow-auto">
              {JSON.stringify(form.watch(), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}