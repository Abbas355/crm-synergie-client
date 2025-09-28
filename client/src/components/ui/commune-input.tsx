import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { FormControl, FormMessage } from "@/components/ui/form";

interface CommuneInputProps {
  codePostal: string | undefined;
  onChange: (commune: string) => void;
  value: string | undefined;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function CommuneInput({ 
  codePostal, 
  onChange, 
  value, 
  disabled = false,
  className = "",
  placeholder = "Ville"
}: CommuneInputProps) {
  const [communes, setCommunes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Ferme le menu lorsqu'on clique en dehors du composant
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const dropdownContainer = document.querySelector('.commune-dropdown-container');
      if (dropdownContainer && !dropdownContainer.contains(target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Vérifier que le code postal a 5 chiffres
    if (codePostal && codePostal.length === 5 && /^\d+$/.test(codePostal)) {
      setLoading(true);
      setError(null);
      
      fetch(`https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=nom`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            const communeNames = data.map((c: any) => c.nom);
            setCommunes(communeNames);
            
            // Si une seule commune est trouvée, on la sélectionne automatiquement
            if (communeNames.length === 1 && !value) {
              onChange(communeNames[0]);
              setMenuOpen(false);
            } else if (communeNames.length > 1) {
              // Ouvrir le menu si plusieurs communes sont trouvées
              setMenuOpen(true);
            }
          } else {
            setCommunes([]);
            setMenuOpen(false);
            setError("Aucune commune trouvée pour ce code postal");
          }
        })
        .catch(err => {
          console.error("Erreur lors de la récupération des communes:", err);
          setError("Erreur lors de la récupération des communes");
          setCommunes([]);
          setMenuOpen(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setCommunes([]);
      setMenuOpen(false);
    }
  }, [codePostal, onChange, value]);

  return (
    <div className="relative commune-dropdown-container">
      <FormControl>
        <div className="relative">
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onClick={() => {
              if (communes.length > 1) {
                setMenuOpen(true);
              }
            }}
            onFocus={() => {
              if (communes.length > 1) {
                setMenuOpen(true);
              }
            }}
            disabled={disabled || loading}
            placeholder={placeholder}
            className={className}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </FormControl>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      {communes.length > 1 && !loading && menuOpen && (
        <div className="absolute z-10 w-full bg-white shadow-lg max-h-40 overflow-auto rounded-md border mt-1">
          <ul className="py-1">
            {communes.map((commune, index) => (
              <li
                key={index}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-muted"
                onClick={() => {
                  onChange(commune);
                  setMenuOpen(false);
                }}
              >
                {commune}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}