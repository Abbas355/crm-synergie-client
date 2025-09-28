import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// Logo SMG Inline Base64 (utilisé comme fallback)
const SMG_LOGO_BASE64 = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDUwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHN0eWxlPgogICAgLm5hdnkgeyBmaWxsOiAjMUQyNDU2OyB9CiAgICAuYmx1ZSB7IGZpbGw6ICMxOTc4QjU7IH0KICAgIC50ZXh0IHsgZmlsbDogIzE5NzhCNTsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDIwcHg7IGZvbnQtd2VpZ2h0OiBib2xkOyB9CiAgPC9zdHlsZT4KICAgIAogIDwhLS0gU01HIC0tPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUwLCA3MCkiPgogICAgPHBhdGggY2xhc3M9Im5hdnkiIGQ9Ik01MCwxMCBDMzUsMTAgMjUsMjAgMjUsMzAgQzI1LDQ1IDQ1LDQ1IDU1LDUwIEM2NSw1NSA2NSw3MCA1MCw3NSBDMzAsODAgMjAsNjUgMTUsNTUgTDMwLDQ1IEMzMCw1NSA0MCw2NSA1MCw2MCBDNjAsNTUgNTUsNDUgNDUsNDAgQzI1LDMwIDEwLDI1IDEwLDEwIEMxMCwwIDI1LC01IDQwLDUgQzU1LDE1IDU1LDI1IDU1LDI1IEw0MCwzNSBDNDAsMzUgNDAsMjUgMzUsMjAgQzMwLDE1IDI1LDE1IDI1LDIwIEMyNSwyNSAzNSwyNSA1MCwxMCIvPgogICAgPHBhdGggY2xhc3M9ImJsdWUiIGQ9Ik04MCwwIEwxMDAsMCBMMTI1LDQwIEwxNTAsMCBMMTcwLDAgTDE3MCw4MCBMMTUwLDgwIEwxNTAsMzAgTDEyNSw3MCBMMTAwLDMwIEwxMDAsODAgTDgwLDgwIFoiLz4KICAgIDxwYXRoIGNsYXNzPSJuYXZ5IiBkPSJNMjUwLDEwIEMyMzUsMCAyMTAsMCAyMDAsMTUgQzE5MCwzMCAxOTAsNTAgMjEwLDY1IEMyMzAsODAgMjYwLDcwIDI3MCw1MCBMMjcwLDMwIEwyMjAsMzAgTDIyMCw1MCBMMjQ1LDUwIEMyMzUsNjAgMjE1LDYwIDIwNSw1MCBDMTk1LDQwIDIwNSwyMCAyMTUsMTUgQzIyNSwxMCAyMzUsMTUgMjQ1LDI1IEwyNjAsMTAgQzI0MCwtNSAyMTAsLTUgMTk1LDEwIEMxODAsMjUgMTgwLDU1IDIwMCw3MCBDMjIwLDg1IDI1NSw4MCAyNzAsNTAgTDI3MCwwIEwyMTAsMCBMMjEwLDEwIFoiLz4KICA8L2c+CiAgPHRleHQgeD0iMjUwIiB5PSIxNjAiIGNsYXNzPSJ0ZXh0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TWU5FUkdJRSBNQVJLRVRJTkcgR1JPVVA8L3RleHQ+Cjwvc3ZnPg==`;

interface SMGLogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: "default" | "auth" | "header" | "small";
}

export function SmgLogo({ 
  className, 
  width = 200, 
  height = 80, 
  variant = "default" 
}: SMGLogoProps) {
  // Récupérer le logo personnalisé pour tous les variants
  const { data: logoData } = useQuery<{logoUrl: string, description: string}>({
    queryKey: ["/api/settings/logo"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/settings/logo");
        if (!response.ok) {
          return null;
        }
        return response.json();
      } catch (error) {
        console.error("Erreur lors de la récupération du logo:", error);
        return null;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Utiliser le logo personnalisé s'il existe, sinon utiliser le logo par défaut
  const logoSrc = logoData?.logoUrl || SMG_LOGO_BASE64;

  // Pour la page d'authentification, afficher le logo avec styling simple
  if (variant === "auth") {
    return (
      <img 
        src={logoSrc}
        alt="Synergie Marketing Group" 
        className={cn(
          "object-contain mx-auto",
          className
        )}
      />
    );
  }
  
  // Différentes classes en fonction de la variante
  const variantClasses = {
    default: "",
    auth: "", // Non utilisé maintenant
    header: "h-20 w-auto max-w-[180px]",
    small: "h-6 w-auto max-w-[80px]"
  };
  
  return (
    <div className={cn(variantClasses[variant], className)}>
      <img 
        src={logoSrc}
        alt="Synergie Marketing Group" 
        className={cn(
          "object-contain",
          variant === "header" && "h-20 w-auto max-w-[180px]",
          variant === "small" && "h-6 w-auto max-w-[80px]",
          variant === "default" && "max-w-full h-auto"
        )}
      />
    </div>
  );
}