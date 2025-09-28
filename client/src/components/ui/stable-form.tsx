import { ReactNode, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface StableFormProps {
  children: ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

/**
 * Composant formulaire optimisé pour éviter les tremblements et re-rendus excessifs
 * Utilise une approche stable avec des refs pour maintenir les dimensions constantes
 */
export function StableForm({ children, className, onSubmit }: StableFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formDimensions, setFormDimensions] = useState({ width: '100%', minHeight: '500px' });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  }, [onSubmit]);

  // Stabiliser les dimensions du formulaire pour éviter les tremblements
  const handleFormLoad = useCallback(() => {
    if (formRef.current) {
      const rect = formRef.current.getBoundingClientRect();
      if (rect.height > 0) {
        setFormDimensions({
          width: '100%',
          minHeight: `${Math.max(rect.height, 500)}px`
        });
      }
    }
  }, []);

  return (
    <div
      ref={formRef}
      className={cn(
        "stable-form space-y-4 transition-none",
        "transform-none backface-visibility-hidden", // Optimisations anti-tremblement
        className
      )}
      style={{
        width: formDimensions.width,
        minHeight: formDimensions.minHeight,
        willChange: 'auto', // Désactiver les optimisations CSS qui causent des tremblements
        contain: 'layout style', // Isolation pour performances
      }}
      onLoad={handleFormLoad}
    >
      <div className="stable-form-content">
        {children}
      </div>
    </div>
  );
}

interface StableFieldProps {
  children: ReactNode;
  className?: string;
}

/**
 * Champ de formulaire stabilisé pour éviter les mouvements lors des changements
 */
export function StableField({ children, className }: StableFieldProps) {
  return (
    <div 
      className={cn(
        "stable-field relative",
        "transform-none", // Pas de transformations CSS
        "backface-visibility-hidden", // Éviter les re-renders
        className
      )}
      style={{
        contain: 'layout style', // Isolation pour les performances
        willChange: 'auto'
      }}
    >
      {children}
    </div>
  );
}