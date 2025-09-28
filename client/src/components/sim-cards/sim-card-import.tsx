import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

type SimCardImportProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ImportResult = {
  inserted: number;
  invalid: number;
  existing: number;
  details: {
    invalidCards: any[];
    existingNumbers: string[];
  };
};

export function SimCardImport({ isOpen, onClose }: SimCardImportProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier si le fichier est un CSV
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Format de fichier non supporté",
          description: "Veuillez sélectionner un fichier CSV",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/sim-cards/import", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Une erreur est survenue" }));
        throw new Error(errorData.message || "Échec de l'importation");
      }
      
      return await res.json();
    },
    onSuccess: (data: ImportResult) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Importation terminée",
        description: `${data.inserted} cartes SIM ont été importées avec succès.`,
      });
      
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de l'importation",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleImport = () => {
    if (!file) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Veuillez sélectionner un fichier CSV à importer",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    importMutation.mutate(formData);
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Importer des cartes SIM</DialogTitle>
          <DialogDescription>
            Importez plusieurs cartes SIM à partir d'un fichier CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="file">Fichier CSV</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              Le fichier doit contenir les colonnes: codeVendeur, numero
            </p>
          </div>

          {file && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Fichier sélectionné</AlertTitle>
              <AlertDescription>
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </AlertDescription>
            </Alert>
          )}

          {importResult && (
            <div className="space-y-3">
              <Alert variant="default" className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Importation réussie</AlertTitle>
                <AlertDescription>
                  {importResult.inserted} cartes SIM ont été importées avec succès.
                </AlertDescription>
              </Alert>

              {importResult.existing > 0 && (
                <Alert variant="default" className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertTitle>Numéros existants</AlertTitle>
                  <AlertDescription>
                    {importResult.existing} numéros de cartes SIM étaient déjà présents dans la base de données.
                    {importResult.details.existingNumbers.length > 0 && (
                      <div className="mt-2 text-xs">
                        <strong>Exemples:</strong>{" "}
                        {importResult.details.existingNumbers.slice(0, 3).join(", ")}
                        {importResult.details.existingNumbers.length > 3 && "..."}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {importResult.invalid > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Entrées invalides</AlertTitle>
                  <AlertDescription>
                    {importResult.invalid} entrées n'ont pas pu être importées car elles ne respectent pas le format requis.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!importResult ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importation...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importer
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleReset}>
                Nouvelle importation
              </Button>
              <Button type="button" onClick={onClose}>
                Fermer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}