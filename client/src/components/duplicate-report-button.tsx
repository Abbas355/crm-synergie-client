import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DuplicateReportButtonProps {
  clientId: number;
  clientName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function DuplicateReportButton({ 
  clientId, 
  clientName, 
  variant = "ghost", 
  size = "sm" 
}: DuplicateReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/duplicates/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          reason: reason || "Doublon détecté par le vendeur"
        })
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors du signalement");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Doublon signalé",
        description: "L'équipe administrative va examiner ce cas"
      });
      setIsOpen(false);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de signaler le doublon",
        variant: "destructive"
      });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="text-orange-600 hover:text-orange-700">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Signaler doublon
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler un doublon</DialogTitle>
          <DialogDescription>
            Signaler que le client "{clientName}" est un doublon
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="reason">Raison du signalement (optionnel)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Client déjà enregistré avec un autre produit..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => reportMutation.mutate()}
              disabled={reportMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {reportMutation.isPending ? "Signalement..." : "Signaler"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}