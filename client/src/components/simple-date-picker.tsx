import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface SimpleDatePickerProps {
  date?: Date;
  setDate: (date: Date | null) => void;
  disabled?: boolean;
}

export function SimpleDatePicker({ date, setDate, disabled }: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setIsOpen(false);
  };

  const clearDate = () => {
    setDate(null);
    setIsOpen(false);
  };

  // Format the display text
  const displayText = date && isValid(date)
    ? format(date, "dd MMMM yyyy", { locale: fr })
    : "Sélectionner une date";

  return (
    <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          locale={fr}
        />
        <div className="p-2 border-t flex justify-between">
          <Button variant="ghost" size="sm" onClick={clearDate}>
            Effacer
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}