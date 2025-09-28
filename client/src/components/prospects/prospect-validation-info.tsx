import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProspectValidationInfoProps {
  nom?: string;
  prenom?: string;
  telephone?: string;
}

export function ProspectValidationInfo({ nom, prenom, telephone }: ProspectValidationInfoProps) {
  const hasNomOrPrenom = Boolean(nom) || Boolean(prenom);
  const hasTelephone = Boolean(telephone);
  
  const isValid = hasNomOrPrenom && hasTelephone;

  if (isValid) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Les informations obligatoires sont complètes ✓
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-red-200 bg-red-50 py-2">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium">Informations manquantes :</span>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {!hasNomOrPrenom && (
              <li className="flex items-center gap-1">
                <span className="text-red-500">•</span>
                <span>Au moins un nom OU un prénom doit être renseigné</span>
              </li>
            )}
            {!hasTelephone && (
              <li className="flex items-center gap-1">
                <span className="text-red-500">•</span>
                <span>Le numéro de téléphone est obligatoire</span>
              </li>
            )}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}