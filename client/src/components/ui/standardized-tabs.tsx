import React from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList as OriginalTabsList, TabsTrigger as OriginalTabsTrigger, TabsContent } from "@/components/ui/tabs";

interface StandardizedTabsListProps extends React.ComponentProps<typeof OriginalTabsList> {
  variant?: "default" | "orange" | "blue" | "gradient";
}

interface StandardizedTabsTriggerProps extends React.ComponentProps<typeof OriginalTabsTrigger> {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "orange" | "blue" | "gradient";
}

const StandardizedTabsList = React.forwardRef<
  React.ElementRef<typeof OriginalTabsList>,
  StandardizedTabsListProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "bg-white/70 backdrop-blur-lg border border-white/20 shadow-lg rounded-2xl p-2 gap-2",
    orange: "bg-gradient-to-r from-orange-50/90 to-yellow-50/90 backdrop-blur-md border border-orange-200/60 shadow-xl rounded-2xl p-2 gap-2",
    blue: "bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-md border border-blue-200/60 shadow-xl rounded-2xl p-2 gap-2",
    gradient: "bg-gradient-to-r from-slate-50/90 to-gray-50/90 backdrop-blur-md border border-gray-200/60 shadow-xl rounded-2xl p-2 gap-2"
  };

  return (
    <OriginalTabsList
      ref={ref}
      className={cn(variantStyles[variant], className)}
      {...props}
    />
  );
});

const StandardizedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof OriginalTabsTrigger>,
  StandardizedTabsTriggerProps
>(({ className, icon, children, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: cn(
      "group flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-xl",
      "bg-white/40 backdrop-blur-sm border border-white/30",
      "transition-all duration-300 ease-in-out",
      "hover:bg-white/70 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5",
      "data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600",
      "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/25",
      "data-[state=active]:scale-105 data-[state=active]:-translate-y-1",
      "data-[state=active]:border-blue-300"
    ),
    orange: cn(
      "group flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-xl",
      "bg-white/40 backdrop-blur-sm border border-white/30",
      "transition-all duration-300 ease-in-out",
      "hover:bg-white/70 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5",
      "data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:via-orange-400 data-[state=active]:to-yellow-500",
      "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/25",
      "data-[state=active]:scale-105 data-[state=active]:-translate-y-1",
      "data-[state=active]:border-orange-300"
    ),
    blue: cn(
      "group flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-xl",
      "bg-white/40 backdrop-blur-sm border border-white/30",
      "transition-all duration-300 ease-in-out",
      "hover:bg-white/70 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5",
      "data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600",
      "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/25",
      "data-[state=active]:scale-105 data-[state=active]:-translate-y-1",
      "data-[state=active]:border-blue-300"
    ),
    gradient: cn(
      "group flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-xl",
      "bg-white/40 backdrop-blur-sm border border-white/30",
      "transition-all duration-300 ease-in-out",
      "hover:bg-white/70 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5",
      "data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-600 data-[state=active]:to-slate-700",
      "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-gray-500/25",
      "data-[state=active]:scale-105 data-[state=active]:-translate-y-1",
      "data-[state=active]:border-gray-300"
    )
  };

  return (
    <OriginalTabsTrigger
      ref={ref}
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {icon && (
        <span className="group-hover:scale-110 transition-transform duration-300">
          {icon}
        </span>
      )}
      <span className="font-semibold leading-tight text-center">
        {children}
      </span>
    </OriginalTabsTrigger>
  );
});

StandardizedTabsList.displayName = "StandardizedTabsList";
StandardizedTabsTrigger.displayName = "StandardizedTabsTrigger";

export { Tabs, StandardizedTabsList, StandardizedTabsTrigger, TabsContent };