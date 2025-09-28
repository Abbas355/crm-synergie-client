import { UseFormReturn } from "react-hook-form";
import { Client } from "@shared/schema";

export interface ClientStatusOption {
  value: string;
  label: string;
}

export interface ProductOption {
  value: string;
  label: string;
}

export interface SimCardOption {
  value: string;
  label: string;
}

export interface PortabiliteOption {
  value: string;
  label: string;
}

export interface ClientFormTabContratProps {
  form: UseFormReturn<any>;
  handleTabChange: (tab: string) => void;
  clientStatusOptions: ClientStatusOption[];
  produitOptions: ProductOption[];
  carteSimOptions: SimCardOption[];
  portabiliteOptions: PortabiliteOption[];
  client?: Client;
  editMode: boolean;
  isPending: boolean;
  dateSignatureOpen: boolean;
  setDateSignatureOpen: (open: boolean) => void;
  dateRendezVousOpen: boolean;
  setDateRendezVousOpen: (open: boolean) => void;
  dateInstallationOpen: boolean;
  setDateInstallationOpen: (open: boolean) => void;
}