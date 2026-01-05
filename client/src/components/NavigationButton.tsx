import { Link } from "wouter";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export function NavigationButton({ 
  label, 
  href, 
  onClick, 
  icon: Icon, 
  variant = "primary",
  className 
}: NavigationButtonProps) {
  
  const baseClasses = "relative w-full p-6 md:p-8 rounded-xl shadow-lg border-2 flex flex-col items-center justify-center gap-4 text-center group overflow-hidden";
  
  const variants = {
    primary: "bg-primary border-primary/20 text-primary-foreground",
    secondary: "bg-white dark:bg-card border-border text-foreground",
    outline: "bg-transparent border-dashed border-muted-foreground/30 text-muted-foreground",
  };

  const content = (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <span className="text-xl md:text-2xl font-bold font-display tracking-tight z-10">
        {label}
      </span>
      
      {/* Decorative corner accent */}
      <div className={cn(
        "absolute top-0 right-0 w-16 h-16 opacity-10 -mr-8 -mt-8 rotate-45 transform",
        variant === "primary" ? "bg-white" : "bg-primary"
      )} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={cn(baseClasses, variants[variant], className)} onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cn(baseClasses, variants[variant], className)}>
      {content}
    </button>
  );
}
