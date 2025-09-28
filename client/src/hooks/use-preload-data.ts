import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function usePreloadData() {
  const queryClient = useQueryClient();

  // Précharger les données des prospects dès le chargement de l'app
  useEffect(() => {
    const preloadProspects = async () => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ["/api/recruitment/prospects", { search: "", stade: "tous", recruteurId: "" }],
          queryFn: async () => {
            const response = await fetch("/api/recruitment/prospects");
            if (!response.ok) return { prospects: [], stats: {} };
            return response.json();
          },
          staleTime: 1000 * 60 * 5, // Cache 5 minutes
        });
      } catch (error) {
        // Échec silencieux du préchargement
        console.warn("Préchargement des prospects échoué:", error);
      }
    };

    // Précharger après un délai pour ne pas bloquer l'interface
    const timer = setTimeout(preloadProspects, 1000);
    return () => clearTimeout(timer);
  }, [queryClient]);

  return null;
}