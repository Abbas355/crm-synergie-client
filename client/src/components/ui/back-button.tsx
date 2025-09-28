import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  className?: string;
  onClick?: () => void;
}

export function BackButton({ className, onClick }: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.history.back();
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} className={className}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Retour
    </Button>
  );
}