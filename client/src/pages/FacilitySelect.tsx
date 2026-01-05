import { Header } from "@/components/Header";
import { Factory } from "lucide-react";

export default function FacilitySelect() {

  // TODO: Load facilities from Firebase
  const facilities = [
    { id: 1, name: "Košice" },
    { id: 2, name: "Sečovce" },
    { id: 3, name: "Prešov" },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Výber prevádzky" showBack />

      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {facilities.map((facility) => (
              <button
                key={facility.id}
                onClick={() => window.location.href = `/facility/${facility.id}`}
                className="relative h-32 md:h-48 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5  group overflow-hidden"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Factory className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-semibold text-foreground">
                    {facility.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
