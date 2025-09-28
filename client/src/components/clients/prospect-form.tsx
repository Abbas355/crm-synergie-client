import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { civiliteOptions } from "@/lib/schemas/client-schema";
import { PostalCodeLookup } from "@/components/postal-code-lookup";
import { UseFormReturn } from "react-hook-form";
import { ClientFormValues } from "@/lib/schemas/client-schema";

interface ProspectFormProps {
  form: UseFormReturn<ClientFormValues>;
  disabled?: boolean;
}

export function ProspectForm({ form, disabled = false }: ProspectFormProps) {
  return (
    <div className="space-y-4 border p-4 rounded-md bg-gray-50/50">
      <h3 className="font-medium">Informations du Prospect</h3>
      
      <FormField
        control={form.control}
        name="civiliteProspect"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Civilité *</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value || undefined}
              value={field.value || undefined}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une civilité" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {civiliteOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="prenomProspect"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Prénom du prospect" 
                  {...field} 
                  value={field.value || ""} 
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="nomProspect"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nom du prospect" 
                  {...field} 
                  value={field.value || ""} 
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="mobileProspect"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mobile *</FormLabel>
            <FormControl>
              <Input 
                placeholder="+33612345678" 
                {...field} 
                value={field.value || ""} 
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="codePostalProspect"
          render={({ field: postalCodeField }) => (
            <FormField
              control={form.control}
              name="villeProspect"
              render={({ field: cityField }) => (
                <PostalCodeLookup
                  postalCodeValue={postalCodeField.value || ""}
                  cityValue={cityField.value || ""}
                  onPostalCodeChange={postalCodeField.onChange}
                  onCityChange={cityField.onChange}
                  postalCodeDisabled={disabled}
                  cityDisabled={disabled}
                  required={true}
                />
              )}
            />
          )}
        />
      </div>
    </div>
  );
}