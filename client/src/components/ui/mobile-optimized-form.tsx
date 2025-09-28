import { ReactNode } from "react";

interface MobileOptimizedFormProps {
  children: ReactNode;
  className?: string;
}

/**
 * Composant qui optimise l'affichage des formulaires sur mobile
 * Ajoute un espacement consistant et adapte les éléments à l'écran tactile
 */
export function MobileOptimizedForm({ children, className = "" }: MobileOptimizedFormProps) {
  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {children}
    </div>
  );
}

interface FormGroupProps {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
}

/**
 * Groupe d'éléments de formulaire qui s'affiche en colonnes sur desktop
 * et en une seule colonne sur mobile
 */
export function FormGroup({ children, columns = 2, className = "" }: FormGroupProps) {
  return (
    <div 
      className={`grid grid-cols-1 ${columns === 2 ? "sm:grid-cols-2" : ""} gap-4 ${className}`}
    >
      {children}
    </div>
  );
}

interface TouchFriendlyInputProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper pour rendre les éléments de formulaire plus tactiles
 */
export function TouchFriendlyInput({ children, className = "" }: TouchFriendlyInputProps) {
  return (
    <div className={`touch-manipulation ${className}`}>
      {children}
    </div>
  );
}