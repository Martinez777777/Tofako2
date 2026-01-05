import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

interface FacilitySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FacilitySelectModal({ isOpen, onClose }: FacilitySelectModalProps) {
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Verify admin code via Firebase
      // TODO: Replace with actual Firebase call when config is provided
      const response = await fetch("/api/verify-admin-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: adminCode }),
      });

      if (!response.ok) {
        setError("Nesprávny admin kód");
        setIsLoading(false);
        return;
      }

      // Code verified, navigate to facility selection
      onClose();
      window.location.href = "/facilities";
    } catch (err) {
      setError("Chyba pri overovaní kódu");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Výber prevádzky</DialogTitle>
          <DialogDescription>
            Zadaj admin kód na prístup k výberu prevádzky
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Admin kód</label>
            <Input
              type="password"
              placeholder="Zadaj admin kód"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex gap-2 items-start bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Zrušiť
            </Button>
            <Button type="submit" disabled={!adminCode || isLoading}>
              {isLoading ? "Overujem..." : "Pokračovať"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
