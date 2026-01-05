import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { XCircle } from "lucide-react";

interface YesterdayCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function YesterdayCheckDialog({ isOpen, onClose, onContinue }: YesterdayCheckDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader className="flex flex-col items-center justify-center">
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <AlertDialogTitle className="text-2xl font-bold text-center">
            Nie sú zadané hodnoty za včera.
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xl text-center text-foreground">
            Chceš opraviť?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-4 pt-4">
          <AlertDialogCancel 
            onClick={onClose}
            className="w-full sm:w-32 h-12 text-lg font-bold border-2"
          >
            OPRAVIŤ
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onContinue}
            className="w-full sm:w-32 h-12 text-lg font-bold bg-primary "
          >
            POKRAČOVAŤ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
