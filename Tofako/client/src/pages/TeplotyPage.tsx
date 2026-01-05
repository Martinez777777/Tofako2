import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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

interface TempEntry {
  fridgeNumber: string;
  temperature: string;
  date: string;
  period: "morning" | "evening";
}

interface TeplotyConfig {
  fridgeCount: number;
  range: {
    start: number;
    end: number;
  };
}

export default function TeplotyPage() {
  const { selectedFacility } = useSelectedFacility();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fridgeNumber, setFridgeNumber] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"morning" | "evening">("morning");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showYesterdayCheck, setShowYesterdayCheck] = useState(false);
  const [showTodayCheck, setShowTodayCheck] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'save' | 'auto', period?: "morning" | "evening", bypassToday?: boolean } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Fetch config (fridge count and range)
  const { data: config, isLoading: isLoadingConfig } = useQuery<TeplotyConfig>({
    queryKey: [`/api/temperatures/config/${selectedFacility}`],
    enabled: !!selectedFacility,
  });

  // Fetch history for display
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery<{ entries: TempEntry[] }>({
    queryKey: [`/api/temperatures/${selectedFacility}`],
    enabled: !!selectedFacility,
  });

  // Generate all possible temperatures in range for random selection
  const allTemperaturesInRange = useMemo(() => {
    if (!config?.range) return [];
    const { start, end } = config.range;
    const temps = [];
    for (let t = start; t <= end; t = Math.round((t + 0.1) * 10) / 10) {
      temps.push(t.toFixed(1));
    }
    return temps;
  }, [config?.range]);

  // Display subset of temperatures (sorted)
  const displayTemperatures = useMemo(() => {
    if (allTemperaturesInRange.length === 0) return [];
    const step = Math.max(1, Math.floor(allTemperaturesInRange.length / 20));
    const samples = [];
    for (let i = 0; i < allTemperaturesInRange.length; i += step) {
      samples.push(allTemperaturesInRange[i]);
    }
    if (!samples.includes(allTemperaturesInRange[allTemperaturesInRange.length - 1])) {
      samples.push(allTemperaturesInRange[allTemperaturesInRange.length - 1]);
    }
    return samples.sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [allTemperaturesInRange]);

  const saveMutation = useMutation({
    mutationFn: async (data: TempEntry) => {
      const res = await fetch(`/api/temperatures/${selectedFacility}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      setFridgeNumber("");
      setTemperature("");
      queryClient.invalidateQueries({ queryKey: [`/api/temperatures/${selectedFacility}`] });
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: () => {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    },
  });

  const checkYesterday = (action: { type: 'save' | 'auto', period?: "morning" | "evening", bypassToday?: boolean }) => {
    const yesterday = subDays(date, 1);
    const hasYesterdayData = historyData?.entries.some(entry => 
      isSameDay(new Date(entry.date), yesterday)
    );

    if (!hasYesterdayData) {
      setPendingAction(action);
      setShowYesterdayCheck(true);
      return false;
    }
    return true;
  };

  const handleSave = (bypassCheck: boolean = false, bypassToday: boolean = false) => {
    if (!selectedFacility) {
      toast({
        title: "Chyba",
        description: "Nie je zvolená prevádzka. Prosím, vyberte prevádzku v menu.",
        variant: "destructive",
      });
      return;
    }
    if (!fridgeNumber || !temperature) return;
    
    if (!bypassCheck && !checkYesterday({ type: 'save', bypassToday })) return;

    if (!bypassToday) {
      const hasTodayData = historyData?.entries.some(entry => 
        isSameDay(new Date(entry.date), date) && 
        entry.fridgeNumber === fridgeNumber && 
        entry.period === period
      );
      if (hasTodayData) {
        setPendingAction({ type: 'save', bypassToday: true });
        setShowTodayCheck(true);
        return;
      }
    }

    saveMutation.mutate({
      fridgeNumber,
      temperature,
      date: date.toISOString(),
      period,
    });
  };

  const handleAutoFill = async (autoPeriod: "morning" | "evening", bypassCheck: boolean = false, bypassToday: boolean = false) => {
    if (!selectedFacility) {
      toast({
        title: "Chyba",
        description: "Nie je zvolená prevádzka. Prosím, vyberte prevádzku v menu.",
        variant: "destructive",
      });
      return;
    }
    if (!config) {
      toast({
        title: "Chyba",
        description: "Konfigurácia sa nanačítavala. Skúste to znova.",
        variant: "destructive",
      });
      return;
    }
    if (config.fridgeCount === 0) {
      toast({
        title: "Chyba",
        description: "Počet chladničiek nie je zadaný.",
        variant: "destructive",
      });
      return;
    }
    if (allTemperaturesInRange.length === 0) {
      toast({
        title: "Chyba",
        description: "Teplotný rozsah nie je správne nastavený.",
        variant: "destructive",
      });
      return;
    }

    if (!bypassCheck && !checkYesterday({ type: 'auto', period: autoPeriod, bypassToday })) return;

    if (!bypassToday) {
      const hasTodayData = historyData?.entries.some(entry => 
        isSameDay(new Date(entry.date), date) && 
        entry.period === autoPeriod
      );
      if (hasTodayData) {
        setPendingAction({ type: 'auto', period: autoPeriod, bypassToday: true });
        setShowTodayCheck(true);
        return;
      }
    }
    
    const allNewEntries = [];
    const usedTemperatures = new Set<string>();
    
    for (let i = 0; i < config.fridgeCount; i++) {
      const fridgeNum = (i + 1).toString();
      
      let randomTemp;
      let attempts = 0;
      do {
        randomTemp = allTemperaturesInRange[Math.floor(Math.random() * allTemperaturesInRange.length)];
        attempts++;
      } while (usedTemperatures.has(randomTemp) && attempts < 10 && allTemperaturesInRange.length > config.fridgeCount);
      
      usedTemperatures.add(randomTemp);
      
      allNewEntries.push({
        fridgeNumber: fridgeNum,
        temperature: randomTemp,
        date: date.toISOString(),
        period: autoPeriod,
      });
    }

    try {
      setIsAutoFilling(true);
      // Ukladáme postupne s oneskorením, aby sme predišli konfliktom v databáze
      for (const entry of allNewEntries) {
        const res = await fetch(`/api/temperatures/${selectedFacility}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });

        if (!res.ok) throw new Error(`Failed to save temperature for fridge ${entry.fridgeNumber}`);
        
        // Malé oneskorenie medzi požiadavkami
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setShowSuccess(true);
      setTimeout(() => refetchHistory(), 500);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Auto-fill error:", error);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const sortedHistory = historyData?.entries
    ? [...historyData.entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const fridges = Array.from({ length: config?.fridgeCount || 0 }, (_, i) => (i + 1).toString());

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Teploty" showBack />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-display text-primary">
              Teploty
            </h1>
            {selectedFacility && (
              <p className="text-muted-foreground mt-2">Prevádzka: {selectedFacility}</p>
            )}
          </div>

          <div className="grid gap-6 p-6 rounded-xl border bg-card shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Chladnička č.</label>
              <Select value={fridgeNumber} onValueChange={setFridgeNumber}>
                <SelectTrigger className="h-12 text-lg bg-white">
                  <SelectValue placeholder={isLoadingConfig ? "Načítavam..." : "Vyberte chladničku"} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {fridges.map((num) => (
                    <SelectItem key={num} value={num} className="text-lg">
                      Chladnička č. {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Teplota (°C)</label>
              <Select value={temperature} onValueChange={setTemperature}>
                <SelectTrigger className="h-12 text-lg bg-white">
                  <SelectValue placeholder={isLoadingConfig ? "Načítavam..." : "Vyberte teplotu"} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {displayTemperatures.map((temp, i) => (
                    <SelectItem key={i} value={temp} className="text-lg">
                      {temp} °C
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Čas</label>
              <Select 
                value={period} 
                onValueChange={(val: "morning" | "evening") => setPeriod(val)}
              >
                <SelectTrigger className="h-12 text-lg bg-white">
                  <SelectValue placeholder="Vyberte čas" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="morning" className="text-lg">Ranné teploty</SelectItem>
                  <SelectItem value="evening" className="text-lg">Večerné teploty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Dátum</label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 text-lg bg-white",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {date ? format(date, "PPP", { locale: sk }) : "Vyberte dátum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border shadow-md" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d);
                        setShowDatePicker(false);
                      }
                    }}
                    initialFocus
                    locale={sk}
                    className="bg-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 text-xl font-bold mt-4 shadow-lg shadow-primary/20"
              onClick={() => handleSave(false, false)}
              disabled={saveMutation.isPending || !fridgeNumber || !temperature}
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

            <div className="grid grid-cols-2 gap-4 mt-2">
              <Button
                variant="outline"
                className="h-14 text-sm font-bold bg-white border-primary/20 hover:bg-primary/5 flex items-center justify-center gap-2"
                onClick={() => handleAutoFill("morning", false, false)}
                disabled={isLoadingConfig}
              >
                <Zap className="w-4 h-4 text-primary" />
                Ranné t. auto
              </Button>
              <Button
                variant="outline"
                className="h-14 text-sm font-bold bg-white border-primary/20 hover:bg-primary/5 flex items-center justify-center gap-2"
                onClick={() => handleAutoFill("evening", false, false)}
                disabled={isLoadingConfig}
              >
                <Zap className="w-4 h-4 text-primary" />
                Večerné t. auto
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">História teplôt</h2>
            {isLoadingHistory ? (
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

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md bg-white border shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Úspešne uložené
            </DialogTitle>
            <DialogDescription className="text-lg pt-2 text-foreground">
              Záznamy o teplote boli úspešne uložené do databázy.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowSuccess(false)} size="lg" className="px-8 font-bold">Zatvoriť</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent className="sm:max-w-md bg-white border shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Chyba pri ukladaní
            </DialogTitle>
            <DialogDescription className="text-lg pt-2 text-foreground">
              Nepodarilo sa uložiť záznamy. Skontrolujte prosím pripojenie a skúste to znova.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button variant="destructive" onClick={() => setShowError(false)} size="lg" className="px-8 font-bold">Zatvoriť</Button>
          </div>
        </DialogContent>
      </Dialog>

      <YesterdayCheckDialog
        isOpen={showYesterdayCheck}
        onClose={() => {
          setShowYesterdayCheck(false);
          setPendingAction(null);
        }}
        onContinue={() => {
          setShowYesterdayCheck(false);
          if (pendingAction?.type === 'save') {
            handleSave(true, pendingAction.bypassToday);
          } else if (pendingAction?.type === 'auto' && pendingAction.period) {
            handleAutoFill(pendingAction.period, true, !!pendingAction.bypassToday);
          }
          setPendingAction(null);
        }}
      />

      <TodayCheckDialog
        isOpen={showTodayCheck}
        onClose={() => {
          setShowTodayCheck(false);
          setPendingAction(null);
        }}
        onOverwrite={() => {
          setShowTodayCheck(false);
          if (pendingAction?.type === 'save') {
            handleSave(false, true);
          } else if (pendingAction?.type === 'auto' && pendingAction.period) {
            handleAutoFill(pendingAction.period, false, true);
          }
          setPendingAction(null);
        }}
      />

      {/* Auto-fill Loading Dialog */}
      <Dialog open={isAutoFilling}>
        <DialogContent className="sm:max-w-md bg-white border shadow-lg pointer-events-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-6 w-6  text-primary" />
              ČAKAJTE PROSÍM
            </DialogTitle>
            <DialogDescription className="text-lg pt-2 text-foreground">
              Prebieha automatické ukladanie teplôt pre všetky chladničky...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
