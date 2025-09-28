import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type DuplicateCheckResult = {
  isDuplicate: boolean;
  isNewContract?: boolean;
  type?: "email" | "contract";
  message: string;
  clientInfo?: {
    nom: string;
    email: string;
    contratActuel?: string;
    contrat?: string;
  };
};

type DuplicateState = {
  email: DuplicateCheckResult | null;
  contract: DuplicateCheckResult | null;
};

export function useDuplicateCheck() {
  const [duplicateState, setDuplicateState] = useState<DuplicateState>({
    email: null,
    contract: null
  });

  const checkDuplicateMutation = useMutation({
    mutationFn: async (data: { email?: string; identifiantContrat?: string; prenom?: string; nom?: string }) => {
      const response = await apiRequest("/api/clients/check-duplicate", {
        method: "POST",
        body: data
      });
      return response;
    },
    onSuccess: (result: DuplicateCheckResult, variables) => {
      // Mettre à jour l'état en fonction du type de vérification
      if (variables.email) {
        setDuplicateState(prev => ({
          ...prev,
          email: result
        }));
      }
      if (variables.identifiantContrat) {
        setDuplicateState(prev => ({
          ...prev,
          contract: result
        }));
      }
    },
    onError: (error) => {
      console.error("Erreur vérification doublons:", error);
    }
  });

  const checkEmail = useCallback((email: string, identifiantContrat?: string) => {
    if (!email || email.length < 3) {
      setDuplicateState(prev => ({ ...prev, email: null }));
      return;
    }
    
    checkDuplicateMutation.mutate({ email, identifiantContrat });
  }, [checkDuplicateMutation]);

  const checkContract = useCallback((identifiantContrat: string, email?: string) => {
    if (!identifiantContrat || identifiantContrat.length < 3) {
      setDuplicateState(prev => ({ ...prev, contract: null }));
      return;
    }
    
    checkDuplicateMutation.mutate({ identifiantContrat, email });
  }, [checkDuplicateMutation]);

  const clearDuplicateState = useCallback(() => {
    setDuplicateState({ email: null, contract: null });
  }, []);

  return {
    duplicateState,
    checkEmail,
    checkContract,
    clearDuplicateState,
    isChecking: checkDuplicateMutation.isPending
  };
}