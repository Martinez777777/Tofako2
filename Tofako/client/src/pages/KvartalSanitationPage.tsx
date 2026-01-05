import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Save, Check, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { YesterdayCheckDialog } from "@/components/YesterdayCheckDialog";
import { TodayCheckDialog } from "@/components/TodayCheckDialog";
import { subDays, isSameDay } from "date-fns";

interface SanitationEntry {
  date: string;
}

export default function KvartalSanitationPage() {
  const { selectedFacility } = useSelectedFacility();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showYesterdayCheck, setShowYesterdayCheck] = useState(false);
  const [showTodayCheck, setShowTodayCheck] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: history, isLoading: isLoadingHistory } = useQuery<{ entries: SanitationEntry[] }>({
    queryKey: [`/api/sanitation/${selectedFacility}`],
    enabled: !!selectedFacility,
  });

  const mutation = useMutation({
    mutationFn: async (newDate: string) => {
      if (!selectedFacility) {
        throw new Error("Nie je zvolená prevádzka");
      }
      const response = await fetch(`/api/sanitation/${selectedFacility}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Chyba pri ukladaní");
      }
      return response.json();
    },
    onSuccess: () => {
      setShowSuccessDialog(true);
      queryClient.invalidateQueries({ queryKey: [`/api/sanitation/${selectedFacility}`] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setShowErrorDialog(true);
    },
  });

  // Auto-close dialogs after 10 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSuccessDialog || showErrorDialog) {
      timer = setTimeout(() => {
        setShowSuccessDialog(false);
        setShowErrorDialog(false);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [showSuccessDialog, showErrorDialog]);

  const handleSave = (bypassCheck: boolean = false, bypassToday: boolean = false) => {
    const selectedDate = new Date(date);
    if (!bypassCheck) {
      const yesterday = subDays(selectedDate, 1);
      const hasYesterdayData = history?.entries.some(entry => 
        isSameDay(new Date(entry.date), yesterday)
      );

      if (!hasYesterdayData) {
        setShowYesterdayCheck(true);
        return;
      }
    }

    if (!bypassToday) {
      const hasTodayData = history?.entries.some(entry => 
        isSameDay(new Date(entry.date), selectedDate)
      );
      if (hasTodayData) {
        setShowTodayCheck(true);
        return;
      }
    }
    mutation.mutate(date);
  };

  // Sort and limit to last 50
  const sortedHistory = history?.entries 
    ? [...history.entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const displayHistory = sortedHistory.slice(0, 50);

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Kvartálna sanitácia" showBack />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-display text-primary">
              Kvartálna sanitácia
            </h1>
            {selectedFacility && (
              <p className="text-muted-foreground mt-2">Prevádzka: {selectedFacility}</p>
            )}
          </div>

          <div className="p-6 rounded-xl border border-input bg-card shadow-sm">
            <label className="block text-sm font-medium mb-3">Vyberte dátum sanitácie</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base focus:ring-2 focus:ring-primary focus:border-transparent "
            />
          </div>

          <Button 
            onClick={() => handleSave(false, false)}
            disabled={mutation.isPending}
            className="w-full h-14 text-lg font-semibold shadow-lg  active:scale-[0.98]"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 " />
                Ukladám...
              </>
            ) : (
              <>
                <Save className="mr-2 h-6 w-6" />
                Uložiť
              </>
            )}
          </Button>

          {/* History Section */}
          <div className="pt-8">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Posledné záznamy</h2>
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8  text-primary/50" />
              </div>
            ) : displayHistory.length > 0 ? (
              <div className="space-y-3">
                {displayHistory.map((entry, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="font-medium">
                      Kompletná sanitácia celej prevádzky {new Date(entry.date).toLocaleDateString('sk-SK')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Žiadne záznamy nenájdené</p>
            )}
          </div>
        </div>
      </main>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">Uložené!</DialogTitle>
            <p className="text-center text-muted-foreground text-lg">
              Kvartálna sanitácia sa uložila.
            </p>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="w-full h-12 text-base mt-4"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-10 h-10 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">Chyba!</DialogTitle>
            <p className="text-center text-muted-foreground text-lg">
              Kvartálna sanitácia sa neuložila.
            </p>
            {errorMessage && (
              <p className="text-center text-destructive text-sm mt-1">{errorMessage}</p>
            )}
            <Button
              onClick={() => setShowErrorDialog(false)}
              className="w-full h-12 text-base mt-4"
              variant="destructive"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <YesterdayCheckDialog
        isOpen={showYesterdayCheck}
        onClose={() => setShowYesterdayCheck(false)}
        onContinue={() => {
          setShowYesterdayCheck(false);
          handleSave(true, false);
        }}
      />

      <TodayCheckDialog
        isOpen={showTodayCheck}
        onClose={() => setShowTodayCheck(false)}
        onOverwrite={() => {
          setShowTodayCheck(false);
          handleSave(false, true);
        }}
      />
    </div>
  );
}
