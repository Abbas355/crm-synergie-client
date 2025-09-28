import React from "react";
import { Button } from "@/components/ui/button";
import { CLIENT_STATUSES, CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS } from "@shared/constants";

interface StatusFilterButtonsProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  setStatusFilter: (filter: string) => void;
  onClose?: () => void;
}

export const StatusFilterButtons: React.FC<StatusFilterButtonsProps> = ({ 
  activeFilter, 
  setActiveFilter, 
  setStatusFilter,
  onClose 
}) => {
  const handleFilterClick = (filterName: string, statusValue: string) => {
    setActiveFilter(filterName);
    setStatusFilter(statusValue);
    if (onClose) onClose();
  };

  const statusFilters = [
    { key: "tous", label: "Tous", value: "all", color: "bg-blue-50 text-blue-700 border border-blue-200" },
    { key: "enregistre", label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.ENREGISTRE], value: CLIENT_STATUSES.ENREGISTRE, color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.ENREGISTRE] },
    { key: "valide", label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.VALIDE], value: CLIENT_STATUSES.VALIDE, color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.VALIDE] },
    { key: "validation_7_jours", label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.VALIDATION_7_JOURS], value: CLIENT_STATUSES.VALIDATION_7_JOURS, color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.VALIDATION_7_JOURS] },
    { key: "rendez_vous", label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.RENDEZ_VOUS], value: CLIENT_STATUSES.RENDEZ_VOUS, color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.RENDEZ_VOUS] },
    { key: "post_production", label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.POST_PRODUCTION], value: CLIENT_STATUSES.POST_PRODUCTION, color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.POST_PRODUCTION] },
    { key: "installation", label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.INSTALLATION], value: CLIENT_STATUSES.INSTALLATION, color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.INSTALLATION] },
    { key: "resiliation", label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.RESILIATION], value: CLIENT_STATUSES.RESILIATION, color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.RESILIATION] },
    { key: "abandonne", label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.ABANDONNE], value: CLIENT_STATUSES.ABANDONNE, color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.ABANDONNE] }
  ];

  return (
    <div>
      <h3 className="text-base font-medium text-gray-900 mb-3">Filtrer par statut</h3>
      <div className="flex flex-wrap gap-2.5">
        {statusFilters.map((filter) => (
          <Button 
            key={filter.key}
            variant="outline"
            className={`rounded-lg px-4 py-1.5 text-sm font-medium h-auto min-w-[80px] ${
              activeFilter === filter.key 
                ? filter.color.includes('border') ? filter.color : `${filter.color} border-0`
                : "bg-white border border-gray-300 text-gray-700"
            }`}
            onClick={() => handleFilterClick(filter.key, filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
};