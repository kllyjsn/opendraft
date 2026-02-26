import { BrandMascot } from "@/components/BrandMascot";

interface MascotLoaderProps {
  message?: string;
  size?: number;
  className?: string;
}

export function MascotLoader({ message = "Loading…", size = 100, className = "" }: MascotLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-16 ${className}`}>
      <BrandMascot size={size} variant="thinking" />
      <p className="text-sm text-muted-foreground font-medium animate-pulse">{message}</p>
    </div>
  );
}
