import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

interface TempEntry {
  fridgeNumber: string;
  temperature: string;
  date: string;
  period: "morning" | "evening";
}

export default function TeplotyControlPage() {
  const { selectedFacility } = useSelectedFacility();

  const { data: historyData, isLoading } = useQuery<{ entries: TempEntry[] }>({
    queryKey: [`/api/temperatures/${selectedFacility}`],
    enabled: !!selectedFacility,
  });

  const sortedHistory = historyData?.entries
    ? [...historyData.entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Teploty - Kontrola" showBack />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-display text-primary">
              Teploty - Kontrola
            </h1>
            {selectedFacility && (
              <p className="text-muted-foreground mt-2">Prevádzka: {selectedFacility}</p>
            )}
          </div>

          <div className="pt-4">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">História teplôt</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8  text-primary/50" />
              </div>
            ) : sortedHistory.length > 0 ? (
              <div className="space-y-3">
                {sortedHistory.slice(0, 100).map((entry, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">
                        {format(new Date(entry.date), "dd.MM.yyyy", { locale: sk })} - {entry.period === "morning" ? "Ranná" : "Večerná"}
                      </span>
                      <span className="text-lg font-semibold">{entry.temperature} °C</span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Chladnička č. {entry.fridgeNumber}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 italic">Žiadne záznamy nenájdené</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
