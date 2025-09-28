import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface SimCardStatProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: "blue" | "green" | "orange" | "purple" | "red";
  colorText?: boolean; // Nouvelle prop pour colorer le texte
}

const iconColorVariants = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  orange: "bg-orange-50 text-orange-700",
  purple: "bg-purple-50 text-purple-700",
  red: "bg-red-50 text-red-700",
};

const textColorVariants = {
  blue: "text-blue-600",
  green: "text-green-600",
  orange: "text-orange-600",
  purple: "text-purple-600",
  red: "text-red-600",
};

export function SimCardStat({ title, value, icon, color, colorText = false }: SimCardStatProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className={`text-4xl font-bold ${colorText ? textColorVariants[color] : ""}`}>
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-full ${iconColorVariants[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}