import React from "react";
import { cn } from "@/lib/utils";

export interface CustomTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CustomTable = React.forwardRef<HTMLDivElement, CustomTableProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("w-full border border-gray-200 rounded-none", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CustomTable.displayName = "CustomTable";

export interface CustomTableHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CustomTableHeader = React.forwardRef<HTMLDivElement, CustomTableHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid border-b bg-white", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CustomTableHeader.displayName = "CustomTableHeader";

export interface CustomTableBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CustomTableBody = React.forwardRef<HTMLDivElement, CustomTableBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("divide-y", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CustomTableBody.displayName = "CustomTableBody";

export interface CustomTableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  status?: string;
  isHeader?: boolean;
}

export const CustomTableRow = React.forwardRef<HTMLDivElement, CustomTableRowProps>(
  ({ className, children, status, isHeader = false, ...props }, ref) => {
    const baseClasses = "grid cursor-pointer transition-colors border-b";
    
    // Si c'est un header, on utilise les styles de header
    if (isHeader) {
      return (
        <div
          ref={ref}
          className={cn(baseClasses, "bg-white", className)}
          {...props}
        >
          {children}
        </div>
      );
    }
    
    // Sinon, on applique les styles en fonction du statut
    const statusClasses = 
      status?.toLowerCase() === "enregistre" || status?.toLowerCase() === "enregistré" 
        ? "bg-white" 
        : status?.toLowerCase() === "valide" || status?.toLowerCase() === "validé" 
        ? "bg-amber-300" 
        : status?.toLowerCase() === "valide 7 jours" || status?.toLowerCase() === "validé 7 jours" 
        ? "bg-gray-200" 
        : status?.toLowerCase() === "rendez-vous" || status?.toLowerCase() === "rdv" 
        ? "bg-green-600 text-white" 
        : status?.toLowerCase() === "installation" 
        ? "bg-green-100" 
        : status?.toLowerCase() === "post-production" 
        ? "bg-red-200" 
        : status?.toLowerCase() === "resiliation" || status?.toLowerCase() === "résiliation" 
        ? "bg-red-600 text-white" 
        : status?.toLowerCase() === "abandonne" || status?.toLowerCase() === "abandonné" 
        ? "bg-gray-500 text-white" 
        : "bg-white hover:bg-gray-50";
    
    return (
      <div
        ref={ref}
        className={cn(baseClasses, statusClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CustomTableRow.displayName = "CustomTableRow";

export interface CustomTableCellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isHeader?: boolean;
  textDark?: boolean;
}

export const CustomTableCell = React.forwardRef<HTMLDivElement, CustomTableCellProps>(
  ({ className, children, isHeader = false, textDark = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "py-3 px-4",
          isHeader ? "text-gray-800 font-medium" : "",
          textDark ? "text-gray-800" : "",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CustomTableCell.displayName = "CustomTableCell";