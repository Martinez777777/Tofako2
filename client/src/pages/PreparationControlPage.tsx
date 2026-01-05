import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { useQuery } from "@tanstack/react-query";

interface PreparationEntry {
  date: string;
  time: string;
  item: string;
}

export default function PreparationControlPage() {
  const { selectedFacility } = useSelectedFacility();

  // Fetch history for selected facility
  const { data: history = [], isLoading: isLoadingHistory } = useQuery<{ entries: PreparationEntry[] }>({
    queryKey: [`/api/preparation/${selectedFacility}`],
    enabled: !!selectedFacility,
  });

  const sortedHistory = Array.isArray(history?.entries) ? [...history.entries].reverse().slice(0, 50) : [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Príprava - Kontrola" showBack />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-center text-foreground">Príprava krájane veci - Kontrola</h1>
          
          <div className="space-y-4">
            <div className="space-y-2">
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <Loader2 className=" mx-auto h-8 w-8 text-muted-foreground" />
                </div>
              ) : sortedHistory.length > 0 ? (
                sortedHistory.map((entry, index) => (
                  <div key={index} className="bg-card border rounded-lg p-3 text-sm shadow-sm">
                    <div className="grid grid-cols-1 gap-1">
                      <p><span className="font-medium text-muted-foreground">Dátum:</span> {entry.date}</p>
                      <p><span className="font-medium text-muted-foreground">Čas:</span> {entry.time}</p>
                      <p><span className="font-medium text-muted-foreground">Položka:</span> {entry.item}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Žiadne záznamy nenájdené.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
