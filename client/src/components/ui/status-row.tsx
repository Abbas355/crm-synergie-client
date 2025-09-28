import React from "react";
import { TableRow } from "@/components/ui/table";
import { getStatusInfo } from "@/components/clients/client-status-select";

// Composant de ligne avec couleur en fonction du statut
export const StatusRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { status?: string }
>(({ className, status = "nouveau", ...props }, ref) => {
  // Utiliser les classes CSS spécifiques pour chaque statut
  const statusClass = `status-row-${status}`;
  
  // Ajouter une transition pour les effets de survol
  const baseRowClass = "transition-all duration-200";
  
  return (
    <TableRow
      ref={ref}
      className={`${baseRowClass} ${statusClass} ${className || ""}`}
      {...props}
    />
  );
});
StatusRow.displayName = "StatusRow";