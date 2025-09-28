import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface MobileSafeDatePickerProps {
  field: {
    value: string | null;
    onChange: (value: string | null) => void;
  };
  disabled?: boolean;
  placeholder?: string;
}

export function MobileSafeDatePicker({
  field,
  disabled = false,
  placeholder = "Sélectionner une date",
}: MobileSafeDatePickerProps) {
  const inputId = useId();
  
  // Date formatée pour affichage
  const formattedDate = field.value
    ? format(new Date(field.value), "dd/MM/yyyy", { locale: fr })
    : "";
  
  // Gérer le changement via le composant Calendar
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const isoDate = date.toISOString().split("T")[0];
      field.onChange(isoDate);
    } else {
      field.onChange(null);
    }
  };
  
  // Gérer le changement manuel via l'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Si l'entrée est vide, réinitialiser le champ
    if (!value.trim()) {
      field.onChange(null);
      return;
    }
    
    // Essayer de parser la date format DD/MM/YYYY
    const dateParts = value.split("/");
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Mois 0-basé en JS
      const year = parseInt(dateParts[2]);
      
      const date = new Date(year, month, day);
      
      // Vérifier si la date est valide
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split("T")[0];
        field.onChange(isoDate);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Champ pour mobile: input natif de type date */}
      <Input 
        type="date"
        id={`${inputId}-mobile`}
        value={field.value || ""}
        onChange={(e) => field.onChange(e.target.value || null)}
        disabled={disabled}
        className="md:hidden" // Visible uniquement sur mobile
      />
      
      {/* Champ pour desktop: Popover avec calendrier */}
      <div className="hidden md:flex relative">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !field.value && "text-muted-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formattedDate || placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={field.value ? new Date(field.value) : undefined}
              onSelect={handleCalendarSelect}
              initialFocus
              locale={fr}
            />
          </PopoverContent>
        </Popover>
        
        {/* Input invisible qui maintient la valeur pour les formulaires */}
        <Input
          type="hidden"
          id={inputId}
          name={inputId}
          value={field.value || ""}
        />
      </div>
    </div>
  );
}