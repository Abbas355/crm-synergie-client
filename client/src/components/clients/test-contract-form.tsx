import { useState } from "react";
import { z } from "zod";
import { SimpleSelect } from "@/components/simple-select";
import { SimpleDatePicker } from "@/components/simple-date-picker";
import { statusOptions } from "@/components/clients/client-status-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Schéma de validation réduit pour le test
const contractFormSchema = z.object({
  status: z.string().min(1, "Le statut est requis"),
  dateSignature: z.string().nullable().optional(),
  produit: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof contractFormSchema>;

export function TestContractForm() {
  const produitOptions = [
    { value: "fibre", label: "Fibre" },
    { value: "adsl", label: "ADSL" },
    { value: "5g", label: "5G" },
    { value: "4g", label: "4G" },
    { value: "autre", label: "Autre" },
  ];

  // Initialisation du formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      status: "nouveau",
      dateSignature: null,
      produit: null,
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Formulaire soumis:", data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Test Onglet Contrat</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut vente *</FormLabel>
                <FormControl>
                  <SimpleSelect 
                    options={statusOptions.map(opt => ({ value: opt.value, label: opt.label }))} 
                    value={field.value || ""} 
                    onChange={field.onChange} 
                    placeholder="Sélectionner un statut" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dateSignature"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de signature *</FormLabel>
                <FormControl>
                  <SimpleDatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    setDate={(date) => field.onChange(date ? date.toISOString().split("T")[0] : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="produit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Produit *</FormLabel>
                <FormControl>
                  <SimpleSelect 
                    options={produitOptions} 
                    value={field.value || ""} 
                    onChange={field.onChange} 
                    placeholder="Sélectionner un produit" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="mt-4">
            Soumettre
          </Button>
        </form>
      </Form>
    </div>
  );
}