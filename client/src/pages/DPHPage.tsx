import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Loader2, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { sk } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { YesterdayCheckDialog } from "@/components/YesterdayCheckDialog";
import { TodayCheckDialog } from "@/components/TodayCheckDialog";
import React, { useState, useEffect, useRef } from "react";

export default function DPHPage() {
  const isMounted = useRef(true);
  const { selectedFacility } = useSelectedFacility();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // DPH fields
  const [dph5Zaklad, setDph5Zaklad] = useState("");
  const [dph5Dan, setDph5Dan] = useState("");
  const [dph19Zaklad, setDph19Zaklad] = useState("");
  const [dph19Dan, setDph19Dan] = useState("");
  const [dph0Zaklad, setDph0Zaklad] = useState("");
  const [dph23Zaklad, setDph23Zaklad] = useState("");
  const [dph23Dan, setDph23Dan] = useState("");
  const [kreditnaKarta, setKreditnaKarta] = useState("");
  const [trzbaSpolu, setTrzbaSpolu] = useState("");
  
  // Bottom fields
  const [prevadzka, setPrevadzka] = useState("");
  const [dkp, setDkp] = useState("");

  const [popup, setPopup] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({
    isOpen: false,
    type: 'success',
    message: '',
  });

  const [showYesterdayCheck, setShowYesterdayCheck] = useState(false);
  const [showTodayCheck, setShowTodayCheck] = useState(false);
  const [showMissingDaysCheck, setShowMissingDaysCheck] = useState(false);
  const [missingDays, setMissingDays] = useState<string[]>([]);

  useEffect(() => {
    if (selectedFacility && isMounted.current) {
      setPrevadzka(selectedFacility);
      const savedDkp = localStorage.getItem(`dkp_${selectedFacility}`);
      if (savedDkp) {
        setDkp(savedDkp);
      } else {
        setDkp("");
      }
    }
  }, [selectedFacility]);

  useEffect(() => {
    if (selectedFacility && dkp && isMounted.current) {
      localStorage.setItem(`dkp_${selectedFacility}`, dkp);
    }
  }, [dkp, selectedFacility]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (popup.isOpen && isMounted.current) {
      timeout = setTimeout(() => {
        if (isMounted.current) {
          setPopup(prev => ({ ...prev, isOpen: false }));
        }
      }, 10000);
    }
    return () => clearTimeout(timeout);
  }, [popup.isOpen]);

  const showPopup = (type: 'success' | 'error', message: string) => {
    if (isMounted.current) {
      setPopup({ isOpen: true, type, message });
    }
  };

  const { data: historyData } = useQuery({
    queryKey: [`/api/dph/history/${selectedFacility}`],
    enabled: !!selectedFacility,
    queryFn: async () => {
      const res = await fetch(`/api/dph/history/${selectedFacility}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    }
  });
  const history = historyData?.entries || [];

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/dph/${selectedFacility}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/dph/history/${selectedFacility}`] });
      showPopup('success', 'DPH uložené');
      // Reset fields after success
      setDph5Zaklad("");
      setDph5Dan("");
      setDph19Zaklad("");
      setDph19Dan("");
      setDph0Zaklad("");
      setDph23Zaklad("");
      setDph23Dan("");
      setKreditnaKarta("");
      setTrzbaSpolu("");
    },
    onError: (error: any) => {
      showPopup('error', error.message || "Chyba pri ukladaní");
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      showPopup('success', 'Čakaj pracujem');
      const res = await fetch(`/api/dph/export/${selectedFacility}`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Export failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/dph/history/${selectedFacility}`] });
      showPopup('success', 'Mesiac úspešne ukončený');
    },
    onError: (error: any) => {
      showPopup('error', error.message || "Chyba pri exporte");
    },
  });

  const handleExport = (bypassMissingCheck: boolean = false) => {
    if (!selectedFacility) {
      showPopup('error', 'Nie je zvolená prevádzka');
      return;
    }

    if (history.length === 0) {
      showPopup('error', 'Žiadne dáta na export');
      return;
    }

    if (!bypassMissingCheck) {
      // Get all dates from history
      const historyDates = history.map((e: any) => e.datum);
      if (historyDates.length > 0) {
        // Find the month we are exporting (from the latest entry)
        const latestDate = new Date(historyDates.sort().reverse()[0]);
        const year = latestDate.getFullYear();
        const month = latestDate.getMonth();
        
        // Calculate total days in that month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Find missing days
        const missing: string[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = format(new Date(year, month, day), "yyyy-MM-dd");
          if (!historyDates.includes(dateStr)) {
            missing.push(format(new Date(year, month, day), "dd.MM.yyyy"));
          }
        }

        if (missing.length > 0) {
          setMissingDays(missing);
          setShowMissingDaysCheck(true);
          return;
        }
      }
    }

    exportMutation.mutate();
  };

  const handleSave = (bypassCheck: boolean = false, bypassToday: boolean = false) => {
    if (!selectedFacility) {
      showPopup('error', 'Nie je zvolená prevádzka');
      return;
    }

    const v5z = parseFloat(dph5Zaklad) || 0;
    const v5d = parseFloat(dph5Dan) || 0;
    const v19z = parseFloat(dph19Zaklad) || 0;
    const v19d = parseFloat(dph19Dan) || 0;
    const v0z = parseFloat(dph0Zaklad) || 0;
    const v23z = parseFloat(dph23Zaklad) || 0;
    const v23d = parseFloat(dph23Dan) || 0;
    const total = parseFloat(trzbaSpolu) || 0;

    const calculatedTotal = Number((v5z + v5d + v19z + v19d + v0z + v23z + v23d).toFixed(2));
    
    if (calculatedTotal !== total) {
      showPopup('error', 'Máš CHYBU! Oprav to a ulož ešte raz');
      return;
    }

    const datumStr = format(date, "yyyy-MM-dd");

    if (!bypassCheck && !bypassToday) {
      const yesterday = subDays(date, 1);
      const hasYesterdayData = history.some((entry: any) => 
        entry.datum === format(yesterday, "yyyy-MM-dd")
      );

      if (!hasYesterdayData && history.length > 0) {
        const minDate = history.reduce((min: string, e: any) => e.datum < min ? e.datum : min, history[0].datum);
        if (datumStr > minDate) {
          setShowYesterdayCheck(true);
          return;
        }
      }
    }

    if (!bypassToday) {
      const hasTodayData = history.some((entry: any) => 
        entry.datum === datumStr
      );
      if (hasTodayData) {
        setShowTodayCheck(true);
        return;
      }
    }

    saveMutation.mutate({
      datum: datumStr,
      dph5Zaklad: v5z,
      dph5Dan: v5d,
      dph19Zaklad: v19z,
      dph19Dan: v19d,
      dph0Zaklad: v0z,
      dph23Zaklad: v23z,
      dph23Dan: v23d,
      kreditnaKarta: parseFloat(kreditnaKarta) || 0,
      trzbaSpolu: total,
      prevadzkaName: prevadzka,
      dkp: dkp,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="DPH" showBack />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-display text-primary uppercase">
              DPH
            </h1>
          </div>

          <div className="grid gap-6 p-6 rounded-xl border bg-card shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase">Dátum</label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 text-lg bg-white shadow-sm",
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">5% Základ DPH</label>
                <Input type="number" step="0.01" value={dph5Zaklad} onChange={(e) => setDph5Zaklad(e.target.value)} className="h-12 text-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">5% Daň DPH</label>
                <Input type="number" step="0.01" value={dph5Dan} onChange={(e) => setDph5Dan(e.target.value)} className="h-12 text-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">19% Základ DPH</label>
                <Input type="number" step="0.01" value={dph19Zaklad} onChange={(e) => setDph19Zaklad(e.target.value)} className="h-12 text-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">19% Daň DPH</label>
                <Input type="number" step="0.01" value={dph19Dan} onChange={(e) => setDph19Dan(e.target.value)} className="h-12 text-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">0% Základ DPH</label>
                <Input type="number" step="0.01" value={dph0Zaklad} onChange={(e) => setDph0Zaklad(e.target.value)} className="h-12 text-lg" />
              </div>
              <div className="space-y-2 md:col-start-1">
                <label className="text-sm font-medium text-muted-foreground">23% Základ DPH</label>
                <Input type="number" step="0.01" value={dph23Zaklad} onChange={(e) => setDph23Zaklad(e.target.value)} className="h-12 text-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">23% Daň DPH</label>
                <Input type="number" step="0.01" value={dph23Dan} onChange={(e) => setDph23Dan(e.target.value)} className="h-12 text-lg" />
              </div>
              <div className="space-y-2 md:col-span-2 pt-2">
                <label className="text-sm font-medium text-muted-foreground font-bold">Kreditná karta</label>
                <Input type="number" step="0.01" value={kreditnaKarta} onChange={(e) => setKreditnaKarta(e.target.value)} className="h-12 text-lg border-primary/30" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground font-bold">Tržba spolu</label>
                <Input type="number" step="0.01" value={trzbaSpolu} onChange={(e) => setTrzbaSpolu(e.target.value)} className="h-12 text-lg border-primary font-bold" />
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <Button 
                size="lg" 
                className="w-full h-14 text-xl font-bold shadow-lg"
                onClick={() => handleSave(false, false)}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="" /> : "Uložiť deň"}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full h-14 text-xl font-bold border-destructive text-destructive hover:bg-destructive/5"
                onClick={() => handleExport(false)}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? <Loader2 className="" /> : "Koniec mesiaca"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase">Prevádzka</label>
                <Input value={prevadzka} readOnly className="h-12 text-lg bg-muted" placeholder="Názov prevádzky" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase">DKP</label>
                <Input value={dkp} onChange={(e) => setDkp(e.target.value)} className="h-12 text-lg" placeholder="Zadajte DKP" />
              </div>
            </div>

            <div className="pt-8 border-t space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-display text-primary uppercase">História záznamov</h2>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground uppercase">Tržba za mesiac</p>
                  <p className="text-2xl font-bold text-primary">
                    {history.reduce((sum: number, entry: any) => sum + (entry.trzbaSpolu || 0), 0).toFixed(2)} €
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Dátum</th>
                      <th className="px-4 py-3 font-medium text-right">Tržba Spolu</th>
                      <th className="px-4 py-3 font-medium text-right">Kartou</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.sort((a: any, b: any) => b.datum.localeCompare(a.datum)).map((entry: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{format(new Date(entry.datum), "dd.MM.yyyy")}</td>
                        <td className="px-4 py-3 text-right font-bold">{entry.trzbaSpolu?.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-right">{entry.kreditnaKarta?.toFixed(2)} €</td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          Žiadne záznamy nenájdené
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Custom Popup Dialog */}
      <Dialog open={popup.isOpen} onOpenChange={(open) => setPopup(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="sr-only">Oznámenie</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {popup.message === 'Čakaj pracujem' ? (
              <Hourglass className="w-16 h-16 text-amber-500" />
            ) : popup.type === 'success' ? (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
            <p className="text-xl font-semibold text-center">{popup.message}</p>
          </div>
          <DialogFooter className="sm:justify-center">
            {popup.message !== 'Čakaj pracujem' && (
              <Button 
                type="button" 
                className="w-32"
                onClick={() => setPopup(prev => ({ ...prev, isOpen: false }))}
              >
                OK
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <YesterdayCheckDialog
        isOpen={showYesterdayCheck}
        onClose={() => setShowYesterdayCheck(false)}
        onContinue={() => {
          setShowYesterdayCheck(false);
          // When continuing, we bypass the yesterday check but STILL want to check for today
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

      <Dialog open={showMissingDaysCheck} onOpenChange={setShowMissingDaysCheck}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="sr-only">Chýbajúce údaje</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <div className="text-center space-y-2">
              <p className="text-xl font-bold">Chýbaju ti tieto dni. Chceš to opraviť?</p>
              <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground grid grid-cols-3 gap-1 pt-2">
                {missingDays.map(d => (
                  <span key={d} className="bg-muted px-2 py-1 rounded">{d}</span>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-4 sm:justify-center">
            <Button 
              variant="outline"
              className="flex-1 h-12 text-lg"
              onClick={() => setShowMissingDaysCheck(false)}
            >
              Opraviť
            </Button>
            <Button 
              className="flex-1 h-12 text-lg"
              onClick={() => {
                setShowMissingDaysCheck(false);
                handleExport(true);
              }}
            >
              Pokračovať
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}