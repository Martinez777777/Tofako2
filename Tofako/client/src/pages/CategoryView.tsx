import { useMenuItems } from "@/hooks/use-menu";
import { NavigationButton } from "@/components/NavigationButton";
import { Header } from "@/components/Header";
import { useRoute } from "wouter";
import { 
  FileText, 
  ExternalLink, 
  ArrowRight,
  ChevronRight,
  AlertCircle 
} from "lucide-react";

export default function CategoryView() {
  const [_, params] = useRoute("/category/:id");
  const { data: menuItems, isLoading } = useMenuItems();

  const categoryId = params?.id ? parseInt(params.id) : null;
  
  // Find current category info
  const currentCategory = menuItems?.find(item => item.id === categoryId);
  
  // Find children
  const items = menuItems?.filter(item => String(item.parentId) === String(categoryId)).sort((a, b) => a.order - b.order);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Loading..." showBack />
        <div className="container mx-auto px-4 pt-12 text-center">
           <div className=" w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Not Found" showBack />
        <div className="container mx-auto px-4 pt-12 flex flex-col items-center text-center">
           <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
           <h2 className="text-xl font-bold">Category not found</h2>
           <p className="text-muted-foreground mt-2">The requested menu ID does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title={currentCategory.label} showBack />

      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 gap-4">
            {items && items.length > 0 ? (
              items.map((item) => {
                // Determine href for action items
                let actionHref = '#';
                if (item.label === 'BioOdpad') {
                  actionHref = '/bio-waste';
                } else if (item.label === 'Teploty') {
                  actionHref = '/teploty';
                } else if (item.label === 'DPH') {
                  actionHref = '/dph';
                } else if (item.label === 'Denná sanitácia') {
                  actionHref = '/daily-sanitation';
                } else if (item.label === 'Kvartálna sanitácia') {
                  actionHref = '/kvartal-sanitation';
                } else if (item.label === 'Denná Sanitácia - Kontrola') {
                  actionHref = '/daily-sanitation-control';
                } else if (item.label === 'Kvartálna sanitácia - Kontrola') {
                  actionHref = '/kvartal-sanitation-control';
                } else if (item.label === 'Teploty - Kontrola') {
                  actionHref = '/teploty-control';
                } else if (item.label === 'TvorbaBioOdpadu - Kontrola') {
                  actionHref = '/bio-waste-report';
                } else if (item.label === 'Príprava') {
                  actionHref = '/preparation';
                } else if (item.label === 'Príprava - Kontrola') {
                  actionHref = '/preparation-control';
                }
                
                return (
                  <div key={item.id}>
                    {item.type === 'link' && item.label !== 'DPH' ? (
                      <a 
                        href={item.url || '#'} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-md text-primary">
                              <FileText className="w-6 h-6" />
                            </div>
                            <span className="text-lg font-medium text-foreground">{item.label}</span>
                          </div>
                          <ExternalLink className="w-5 h-5 text-muted-foreground opacity-50" />
                        </div>
                      </a>
                    ) : (item.type === 'action' || item.label === 'DPH') ? (
                      <a 
                        href={actionHref} 
                        className="block group"
                      >
                        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-md text-primary">
                              <ChevronRight className="w-6 h-6" />
                            </div>
                            <span className="text-lg font-medium text-foreground">{item.label}</span>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-50" />
                        </div>
                      </a>
                    ) : (
                      <NavigationButton
                        key={item.id}
                        label={item.label}
                        href={`/category/${item.id}`}
                        variant="secondary"
                        className="h-24 md:h-32 text-left items-start justify-start flex-row gap-6 px-8"
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                This category is empty.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
