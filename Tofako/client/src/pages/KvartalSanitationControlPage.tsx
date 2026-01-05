import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { useQuery } from "@tanstack/react-query";

interface SanitationEntry {
  date: string;
}

export default function KvartalSanitationControlPage() {
  const { selectedFacility } = useSelectedFacility();

  const { data: history, isLoading: isLoadingHistory } = useQuery<{ entries: SanitationEntry[] }>({
    queryKey: [`/api/sanitation/${selectedFacility}`],
    enabled: !!selectedFacility,
  });

  // Sort and limit to last 50
  const sortedHistory = history?.entries 
    ? [...history.entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const displayHistory = sortedHistory.slice(0, 50);

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Kvartálna sanitácia - Kontrola" showBack />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-display text-primary">
              Kvartálna sanitácia - Kontrola
            </h1>
            {selectedFacility && (
              <p className="text-muted-foreground mt-2">Prevádzka: {selectedFacility}</p>
            )}
          </div>

          <div className="pt-4">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">História záznamov</h2>
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8  text-primary/50" />
              </div>
            ) : displayHistory.length > 0 ? (
              <div className="space-y-3">
                {displayHistory.map((entry, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/50 border border-border shadow-sm">
                    <p className="font-medium text-lg">
                      Kompletná sanitácia celej prevádzky {new Date(entry.date).toLocaleDateString('sk-SK')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Žiadne záznamy nenájdené pre túto prevádzku</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
