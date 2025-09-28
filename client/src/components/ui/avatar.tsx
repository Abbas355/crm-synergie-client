import { cn } from "@/lib/utils";

interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
}

export function Avatar({ className, children }: AvatarProps) {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  return <img src={src} alt={alt} className={cn("aspect-square h-full w-full", className)} />;
}

export function AvatarFallback({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}>
      {children}
    </div>
  );
}