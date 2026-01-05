import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { AlertTriangle, Check } from "lucide-react";

export default function FacilitySelectPage() {
  const [facilities, setFacilities] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tempSelected, setTempSelected] = useState<string>("");
  const { selectedFacility, saveFacility } = useSelectedFacility();

  useEffect(() => {
    async function loadFacilities() {
      try {
        const response = await fetch("/api/facilities");
        if (!response.ok) {
          throw new Error("Failed to load facilities");
        }
        const data = await response.json();
        setFacilities(data.facilities || {});
      } catch (err) {
        setError("Chyba pri načítaní prevádzok");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      setTempSelected(selectedFacility);
    }
  }, [selectedFacility]);

  const handleFacilityChange = (value: string) => {
    setTempSelected(value);
  };

  const handleSave = () => {
    if (tempSelected) {
      saveFacility(tempSelected);
      window.history.back();
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground font-mono">
            Načítavam prevádzky...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Výber prevádzky" showBack />

      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto">
          {error ? (
            <div className="flex gap-2 items-start bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : null}

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Vyber prevádzku:
              </label>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(facilities).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleFacilityChange(key)}
                    className={`relative flex items-center justify-between h-14 px-4 rounded-lg border-2 ${
                      tempSelected === key
                        ? "border-primary bg-primary/10"
                        : "border-input bg-background"
                    }`}
                  >
                    <span className="text-base font-medium">{value}</span>
                    {tempSelected === key && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {tempSelected && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Vybrané:
                </p>
                <p className="text-lg font-semibold text-primary">
                  {facilities[tempSelected] || tempSelected}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={!tempSelected}
                className="w-full h-12"
              >
                Uložiť
              </Button>
              <Button
                onClick={handleBack}
                variant="outline"
                className="w-full h-12"
              >
                Naspäť
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
