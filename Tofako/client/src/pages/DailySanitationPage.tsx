import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { YesterdayCheckDialog } from "@/components/YesterdayCheckDialog";
import { TodayCheckDialog } from "@/components/TodayCheckDialog";
import { subDays, isSameDay } from "date-fns";

interface HistoryEntry {
  date: string;
  text: string;
}

export default function DailySanitationPage() {
  const { selectedFacility } = useSelectedFacility();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showYesterdayCheck, setShowYesterdayCheck] = useState(false);
  const [showTodayCheck, setShowTodayCheck] = useState(false);

  // Fetch static text from database
  const { data: textData, isLoading: isLoadingText } = useQuery<{ text: string }>({
    queryKey: [`/api/daily-sanitation/text/${selectedFacility}`],
    enabled: !!selectedFacility,
  });

  // Fetch history for display
  const { data: historyData, isLoading: isLoadingHistory } = useQuery<{ entries: HistoryEntry[] }>({
    queryKey: [`/api/daily-sanitation/${selectedFacility}`],
    enabled: !!selectedFacility,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { date: string, text: string }) => {
      const res = await fetch(`/api/daily-sanitation/${selectedFacility}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: [`/api/daily-sanitation/${selectedFacility}`] });
      setTimeout(() => setShowSuccess(false), 10000);
    },
    onError: () => {
      setShowError(true);
      setTimeout(() => setShowError(false), 10000);
    },
  });

  const handleSave = (bypassCheck = false, bypassToday = false) => {
    if (!selectedFacility || !textData?.text) return;

    if (!bypassCheck) {
      const yesterday = subDays(date, 1);
      const hasYesterdayData = historyData?.entries.some(entry => 
        isSameDay(new Date(entry.date), yesterday)
      );

      if (!hasYesterdayData) {
        setShowYesterdayCheck(true);
        return;
      }
    }

    if (!bypassToday) {
      const hasTodayData = historyData?.entries.some(entry => 
        isSameDay(new Date(entry.date), date)
      );
      if (hasTodayData) {
        setShowTodayCheck(true);
        return;
      }
    }

    saveMutation.mutate({
      date: date.toISOString(),
      text: textData.text,
    });
  };

  const sortedHistory = historyData?.entries
    ? [...historyData.entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Denná Sanitácia" showBack />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-display text-primary">
              Denná Sanitácia
            </h1>
            {selectedFacility && (
              <p className="text-muted-foreground mt-2">Prevádzka: {selectedFacility}</p>
            )}
          </div>

          <div className="grid gap-6 p-6 rounded-xl border bg-card shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dátum</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 text-lg",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {date ? format(date, "PPP", { locale: sk }) : "Vyberte dátum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    locale={sk}
                    className="bg-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Text z databázy</label>
              <div className="p-4 rounded-md bg-muted min-h-[100px] flex items-center justify-center border">
                {isLoadingText ? (
                  <Loader2 className="w-6 h-6  text-primary/50" />
                ) : (
                  <p className="text-lg italic text-foreground/80">
                    {textData?.text || "Text nebol nájdený v databáze"}
                  </p>
                )}
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 text-xl font-bold"
              onClick={() => handleSave(false)}
              disabled={saveMutation.isPending || !textData?.text || !selectedFacility}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 " />
                  Ukladám...
                </>
              ) : (
                "Uložiť"
              )}
            </Button>
          </div>

          <div className="pt-4">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">História záznamov</h2>
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8  text-primary/50" />
              </div>
            ) : sortedHistory.length > 0 ? (
              <div className="space-y-3">
                {sortedHistory.slice(0, 50).map((entry, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-primary">
                        {format(new Date(entry.date), "dd.MM.yyyy", { locale: sk })}
                      </span>
                    </div>
                    <p className="text-muted-foreground italic">{entry.text}</p>
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
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Úspešne uložené
            </DialogTitle>
            <DialogDescription className="text-lg pt-2">
              Záznam o dennej sanitácii bol úspešne uložený do databázy.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowSuccess(false)}>Zatvoriť</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Chyba pri ukladaní
            </DialogTitle>
            <DialogDescription className="text-lg pt-2">
              Nepodarilo sa uložiť záznam. Skontrolujte prosím pripojenie a skúste to znova.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button variant="destructive" onClick={() => setShowError(false)}>Zatvoriť</Button>
          </div>
        </DialogContent>
      </Dialog>

      <YesterdayCheckDialog
        isOpen={showYesterdayCheck}
        onClose={() => setShowYesterdayCheck(false)}
        onContinue={() => {
          setShowYesterdayCheck(false);
          handleSave(true);
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
