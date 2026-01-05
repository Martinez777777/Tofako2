import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useRoute } from "wouter";
import { AlertTriangle } from "lucide-react";

interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number | string;
}

export default function TempShoppingListItemsPage() {
  const [_, params] = useRoute("/temp-shopping-lists/:facilityId");
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [date, setDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const facilityId = params?.facilityId as string;

  useEffect(() => {
    const loadItems = async () => {
      if (!facilityId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/temp-shopping-lists/${facilityId}`);
        if (!response.ok) {
          throw new Error("Failed to load items");
        }
        const data = await response.json();
        
        const itemsData = data.items || {};
        let loadedDate = "";
        let itemsArray: ShoppingItem[] = [];
        
        if (typeof itemsData === 'object' && itemsData.items && Array.isArray(itemsData.items)) {
          itemsArray = itemsData.items;
          loadedDate = itemsData.date || "";
        } else if (Array.isArray(itemsData)) {
          itemsArray = itemsData;
        }
        
        setItems(itemsArray);
        setDate(loadedDate);
      } catch (err) {
        console.error("Error loading temp shopping list items:", err);
        setError("Nie je možné načítať položky");
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [facilityId]);

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
    <div className="min-h-screen bg-background pb-24">
      <Header title={facilityId} showBack />

      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3">
            <div className="text-center mb-4">
              <p className="text-xl font-bold font-display text-primary">
                Dočasná Prevádzka: {facilityId}
              </p>
            </div>

            {date && (
              <div className="p-4 rounded-lg border border-input bg-card mb-4">
                <p className="text-sm font-medium text-muted-foreground">Dátum uloženia:</p>
                <p className="text-lg font-semibold">{date}</p>
              </div>
            )}

            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Žiadne položky v dočasnom zozname
              </p>
            ) : (
              items.map((item, index) => {
                const isFirstItem = index === 0;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-input bg-card"
                  >
                    <div className={isFirstItem ? "block" : "flex items-center justify-between gap-4"}>
                      <span className="font-medium text-base break-words">{item.name}</span>
                      {item.quantity !== undefined && (
                        isFirstItem ? (
                          <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded mt-2 whitespace-pre-wrap break-words">
                            {item.quantity}
                          </div>
                        ) : (
                          <span className="text-base font-medium text-primary bg-primary/10 px-3 py-1 rounded">
                            {item.quantity}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
