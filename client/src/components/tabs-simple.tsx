import React from "react";

interface TabsSimpleProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export function TabsSimple({ tabs, activeTab, setActiveTab }: TabsSimpleProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 mb-4 sm:mb-6">
      <div className="flex w-full overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`px-4 py-3 sm:py-2 cursor-pointer whitespace-nowrap text-sm sm:text-base flex-shrink-0 min-w-0 flex-1 sm:flex-initial rounded-lg transition-all duration-200 font-medium ${
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-lg" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}