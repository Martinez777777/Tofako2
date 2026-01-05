import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, XCircle, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { sk } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { YesterdayCheckDialog } from "@/components/YesterdayCheckDialog";
import { TodayCheckDialog } from "@/components/TodayCheckDialog";
import { subDays, isSameDay } from "date-fns";

export default function BioWastePage() {
  const { selectedFacility } = useSelectedFacility();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("kg");
  
  const [popup, setPopup] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  const [showYesterdayCheck, setShowYesterdayCheck] = useState(false);
  const [showTodayCheck, setShowTodayCheck] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (popup.show) {
      timer = setTimeout(() => {
        setPopup(prev => ({ ...prev, show: false }));
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [popup.show]);

  const { data: entriesData, isLoading: isLoadingEntries } = useQuery({
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

  const mutation = useMutation({
    mutationFn: async (newData: any) => {
      if (!selectedFacility) {
        throw new Error("Nie je zadaná prevádzka");
      }
      const res = await fetch(`/api/bio-waste/${selectedFacility}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Chyba pri ukladaní");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bio-waste", selectedFacility] });
      setAmount("");
      setPopup({
        show: true,
        type: "success",
        message: "BioOdpad uložený"
      });
    },
    onError: (error: any) => {
      setPopup({
        show: true,
        type: "error",
        message: error.message
      });
    }
  });

  const handleSave = (bypassCheck = false, bypassToday = false) => {
    if (!selectedFacility) {
      setPopup({
        show: true,
        type: "error",
        message: "Nie je zadaná prevádzka"
      });
      return;
    }
    if (!amount) return;

    if (!bypassCheck) {
      const yesterday = subDays(date, 1);
      const hasYesterdayData = entriesData?.some((entry: any) => 
        isSameDay(new Date(entry.date), yesterday)
      );

      if (!hasYesterdayData) {
        setShowYesterdayCheck(true);
        return;
      }
    }

    if (!bypassToday) {
      const hasTodayData = entriesData?.some((entry: any) => 
        isSameDay(new Date(entry.date), date)
      );
      if (hasTodayData) {
        setShowTodayCheck(true);
        return;
      }
    }

    mutation.mutate({
      date: format(date, "yyyy-MM-dd"),
      amount,
      unit
    });
  };

  const sortedEntries = entriesData ? [...entriesData].reverse().slice(0, 50) : [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="BioOdpad" showBack />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-3xl font-black text-center text-primary uppercase tracking-tight">BioOdpad</h1>
          <div className="space-y-4 bg-card p-6 rounded-xl border shadow-sm">
            <div className="space-y-2">
              <Label>Dátum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal border-2 border-primary/20",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: sk }) : <span>Vybrať dátum</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100] bg-white border shadow-xl ring-1 ring-black ring-opacity-5" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    locale={sk}
                    className="bg-white rounded-md border-0"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Množstvo</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Zadajte číslo"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Jednotka</Label>
              <RadioGroup value={unit} onValueChange={setUnit} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="kg" id="kg" />
                  <Label htmlFor="kg" className="text-lg cursor-pointer">kg</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="g" id="g" />
                  <Label htmlFor="g" className="text-lg cursor-pointer">g</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              onClick={() => handleSave(false)} 
              className="w-full h-14 text-lg font-bold"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className=" mr-2" /> : null}
              Uložiť
            </Button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Posledné záznamy</h2>
            {isLoadingEntries ? (
              <div className="flex justify-center py-8">
                <Loader2 className=" text-primary w-8 h-8" />
              </div>
            ) : sortedEntries.length > 0 ? (
              <div className="space-y-2">
                {sortedEntries.map((entry, i) => (
                  <div key={i} className="bg-muted/50 p-4 rounded-lg border text-sm md:text-base">
                    BioOpad vytvorený za <span className="font-bold">{entry.date}</span> - <span className="font-bold">{entry.amount}</span> <span className="font-bold">{entry.unit}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 font-mono">Žiadne záznamy</p>
            )}
          </div>
        </div>
      </main>

      <Dialog open={popup.show} onOpenChange={(open) => setPopup(prev => ({ ...prev, show: open }))}>
        <DialogContent className="max-w-[90%] sm:max-w-md rounded-2xl">
          <DialogHeader className="flex flex-col items-center justify-center pt-4">
            {popup.type === "success" ? (
              <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
            ) : (
              <XCircle className="w-20 h-20 text-red-500 mb-4" />
            )}
            <DialogTitle className="text-2xl font-bold text-center">
              {popup.message}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pt-4">
            <Button 
              onClick={() => setPopup(prev => ({ ...prev, show: false }))}
              className={cn(
                "w-full sm:w-32 h-12 text-lg font-bold",
                popup.type === "success" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              )}
            >
              OK
            </Button>
          </DialogFooter>
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
