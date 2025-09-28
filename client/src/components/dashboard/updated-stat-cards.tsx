import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Link } from "wouter";

// Nous allons mettre à jour les labels des cartes statistiques selon les spécifications
interface StatCardProps {
  title: string; // Titre de la statistique
  value: number | string; // Valeur à afficher
  icon: ReactNode; // Icône à afficher
  linkText?: string; // Texte du lien optionnel
  linkHref?: string; // URL du lien optionnel
  iconColor?: string; // Couleur de fond de l'icône
  linkColor?: string; // Couleur du texte du lien
}

// Composant de carte statistique avec mise à jour des titres
export function StatCard({
  title,
  value,
  icon,
  linkText,
  linkHref,
  iconColor = "bg-primary",
  linkColor = "text-primary"
}: StatCardProps) {
  // Fonction de formatage du titre selon les nouvelles spécifications
  const getFormattedTitle = (originalTitle: string) => {
    switch (originalTitle) {
      case "Total Clients":
        return "Nouveau Client"; // Clients signés dans le mois courant
      case "Clients en Validation":
        return "En Validation"; // Total - Résiliation - Installation
      case "Installations":
        return "Installation en cours"; // Clients avec statut "installation" dans le mois courant
      case "Nombre de points":
        return "Nombre de points"; // Points générés dans le mois courant
      default:
        return originalTitle; // Garder le titre original pour les autres cas
    }
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", iconColor)}>
              {icon}
            </div>
            <h3 className="text-lg font-medium">{getFormattedTitle(title)}</h3>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{value}</p>
          {linkText && linkHref && (
            <Link href={linkHref}>
              <a className={cn("text-sm font-medium hover:underline", linkColor)}>
                {linkText}
              </a>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}