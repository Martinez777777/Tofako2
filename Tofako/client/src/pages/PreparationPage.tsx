import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarIcon, Clock, Save, Play, Search, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { YesterdayCheckDialog } from "@/components/YesterdayCheckDialog";
import { TodayCheckDialog } from "@/components/TodayCheckDialog";
import { subDays, isSameDay } from "date-fns";

interface PreparationEntry {
  date: string;
  time: string;
  item: string;
}

export default function PreparationPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [selectedItem, setSelectedItem] = useState<string>("");
  const { selectedFacility } = useSelectedFacility();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Popup state
  const [popup, setPopup] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({
    isOpen: false,
    type: 'success',
    message: '',
  });

  const [showYesterdayCheck, setShowYesterdayCheck] = useState(false);
  const [showTodayCheck, setShowTodayCheck] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'save' | 'auto', bypassToday?: boolean } | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (popup.isOpen) {
      timeout = setTimeout(() => {
        setPopup(prev => ({ ...prev, isOpen: false }));
      }, 10000);
    }
    return () => clearTimeout(timeout);
  }, [popup.isOpen]);

  const showPopup = (type: 'success' | 'error', message: string) => {
    setPopup({ isOpen: true, type, message });
  };

  // Fetch items from Text_KrajaneVeci for specific facility
  const { data: itemsData, isLoading: isLoadingItems } = useQuery<{ items: string[] }>({
    queryKey: [`/api/preparation/items/${selectedFacility}`],
    enabled: !!selectedFacility,
  });
  const items = itemsData?.items || [];

  // Fetch history for selected facility
  const { data: history = { entries: [] }, isLoading: isLoadingHistory } = useQuery<{ entries: PreparationEntry[] }>({
    queryKey: [`/api/preparation/${selectedFacility}`],
    enabled: !!selectedFacility,
  });

  // Fetch time ranges for auto-save for specific facility
  const { data: timeRangesData } = useQuery<{ times: { start: string, end: string } }>({
    queryKey: [`/api/preparation/times/${selectedFacility}`],
    enabled: !!selectedFacility,
  });
  const timeRanges = timeRangesData?.times;

  const saveMutation = useMutation({
    mutationFn: async (data: PreparationEntry) => {
      const res = await fetch(`/api/preparation/${selectedFacility}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/preparation/${selectedFacility}`] });
      showPopup('success', 'Krájane veci uložené');
    },
    onError: () => {
      toast({ variant: "destructive", title: "Chyba", description: "Nepodarilo sa uložiť položku." });
    }
  });

  const handleSave = (bypassCheck: boolean = false, bypassToday: boolean = false) => {
    if (!selectedFacility) {
      showPopup('error', 'Nemáš vybratú prevádzku');
      return;
    }
    if (!selectedItem) {
      toast({ variant: "destructive", title: "Chyba", description: "Vyberte položku." });
      return;
    }

    const selectedDate = new Date(date);

    if (!bypassCheck) {
      const yesterday = subDays(selectedDate, 1);
      const hasYesterdayData = history?.entries.some(entry => 
        isSameDay(new Date(entry.date), yesterday)
      );

      if (!hasYesterdayData) {
        setPendingAction({ type: 'save', bypassToday });
        setShowYesterdayCheck(true);
        return;
      }
    }

    if (!bypassToday) {
      const hasTodayData = history?.entries.some(entry => 
        isSameDay(new Date(entry.date), selectedDate) && 
        entry.item === selectedItem
      );
      if (hasTodayData) {
        setPendingAction({ type: 'save', bypassToday: true });
        setShowTodayCheck(true);
        return;
      }
    }

    saveMutation.mutate({ date, time, item: selectedItem });
  };

  const handleAutoSave = async (bypassCheck: boolean = false, bypassToday: boolean = false) => {
    if (!selectedFacility) {
      showPopup('error', 'Nemáš vybratú prevádzku');
      return;
    }
    
    if (items.length === 0) {
      toast({ variant: "destructive", title: "Chyba", description: "Zoznam položiek je prázdny." });
      return;
    }

    if (!timeRanges || !timeRanges.start || !timeRanges.end) {
      toast({ variant: "destructive", title: "Chyba", description: "Chýbajú časy (Zaciatok/Koniec) v databáze." });
      return;
    }

    const selectedDate = new Date(date);

    if (!bypassCheck) {
      const yesterday = subDays(selectedDate, 1);
      const hasYesterdayData = history?.entries.some(entry => 
        isSameDay(new Date(entry.date), yesterday)
      );

      if (!hasYesterdayData) {
        setPendingAction({ type: 'auto', bypassToday });
        setShowYesterdayCheck(true);
        return;
      }
    }

    if (!bypassToday) {
      const hasTodayData = history?.entries.some(entry => 
        isSameDay(new Date(entry.date), selectedDate)
      );
      if (hasTodayData) {
        setPendingAction({ type: 'auto', bypassToday: true });
        setShowTodayCheck(true);
        return;
      }
    }

    try {
      const [startH, startM] = timeRanges.start.split(':').map(val => parseInt(val, 10));
      const [endH, endM] = timeRanges.end.split(':').map(val => parseInt(val, 10));
      
      const startTotalMinutes = (startH || 0) * 60 + (startM || 0);
      const endTotalMinutes = (endH || 0) * 60 + (endM || 0);

      const itemsToSave = items.map(item => {
        const randomTotalMinutes = Math.floor(Math.random() * (endTotalMinutes - startTotalMinutes + 1)) + startTotalMinutes;
        const h = Math.floor(randomTotalMinutes / 60);
        const m = randomTotalMinutes % 60;
        const randomTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        return { date, time: randomTime, item };
      });

      // Save all items
      for (const data of itemsToSave) {
        const response = await fetch(`/api/preparation/${selectedFacility}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save item: ${data.item}`);
        }
      }

      queryClient.invalidateQueries({ queryKey: [`/api/preparation/${selectedFacility}`] });
      showPopup('success', 'Krájane veci uložené');
    } catch (error) {
      console.error("AutoSave error:", error);
      toast({ variant: "destructive", title: "Chyba", description: "Niektoré položky sa nepodarilo uložiť." });
    }
  };

  const sortedHistory = Array.isArray(history?.entries) ? [...history.entries].reverse().slice(0, 50) : [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Príprava" showBack />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-md mx-auto space-y-8">
          <h1 className="text-2xl font-bold text-center text-foreground mb-6">Krájane veci</h1>
          
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="date">Dátum</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="date"
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Čas</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="time"
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Výber položky</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="w-full bg-white text-left">
                    <SelectValue placeholder={isLoadingItems ? "Načítavam..." : "Vyberte položku"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {items.map((item, index) => (
                      <SelectItem key={index} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <Button 
                  onClick={() => handleSave(false, false)} 
                  disabled={saveMutation.isPending}
                  className="w-full h-12 gap-2"
                >
                  {saveMutation.isPending ? <Loader2 className="" /> : <Save className="h-5 w-5" />}
                  Uložiť
                </Button>

                <Button 
                  onClick={() => handleAutoSave(false, false)}
                  variant="secondary" 
                  className="w-full h-12 gap-2"
                >
                  <Play className="h-5 w-5" />
                  Automatické uloženie
                </Button>
              </div>
            </CardContent>
          </Card>

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

      {/* Custom Popup Dialog */}
      <Dialog open={popup.isOpen} onOpenChange={(open) => setPopup(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="sr-only">Oznámenie</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {popup.type === 'success' ? (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
            <p className="text-xl font-semibold text-center">{popup.message}</p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button 
              type="button" 
              className="w-32"
              onClick={() => setPopup(prev => ({ ...prev, isOpen: false }))}
            >
              OK
            </Button>
          </DialogFooter>
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
            handleSave(true, !!pendingAction.bypassToday);
          } else if (pendingAction?.type === 'auto') {
            handleAutoSave(true, !!pendingAction.bypassToday);
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
          } else if (pendingAction?.type === 'auto') {
            handleAutoSave(false, true);
          }
          setPendingAction(null);
        }}
      />
    </div>
  );
}
