import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { useRoute } from "wouter";
import { AlertTriangle, Save, Loader2, Trash2, Upload, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number | string;
}

export default function ShoppingListItemsPage() {
  const [_, params] = useRoute("/shopping-lists/:facilityId");
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [date, setDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [showClearSuccessDialog, setShowClearSuccessDialog] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const facilityId = params?.facilityId as string;

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (showSuccessDialog || showClearSuccessDialog) {
      const timer = setTimeout(() => {
        setShowSuccessDialog(false);
        setShowClearSuccessDialog(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, showClearSuccessDialog]);

  useEffect(() => {
    const loadItems = async () => {
      if (!facilityId) return;
      try {
        setIsLoading(true);
        const response = await fetch(`/api/shopping-lists/${facilityId}`);
        if (!response.ok) throw new Error("Failed to load items");
        const data = await response.json();
        const itemsData = data.items || {};
        let loadedDate = getTodayDate();
        let itemsArray: ShoppingItem[] = [];
        
        const hasSavedData = typeof itemsData === 'object' && itemsData.items && Array.isArray(itemsData.items) && itemsData.items.length > 0;
        const hasOldFormatData = Array.isArray(itemsData) && itemsData.length > 0;

        let serverHasData = false;

        if (hasSavedData) {
          itemsArray = itemsData.items;
          serverHasData = itemsArray.some(item => item.quantity !== undefined && item.quantity !== "");
          if (serverHasData && itemsData.date) loadedDate = itemsData.date;
          else loadedDate = getTodayDate();
        } 
        else if (hasOldFormatData) {
          itemsArray = itemsData;
          serverHasData = itemsArray.some(item => item.quantity !== undefined && item.quantity !== "");
          loadedDate = getTodayDate();
        }
        else {
          loadedDate = getTodayDate();
        }
        
        setItems(itemsArray);
        setDate(loadedDate);
        setHasExistingData(serverHasData);
      } catch (err) {
        console.error("Error loading shopping list items:", err);
        setError("Nie je možné načítať položky");
        setDate(getTodayDate());
      } finally {
        setIsLoading(false);
      }
    };
    loadItems();
  }, [facilityId]);

  const handleQuantityChange = (id: string, value: string, isNote: boolean = false) => {
    if (isNote) {
      setItems(items.map(item => item.id === id ? { ...item, quantity: value } : item));
    } else {
      const num = value === "" ? undefined : parseFloat(value) || 0;
      setItems(items.map(item => item.id === id ? { ...item, quantity: num } : item));
    }
  };

  const handleClearList = async () => {
    const clearedItems = items.map(item => ({ ...item, quantity: undefined }));
    const todayDate = getTodayDate();
    setItems(clearedItems);
    setDate(todayDate);
    try {
      setIsSaving(true);
      const dataToSave = { date: todayDate, items: clearedItems };
      const response = await fetch(`/api/shopping-lists/${facilityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave)
      });
      if (response.ok) {
        setHasExistingData(false);
        setShowClearSuccessDialog(true);
      }
    } catch (err) {
      console.error("Error clearing list:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const performSave = async () => {
    if (!facilityId) return;
    try {
      setIsSaving(true);
      const dataToSave = { date: date, items: items };
      const response = await fetch(`/api/shopping-lists/${facilityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave)
      });
      if (!response.ok) throw new Error("Failed to save items");
      
      const hasQuantities = items.length > 0 && items.some(item => item.quantity !== undefined && item.quantity !== "");
      setHasExistingData(hasQuantities);
      
      setShowSuccessDialog(true);
      setShowConfirmDialog(false);
    } catch (err) {
      console.error("Error saving items:", err);
      alert("Chyba pri ukladaní!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    // Show confirmation only if there was ALREADY data on the server
    if (hasExistingData) {
      setPendingAction(() => performSave);
      setShowConfirmDialog(true);
    } else {
      performSave();
    }
  };

  const handleImportClick = () => {
    setShowAdminDialog(true);
    setAdminCode("");
    setAdminError("");
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) performImport(file);
  };

  const handleAdminVerify = async () => {
    if (!adminCode.trim()) {
      setAdminError("Zadaj admin kód");
      return;
    }
    try {
      const response = await fetch("/api/verify-admin-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: adminCode }),
      });
      if (!response.ok) {
        setAdminError("Nesprávny admin kód");
        return;
      }
      setShowAdminDialog(false);
      setAdminCode("");
      fileInputRef.current?.click();
    } catch (err) {
      setAdminError("Chyba pri overovaní kódu");
    }
  };

  const performImport = async (file: File) => {
    if (!facilityId) return;
    try {
      setIsSaving(true);
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length === 0) {
        alert("TXT súbor je prázdny!");
        return;
      }
      const importItems: ShoppingItem[] = lines.map((itemName) => ({
        id: itemName.toLowerCase().replace(/\s+/g, '_'),
        name: itemName,
        quantity: undefined
      }));
      const dataToSave = { date: getTodayDate(), items: importItems };
      const response = await fetch(`/api/shopping-lists/${facilityId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave)
      });
      if (!response.ok) throw new Error("Failed to import items");
      setItems(importItems);
      setDate(getTodayDate());
      alert(`Import bol úspešný! Nahraných ${lines.length} položiek.`);
    } catch (err) {
      console.error("Error importing items:", err);
      alert("Chyba pri importe!");
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Nákupný zoznam" showBack />
        <div className="container mx-auto px-4 pt-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Nákupný zoznam" showBack />
        <div className="container mx-auto px-4 pt-12 flex flex-col items-center text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold">{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title={facilityId} showBack />
      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3">
            <div className="text-center mb-4">
              <p className="text-xl font-bold font-display text-primary">Prevádzka: {facilityId}</p>
            </div>
            <div className="p-4 rounded-lg border border-input bg-card mb-4">
              <label className="block text-sm font-medium mb-2">Dátum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-2 rounded border border-input bg-background text-base"
              />
            </div>
            <Button onClick={handleClearList} variant="outline" className="w-full">
              <Trash2 className="mr-2 h-5 w-5" /> Vymazať zoznam
            </Button>
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Žiadne položky v nákupnom zozname</p>
            ) : (
              items.map((item, index) => {
                const isFirstItem = index === 0;
                return (
                  <div key={item.id} className="p-4 rounded-lg border border-input bg-card cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setEditingId(item.id)}>
                    {editingId === item.id ? (
                      <div className={isFirstItem ? "flex flex-col gap-2" : "flex items-center justify-between gap-4"}>
                        <span className="font-medium text-base break-words">{item.name}</span>
                        {isFirstItem ? (
                          <textarea
                            autoFocus
                            value={item.quantity ?? ""}
                            onChange={(e) => {
                              handleQuantityChange(item.id, e.target.value, true);
                              e.target.style.height = 'auto';
                              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                            }}
                            onBlur={() => setEditingId(null)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Poznámky..."
                            className="w-full px-2 py-1 rounded border border-input bg-background text-base resize-none overflow-hidden"
                            style={{ minHeight: '60px', maxHeight: '200px' }}
                          />
                        ) : (
                          <input
                            autoFocus
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity ?? ""}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value, false)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="0"
                            className="w-24 h-10 px-2 rounded border border-input bg-background text-right text-base"
                          />
                        )}
                      </div>
                    ) : (
                      <div className={isFirstItem ? "block" : "flex items-center justify-between gap-4"}>
                        <span className="font-medium text-base break-words">{item.name}</span>
                        {item.quantity !== undefined && (
                          isFirstItem ? (
                            <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded mt-2 whitespace-pre-wrap break-words">{item.quantity}</div>
                          ) : (
                            <span className="text-base font-medium text-primary bg-primary/10 px-3 py-1 rounded">{item.quantity}</span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div className="pt-4 pb-12 space-y-2">
              <Button onClick={handleSave} disabled={isSaving} className="w-full h-12 text-base">
                {isSaving ? <><Loader2 className="mr-2 h-5 w-5" /> Ukladám...</> : <><Save className="mr-2 h-5 w-5" /> Uložiť položky</>}
              </Button>
              <Button onClick={handleImportClick} disabled={isSaving} variant="outline" className="w-full h-12 text-base">
                <Upload className="mr-2 h-5 w-5" /> Import z TXT
              </Button>
              <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileSelected} className="hidden" />
              <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader><DialogTitle>Overenie admin kódu</DialogTitle><DialogDescription>Zadaj admin kód na potvrdzenie importu</DialogDescription></DialogHeader>
                  <div className="space-y-4">
                    <Input type="password" placeholder="Admin kód" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminVerify()} autoFocus />
                    {adminError && <p className="text-sm text-destructive">{adminError}</p>}
                    <Button onClick={handleAdminVerify} className="w-full">Potvrdiť</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={showClearSuccessDialog} onOpenChange={setShowClearSuccessDialog}>
                <DialogContent className="sm:max-w-[425px]">
                  <div className="flex flex-col items-center space-y-4 py-4"><Check className="w-12 h-12 text-green-500" /><DialogTitle className="text-xl">Zoznam bol vymazaný</DialogTitle><Button onClick={() => setShowClearSuccessDialog(false)} className="w-full" variant="default">OK</Button></div>
                </DialogContent>
              </Dialog>
              <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="sm:max-w-[425px]">
                  <div className="flex flex-col items-center space-y-4 py-4"><Check className="w-12 h-12 text-green-500" /><DialogTitle className="text-xl">Super!</DialogTitle><p className="text-center text-base">Zoznam sa uložil.</p><Button onClick={() => setShowSuccessDialog(false)} className="w-full" variant="default">V poriadku</Button></div>
                </DialogContent>
              </Dialog>
              <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-[425px]">
                  <div className="flex flex-col items-center space-y-4 py-4">
                    <X className="w-12 h-12 text-red-500" /><DialogTitle className="text-lg text-center">Chceš zoznam opraviť?</DialogTitle><p className="text-center text-sm text-muted-foreground">Lebo je už napísaný!</p>
                    <div className="flex gap-3 w-full pt-4"><Button onClick={() => setShowConfirmDialog(false)} variant="outline" className="flex-1"><X className="mr-2 h-4 w-4" /> NIE</Button><Button onClick={() => pendingAction?.()} className="flex-1 bg-green-600 hover:bg-green-700"><Check className="mr-2 h-4 w-4" /> ÁNO</Button></div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
