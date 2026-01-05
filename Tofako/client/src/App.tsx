import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppTimer } from "@/hooks/use-app-timer";
import { useState, useEffect } from "react";
import { XCircle, WifiOff } from "lucide-react";
import { DeviceLock } from "@/components/DeviceLock";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import CategoryView from "@/pages/CategoryView";
import FacilitySelectPage from "@/pages/FacilitySelectPage";
import ShoppingListsPage from "@/pages/ShoppingListsPage";
import ShoppingListItemsPage from "@/pages/ShoppingListItemsPage";
import TempShoppingListsPage from "@/pages/TempShoppingListsPage";
import TempShoppingListItemsPage from "@/pages/TempShoppingListItemsPage";
import BioWastePage from "@/pages/BioWastePage";
import BioWasteReportPage from "@/pages/BioWasteReportPage";
import PreparationPage from "@/pages/PreparationPage";
import PreparationControlPage from "@/pages/PreparationControlPage";
import KvartalSanitationPage from "@/pages/KvartalSanitationPage";
import KvartalSanitationControlPage from "@/pages/KvartalSanitationControlPage";
import DailySanitationPage from "@/pages/DailySanitationPage";
import DailySanitationControlPage from "@/pages/DailySanitationControlPage";
import TeplotyPage from "@/pages/TeplotyPage";
import TeplotyControlPage from "@/pages/TeplotyControlPage";
import DPHPage from "@/pages/DPHPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/category/:id" component={CategoryView} />
      <Route path="/facilities" component={FacilitySelectPage} />
      <Route path="/shopping-lists" component={ShoppingListsPage} />
      <Route path="/shopping-lists/:facilityId" component={ShoppingListItemsPage} />
      <Route path="/temp-shopping-lists" component={TempShoppingListsPage} />
      <Route path="/temp-shopping-lists/:facilityId" component={TempShoppingListItemsPage} />
      <Route path="/bio-waste" component={BioWastePage} />
      <Route path="/bio-waste-report" component={BioWasteReportPage} />
      <Route path="/preparation" component={PreparationPage} />
      <Route path="/preparation-control" component={PreparationControlPage} />
      <Route path="/kvartal-sanitation" component={KvartalSanitationPage} />
      <Route path="/kvartal-sanitation-control" component={KvartalSanitationControlPage} />
      <Route path="/daily-sanitation" component={DailySanitationPage} />
      <Route path="/daily-sanitation-control" component={DailySanitationControlPage} />
      <Route path="/teploty" component={TeplotyPage} />
      <Route path="/teploty-control" component={TeplotyControlPage} />
      <Route path="/dph" component={DPHPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <WifiOff className="w-24 h-24 text-muted-foreground opacity-20" />
        <XCircle className="w-16 h-16 text-destructive absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl rounded-full bg-background" />
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-2 uppercase tracking-tight">Nemáš internet</h2>
      <p className="text-xl text-muted-foreground max-w-xs">
        Skontroluj pripojenie k Wi-Fi alebo zapni mobilné dáta.
      </p>
    </div>
  );
}

function AppContent() {
  // Initialize app timer
  useAppTimer();

  return (
    <>
      <OfflineOverlay />
      <Toaster />
      <Router />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DeviceLock>
          <AppContent />
        </DeviceLock>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
