import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusOptions } from "./client-status-select";
import { ClientStatusSelectProps } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";

// Composant pour la modification du statut client directement dans la liste des clients
export function ClientStatusSelector({ clientId, currentStatus, className = "", onSuccess }: ClientStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  // Fonction pour mettre à jour le statut client
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la mise à jour du statut: ${response.statusText}`);
      }
      
      // Mise à jour locale du statut
      setStatus(newStatus);
      
      // Notification de succès
      toast({
        title: "Statut mis à jour",
        description: "Le statut du client a été mis à jour avec succès.",
      });
      
      // Callback en cas de succès
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le statut: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Obtenir l'option de statut correspondante pour l'affichage
  const getLabel = (statusValue: string) => {
    const option = statusOptions.find(o => o.value === statusValue);
    if (!option) {
      const mappedStatus = mapStatusToOption(statusValue);
      return mappedStatus.label;
    }
    return option.label;
  };
  
  // Mapper un statut texte à une option de statut
  const mapStatusToOption = (statusValue: string) => {
    // Conversion des statuts en format attendu
    const statusLower = statusValue.toLowerCase();
    
    if (statusLower === "enregistré" || statusLower === "enregistre") {
      return { value: "nouveau", label: "Enregistré" };
    } else if (statusLower === "validé" || statusLower === "valide") {
      return { value: "valide", label: "Validé" };
    } else if (statusLower.includes("7 jours") || statusLower.includes("7jours")) {
      return { value: "valide7jours", label: "Validé 7 jours" };
    } else if (statusLower.includes("rendez-vous") || statusLower.includes("rdv")) {
      return { value: "rendezvous", label: "Rendez-vous" };
    } else if (statusLower.includes("install")) {
      return { value: "installation", label: "Installation" };
    } else if (statusLower.includes("production")) {
      return { value: "postproduction", label: "Post-production" };
    } else if (statusLower.includes("résili") || statusLower.includes("resili")) {
      return { value: "resiliation", label: "Résiliation" };
    } else if (statusLower.includes("abandonn")) {
      return { value: "abandonne", label: "Abandonné" };
    }
    
    // Valeur par défaut
    return { value: statusValue, label: statusValue };
  };
  
  return (
    <div className="inline-flex flex-col">
      <StatusBadge status={status} />
    </div>
  );
}