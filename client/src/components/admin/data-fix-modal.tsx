import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DataFixModalProps {
  open: boolean;
  onClose: () => void;
}

export function DataFixModal({ open, onClose }: DataFixModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  const fixData = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/admin/fix-data-relations");
      const data = await res.json();
      setResult("Correction terminée avec succès : " + data.message);
      toast({
        title: "Correction réussie",
        description: "Les données ont été vérifiées et corrigées avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la correction des données:", error);
      setResult("Échec de la correction : " + (error instanceof Error ? error.message : "Erreur inconnue"));
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la correction des données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vérification et correction des données</DialogTitle>
          <DialogDescription>
            Cet outil permet de vérifier et corriger les incohérences dans les relations entre utilisateurs, recruteurs et prospects.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Cette action va analyser la base de données et créer automatiquement les profils recruteur manquants et leurs prospects associés.
            Utilisez cette fonction en cas de problème "ID de prospect invalide" lors du parcours d'onboarding.
          </p>
          
          {result && (
            <div className={`p-3 rounded-md text-sm ${result.startsWith('Échec') ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
              {result}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={fixData} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Correction en cours..." : "Corriger les données"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}