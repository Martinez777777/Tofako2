import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderOpen, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function FileAccessModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const hasAccess = localStorage.getItem("tofako_file_access");
    if (!hasAccess) {
      setIsOpen(true);
    }
  }, []);

  const handleGrantAccess = () => {
    setIsLoading(true);
    
    // Simulate FS operations
    setTimeout(() => {
      localStorage.setItem("tofako_file_access", "true");
      setIsLoading(false);
      setIsOpen(false);
      
      toast({
        title: "Access Granted",
        description: "Creating folders in /storage/emulated/0/Pictures/Tofako/Aplikácia...",
        variant: "default",
        duration: 3000,
      });
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 w-fit">
            <FolderOpen className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-display">Storage Permission Required</DialogTitle>
          <DialogDescription className="text-center pt-2">
            The application needs access to your device's storage to save and read manual files.
            <br/><br/>
            This will create a dedicated folder at: <br/>
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono mt-2 block">
              /storage/emulated/0/Pictures/Tofako/
            </code>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center mt-4">
          <Button 
            type="button" 
            className="w-full sm:w-auto min-w-[200px] h-12 text-lg font-semibold"
            onClick={handleGrantAccess}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 " />
                Setting up...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Allow Access
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
