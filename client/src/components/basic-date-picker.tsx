import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BasicDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Composant date picker simplifié utilisant l'élément natif HTML
 * pour une meilleure compatibilité mobile
 */
export function BasicDatePicker({
  value,
  onChange,
  label,
  disabled = false,
  placeholder = 'Sélectionner une date',
  className = '',
}: BasicDatePickerProps) {
  
  // Convertir la date en format yyyy-MM-dd pour l'input type="date"
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    
    try {
      const year = date.getFullYear();
      // Mois en format 01, 02, etc. (getMonth() retourne 0-11)
      const month = String(date.getMonth() + 1).padStart(2, '0');
      // Jour en format 01, 02, etc.
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  };
  
  // Gérer le changement de date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const inputValue = e.target.value;
      
      if (!inputValue) {
        // Si la valeur est vide, on passe undefined
        onChange(undefined);
        return;
      }
      
      // Créer une date à partir de la valeur saisie (format yyyy-MM-dd)
      const selectedDate = new Date(inputValue);
      
      // Vérifier que la date est valide
      if (!isNaN(selectedDate.getTime())) {
        console.log(`BasicDatePicker: Date ${label} sélectionnée:`, selectedDate);
        onChange(selectedDate);
      } else {
        console.error(`BasicDatePicker: Date invalide pour ${label}:`, inputValue);
      }
    } catch (error) {
      console.error(`BasicDatePicker: Erreur lors de la sélection de date pour ${label}:`, error);
    }
  };
  
  // Formater la date pour l'affichage (optionnel, pour un label)
  const formattedDateForDisplay = value 
    ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) 
    : '';
  
  return (
    <div className="relative w-full">
      <input
        id={`date-${label.replace(/\s+/g, '-').toLowerCase()}`}
        type="date"
        value={formatDateForInput(value)}
        onChange={handleDateChange}
        disabled={disabled}
        className={`w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        aria-label={label}
      />
      {formattedDateForDisplay && (
        <div className="mt-1 text-xs text-gray-500">
          Format: {formattedDateForDisplay}
        </div>
      )}
    </div>
  );
}