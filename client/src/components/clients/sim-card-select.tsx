import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SimCard {
  id: number;
  numero: string;
  statut: string;
  client_id?: number | null;
}

interface SimCardSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  clientId?: number; // ID du client pour récupérer sa carte déjà attribuée
}

export function SimCardSelect({ value, onChange, disabled = false, clientId }: SimCardSelectProps) {
  // Récupérer les cartes SIM disponibles (+ celle attribuée au client si en édition)
  const { data: simCards, isLoading, error } = useQuery<SimCard[]>({
    queryKey: ['/api/sim-cards/available', clientId],
    enabled: !disabled,
  });

  // En mode édition, inclure toutes les cartes retournées par l'API
  // (disponibles + celle attribuée au client)
  const availableSimCards = simCards || [];

  return (
    <div className="space-y-2">
      <Label htmlFor="sim-card-select">Carte SIM *</Label>
      <Select
        onValueChange={onChange}
        defaultValue={value || undefined}
        value={value || undefined}
        disabled={disabled || isLoading || availableSimCards.length === 0}
      >
        <SelectTrigger id="sim-card-select">
          <SelectValue placeholder={
            isLoading 
              ? "Chargement..." 
              : availableSimCards.length === 0 
                ? "Aucune carte SIM disponible" 
                : "Sélectionner une carte SIM"
          } />
        </SelectTrigger>
        <SelectContent>
          {availableSimCards.map(card => (
            <SelectItem key={card.id} value={card.numero}>
              {card.numero}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <div className="text-sm text-red-500">
          Erreur lors du chargement des cartes SIM.
        </div>
      )}
      {!isLoading && availableSimCards.length === 0 && !error && (
        <div className="text-sm text-amber-500">
          Aucune carte SIM disponible. Veuillez en créer de nouvelles.
        </div>
      )}
    </div>
  );
}