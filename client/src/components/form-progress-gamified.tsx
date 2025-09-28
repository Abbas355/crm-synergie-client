import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Types pour les champs à suivre
export type FormProgressField = {
  id: string;
  label: string;
  required: boolean;
  section: "personnel" | "adresse" | "contrat" | "documents" | "source";
  validated: boolean;
};

// Propriétés du composant
type FormProgressGamifiedProps = {
  fields: FormProgressField[];
  activeSection: string;
  onSectionComplete?: (section: string) => void;
};

export function FormProgressGamified({
  fields,
  activeSection,
  onSectionComplete,
}: FormProgressGamifiedProps) {
  const [progress, setProgress] = useState(0);
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({
    personnel: 0,
    adresse: 0,
    contrat: 0,
    documents: 0,
    source: 0,
  });

  // Calculer le pourcentage global de progression et par section
  useEffect(() => {
    if (fields.length === 0) return;

    // Champs requis
    const requiredFields = fields.filter((field) => field.required);
    const validatedRequiredFields = requiredFields.filter((field) => field.validated);
    
    // Calculer le pourcentage de progression global
    const overallProgress = Math.round(
      (validatedRequiredFields.length / requiredFields.length) * 100
    );
    setProgress(overallProgress);

    // Calculer le pourcentage par section
    const sections = ["personnel", "adresse", "contrat", "source"];
    const newSectionProgress: Record<string, number> = {};

    sections.forEach((section) => {
      const sectionRequiredFields = requiredFields.filter((field) => field.section === section);
      const sectionValidatedFields = sectionRequiredFields.filter((field) => field.validated);
      
      const sectionPercentage = sectionRequiredFields.length === 0 
        ? 100 
        : Math.round((sectionValidatedFields.length / sectionRequiredFields.length) * 100);
      
      newSectionProgress[section] = sectionPercentage;

      // Vérifier si la section est complète et appeler le callback si fourni
      if (sectionPercentage === 100 && onSectionComplete) {
        onSectionComplete(section);
      }
    });

    setSectionProgress(newSectionProgress);
  }, [fields, onSectionComplete]);

  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Progression du formulaire</h3>
        <span className="text-sm font-bold">{progress}%</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex justify-between mt-2">
        <SectionBadge 
          label="Personnel" 
          progress={sectionProgress.personnel} 
          active={activeSection === "personnel"} 
        />
        <SectionBadge 
          label="Adresse" 
          progress={sectionProgress.adresse} 
          active={activeSection === "adresse"} 
        />
        <SectionBadge 
          label="Contrat" 
          progress={sectionProgress.contrat} 
          active={activeSection === "contrat"} 
        />
        <SectionBadge 
          label="Source" 
          progress={sectionProgress.source} 
          active={activeSection === "source"} 
        />
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {fields
          .filter((field) => field.required && field.section === activeSection)
          .map((field) => (
            <FieldStatus key={field.id} field={field} />
          ))}
      </div>
    </div>
  );
}

// Composant pour afficher le badge d'une section
function SectionBadge({ 
  label, 
  progress, 
  active 
}: { 
  label: string; 
  progress: number; 
  active: boolean;
}) {
  let variantClass = "bg-gray-200 text-gray-700";

  if (progress === 100) {
    variantClass = "bg-green-100 text-green-800";
  } else if (active) {
    variantClass = "bg-blue-100 text-blue-800";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-center">
            <Badge className={`${variantClass} px-2 py-1 text-xs font-medium`}>
              {label}
            </Badge>
            <div className="text-xs mt-1">{progress}%</div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{progress === 100 ? "Section complète" : `${progress}% de la section complétée`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Composant pour afficher le statut d'un champ
function FieldStatus({ field }: { field: FormProgressField }) {
  const Icon = field.validated ? CheckCircle2 : field.required ? AlertCircle : Circle;
  const color = field.validated 
    ? "text-green-500" 
    : field.required 
      ? "text-amber-500" 
      : "text-gray-400";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-md">
            <Icon className={`h-3.5 w-3.5 ${color}`} />
            <span>{field.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {field.validated
              ? "Champ validé"
              : field.required
              ? "Champ obligatoire à remplir"
              : "Champ optionnel"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}