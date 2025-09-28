import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FormData {
  civilite?: string;
  prenom?: string;
  nom?: string;
  email?: string;
  phone?: string;
  dateNaissance?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  identifiantContrat?: string;
  forfaitType?: string;
  dateSignature?: string;
  source?: string;
  typeRecommandation?: string;
  prospectCivilite?: string;
  prospectPrenom?: string;
  prospectNom?: string;
}

interface FormProgressTrackerProps {
  formData: FormData;
}

export function FormProgressTracker({ formData }: FormProgressTrackerProps) {
  // Calcul du pourcentage pour chaque section
  const calculatePersonnelProgress = () => {
    const fields = [
      formData.civilite,
      formData.prenom,
      formData.nom,
      formData.email,
      formData.phone,
      formData.dateNaissance
    ];
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const calculateAdresseProgress = () => {
    const fields = [
      formData.adresse,
      formData.codePostal,
      formData.ville
    ];
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const calculateContratProgress = () => {
    const fields = [
      formData.identifiantContrat,
      formData.forfaitType,
      formData.dateSignature
    ];
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const calculateSourceProgress = () => {
    if (!formData.source || formData.source === '') return 0;
    
    // Si c'est une recommandation, vérifier les champs de recommandation
    if (formData.source === 'recommandation') {
      const fields = [
        formData.typeRecommandation,
        formData.prospectCivilite,
        formData.prospectPrenom,
        formData.prospectNom
      ];
      const filledFields = fields.filter(field => field && field.trim() !== '').length;
      return fields.length > 0 ? Math.round((filledFields / fields.length) * 100) : 100;
    }
    
    // Pour les autres sources, considérer comme complété si la source est sélectionnée
    return 100;
  };

  const personnelProgress = calculatePersonnelProgress();
  const adresseProgress = calculateAdresseProgress();
  const contratProgress = calculateContratProgress();
  const sourceProgress = calculateSourceProgress();

  // Progression globale
  const globalProgress = Math.round((personnelProgress + adresseProgress + contratProgress + sourceProgress) / 4);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Informations du client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barre de progression globale */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progression du formulaire</span>
            <span className="text-sm text-muted-foreground">{globalProgress}%</span>
          </div>
          <Progress value={globalProgress} className="h-2" />
        </div>

        {/* Détail par section */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center space-y-1">
            <div className="text-xs font-medium text-gray-700">Personnel</div>
            <div className="text-xs text-muted-foreground">{personnelProgress}%</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-xs font-medium text-gray-700">Adresse</div>
            <div className="text-xs text-muted-foreground">{adresseProgress}%</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-xs font-medium text-gray-700">Contrat</div>
            <div className="text-xs text-muted-foreground">{contratProgress}%</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-xs font-medium text-gray-700">Source</div>
            <div className="text-xs text-muted-foreground">{sourceProgress}%</div>
          </div>
        </div>

        {/* Indicateurs visuels par section */}
        <div className="grid grid-cols-4 gap-1 mt-2">
          <div className={`h-1 rounded ${personnelProgress === 100 ? 'bg-green-500' : personnelProgress > 0 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`h-1 rounded ${adresseProgress === 100 ? 'bg-green-500' : adresseProgress > 0 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`h-1 rounded ${contratProgress === 100 ? 'bg-green-500' : contratProgress > 0 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`h-1 rounded ${sourceProgress === 100 ? 'bg-green-500' : sourceProgress > 0 ? 'bg-blue-500' : 'bg-gray-200'}`} />
        </div>

        {/* Message d'aide contextuel */}
        {globalProgress < 100 && (
          <div className="text-xs text-muted-foreground mt-3 p-2 bg-blue-50 rounded">
            {personnelProgress < 100 && "• Complétez les informations personnelles\n"}
            {adresseProgress < 100 && "• Ajoutez l'adresse complète\n"}
            {contratProgress < 100 && "• Renseignez les détails du contrat\n"}
            {sourceProgress < 100 && "• Indiquez la source de prospection"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}