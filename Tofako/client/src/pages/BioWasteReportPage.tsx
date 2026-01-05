import { Header } from "@/components/Header";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function BioWasteReportPage() {
  const { selectedFacility } = useSelectedFacility();

  const { data: entriesData, isLoading } = useQuery({
    queryKey: ["bio-waste", selectedFacility],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await fetch(`/api/bio-waste/${selectedFacility}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.entries || [];
    },
    enabled: !!selectedFacility
  });

  const sortedEntries = entriesData ? [...entriesData].reverse().slice(0, 50) : [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="TvorbaBioOdpadu - Kontrola" showBack />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-bold">Prehľad bioodpadu</h2>
          {!selectedFacility && (
            <p className="text-destructive text-center py-8 font-bold">Nie je zvolená prevádzka</p>
          )}
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className=" text-primary w-8 h-8" />
            </div>
          ) : sortedEntries.length > 0 ? (
            <div className="space-y-2">
              {sortedEntries.map((entry, i) => (
                <div key={i} className="bg-muted/50 p-4 rounded-lg border">
                  BioOpad vytvorený za <span className="font-bold">{entry.date}</span> - <span className="font-bold">{entry.amount}</span> <span className="font-bold">{entry.unit}</span>
                </div>
              ))}
            </div>
          ) : selectedFacility && (
            <p className="text-center text-muted-foreground py-8">Žiadne záznamy</p>
          )}
        </div>
      </main>
    </div>
  );
}
