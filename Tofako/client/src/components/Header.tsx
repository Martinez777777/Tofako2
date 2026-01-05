import { Link, useLocation } from "wouter";
import { ArrowLeft, Menu as MenuIcon, Factory } from "lucide-react";

export function Header({ title, showBack = false }: { title: string; showBack?: boolean }) {
  const [_, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-center relative">
        <div className="absolute left-4">
          {showBack && (
            <button 
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
        </div>
        
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground tracking-tight leading-none">
            Tofako
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium mt-1">
            by Martin Gašpar
          </p>
        </div>
      </div>
    </header>
  );
}
