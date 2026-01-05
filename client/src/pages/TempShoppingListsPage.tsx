import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { AlertTriangle, ChevronRight } from "lucide-react";

export default function TempShoppingListsPage() {
  const [facilities, setFacilities] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const loadFacilities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/temp-shopping-lists/facilities");
        if (!response.ok) {
          throw new Error("Failed to load facilities");
        }
        const data = await response.json();
        setFacilities(data.facilities || {});
      } catch (err) {
        console.error("Error loading temp shopping list facilities:", err);
        setError("Nie je možné načítať zoznam prevádzok");
      } finally {
        setIsLoading(false);
      }
    };

    loadFacilities();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Dočasné NZ" showBack />
        <div className="container mx-auto px-4 pt-12 text-center">
          <div className=" w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Dočasné NZ" showBack />
        <div className="container mx-auto px-4 pt-12 flex flex-col items-center text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold">{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Dočasné NZ" showBack />

      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3">
            {Object.entries(facilities).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Žiadne prevádzky v dočasných zoznamoch
              </p>
            ) : (
              Object.entries(facilities).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => navigate(`/temp-shopping-lists/${key}`)}
                  className="w-full flex items-center justify-between h-14 px-4 rounded-lg border border-input bg-card hover:bg-accent/50 hover:border-primary/50 "
                >
                  <span className="text-base font-medium">{value}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
