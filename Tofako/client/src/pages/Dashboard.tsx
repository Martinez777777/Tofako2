import { useState, useEffect } from "react";
import { useMenuItems } from "@/hooks/use-menu";
import { NavigationButton } from "@/components/NavigationButton";
import { Header } from "@/components/Header";
import { FacilitySelectModal } from "@/components/FacilitySelectModal";
import { useSelectedFacility } from "@/hooks/use-selected-facility";
import { 
  ClipboardCheck, 
  FileText, 
  Settings, 
  ShoppingCart, 
  AlertTriangle,
  ArrowRight,
  LogOut,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ICON_MAP: Record<string, any> = {
  "ClipboardCheck": ClipboardCheck,
  "FileText": FileText,
  "Settings": Settings,
  "ShoppingCart": ShoppingCart,
};

export default function Dashboard() {
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutPin, setLogoutPin] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [facilityName, setFacilityName] = useState<string>("");
  const { data: menuItems, isLoading, error } = useMenuItems();
  const { selectedFacility } = useSelectedFacility();

  const handleLogoutDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogoutError("");
    setLogoutLoading(true);

    try {
      const response = await fetch("/api/verify-admin-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: logoutPin }),
      });

      if (response.ok) {
        localStorage.removeItem("tofako_device_authorized");
        window.location.reload();
      } else {
        setLogoutError("Nesprávny admin kód");
        setLogoutPin("");
      }
    } catch {
      setLogoutError("Chyba pripojenia k serveru");
    } finally {
      setLogoutLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFacility) {
      // Optionally fetch the facility name from Firebase or just use the key
      setFacilityName(selectedFacility);
    }
  }, [selectedFacility]);

  // Filter for root items (parentId is null, undefined, 0, or "null")
  const rootItems = menuItems?.filter(item => {
    return item.parentId === null || 
           item.parentId === undefined || 
           item.parentId === 0 || 
           String(item.parentId) === "null" ||
           !item.parentId;
  }).sort((a, b) => a.order - b.order);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground font-mono">Loading System...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-display text-foreground mb-2">System Error</h1>
        <p className="text-muted-foreground mb-6 max-w-md">Could not load the menu configuration. Please check your connection.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Tofako Control" />
      <FacilitySelectModal 
        isOpen={showFacilityModal} 
        onClose={() => setShowFacilityModal(false)} 
      />

      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col gap-4">
            {rootItems && rootItems.length > 0 ? (
              <>
                {rootItems.map((item) => {
                  // Map database icon string to Lucide component
                  const IconComponent = item.icon ? ICON_MAP[item.icon] : undefined;
                  
                  // Determine href based on item type and label
                  let href = '#';
                  if (item.label === 'Nákupné zoznamy') {
                    href = '/shopping-lists';
                  } else if (item.label === 'Dočasné NZ') {
                    href = '/temp-shopping-lists';
                  } else if (item.label === 'Tvorba Bioopadu') {
                    href = '/bio-waste';
                  } else if (item.label === 'TvorbaBioOdpadu - Kontrola') {
                    href = '/bio-waste-report';
                  } else if (item.label === 'Príprava - Kontrola') {
                    href = '/preparation-control';
                  } else if (item.label === 'Denná Sanitácia - Kontrola') {
                    href = '/daily-sanitation-control';
                  } else if (item.label === 'Kvartálna sanitácia - Kontrola') {
                    href = '/kvartal-sanitation-control';
                  } else if (item.type === 'category') {
                    href = `/category/${item.id}`;
                  } else {
                    href = item.url || '#';
                  }
                  
                  return (
                    <NavigationButton
                      key={item.id}
                      label={item.label}
                      icon={IconComponent}
                      href={href}
                      variant="primary"
                      className="h-20"
                    />
                  );
                })}
                
                {/* Facility Selection Button */}
                <button
                  onClick={() => setShowFacilityModal(true)}
                  className="w-full h-20 rounded-lg border-2 border-primary bg-primary/5 flex items-center justify-center gap-3"
                >
                  <span className="text-lg font-semibold text-primary">Výber prevádzky</span>
                </button>

                {/* Logout Device Button */}
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full h-14 rounded-lg border-2 border-destructive/50 bg-destructive/5 flex items-center justify-center gap-3"
                >
                  <LogOut className="w-5 h-5 text-destructive" />
                  <span className="text-base font-medium text-destructive">Odhlásiť zariadenie</span>
                </button>

                {/* Logout Device Modal */}
                <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Odhlásiť zariadenie</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleLogoutDevice} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Pre odhlásenie zariadenia zadajte admin kód. Po odhlásení bude zariadenie opäť vyžadovať PIN.
                      </p>
                      <Input
                        type="password"
                        inputMode="numeric"
                        placeholder="Zadajte admin kód"
                        value={logoutPin}
                        onChange={(e) => setLogoutPin(e.target.value)}
                        className="text-center"
                      />
                      {logoutError && (
                        <p className="text-destructive text-sm text-center">{logoutError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowLogoutModal(false);
                            setLogoutPin("");
                            setLogoutError("");
                          }}
                        >
                          Zrušiť
                        </Button>
                        <Button
                          type="submit"
                          variant="destructive"
                          className="flex-1"
                          disabled={!logoutPin || logoutLoading}
                        >
                          {logoutLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Odhlásiť"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Selected Facility Display */}
                {facilityName && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Vybraná prevádzka:</p>
                    <p className="text-lg font-semibold text-primary">{facilityName}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl bg-muted/20">
                <p className="text-muted-foreground">No menu items configured.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
