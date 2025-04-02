import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Search } from "@shared/schema";
import { CarLoading } from "@/components/ui/car-loading";
import { useQuery } from "@tanstack/react-query";
import { Organization } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface PDFPreviewProps {
  open: boolean;
  onClose: () => void;
  search: Search | null;
  onDownload: () => void;
  isDownloading?: boolean;
}

export function PDFPreview({ open, onClose, search, onDownload, isDownloading = false }: PDFPreviewProps) {
  const { user } = useAuth();
  
  // Fetch organization data
  const { data: organization } = useQuery<Organization>({
    queryKey: user?.organizationId ? ["/api/organizations", user.organizationId] : [],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const res = await fetch(`/api/organizations/${user.organizationId}`);
      if (!res.ok) throw new Error("Failed to load organization");
      return await res.json();
    },
    enabled: !!user?.organizationId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (!search) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>PDF Voorbeeld</DialogTitle>
        </DialogHeader>
        <div className="border-2 border-slate-100 rounded-lg p-1 w-full">
          <div className="bg-slate-50 p-4 max-h-[70vh] overflow-y-auto flex flex-col items-center justify-start">
            <div className="bg-white p-8 w-full max-w-2xl shadow-lg rounded">
              {/* Logo and Title */}
              <div className="flex justify-between mb-8">
                <div className="h-12 w-32 bg-primary rounded-md flex items-center justify-center">
                  {organization?.logo ? (
                    <img 
                      src={`/api/images/${organization.logo}`}
                      alt={organization.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-white font-bold">LOGO</span>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-semibold text-slate-900">Zoekopdracht</h2>
                  <p className="text-sm text-slate-500">Datum: {format(new Date(search.createdAt), 'dd MMMM yyyy')}</p>
                </div>
              </div>
              
              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-900 mb-2">Klantgegevens</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Naam:</p>
                    <p className="text-sm text-slate-900">{search.customerFirstName} {search.customerLastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Email:</p>
                    <p className="text-sm text-slate-900">{search.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Telefoon:</p>
                    <p className="text-sm text-slate-900">{search.customerPhone}</p>
                  </div>
                </div>
              </div>
              
              {/* Car Details */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-900 mb-2">Auto Specificaties</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Merk & Model:</p>
                    <p className="text-sm text-slate-900">{search.carMake} {search.carModel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Type:</p>
                    <p className="text-sm text-slate-900">{search.carType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Bouwjaar:</p>
                    <p className="text-sm text-slate-900">{search.carYear}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Kleur:</p>
                    <p className="text-sm text-slate-900">{search.carColor}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Transmissie:</p>
                    <p className="text-sm text-slate-900">{search.carTransmission}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Brandstof:</p>
                    <p className="text-sm text-slate-900">{search.carFuel}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-slate-700">Prijsrange:</p>
                    <p className="text-sm text-slate-900">€{search.minPrice.toLocaleString()} - €{search.maxPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              {/* Additional Requirements */}
              {search.additionalRequirements && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Aanvullende eisen</h3>
                  <p className="text-sm text-slate-900">{search.additionalRequirements}</p>
                </div>
              )}
              
              {/* Car Image Placeholders */}
              {search.images && search.images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {search.images.map((image, index) => (
                    <div key={index} className="bg-slate-100 h-32 rounded flex items-center justify-center">
                      <img 
                        src={`/api/images/${image}`} 
                        alt="Auto afbeelding" 
                        className="h-full w-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Footer */}
              <div className="border-t border-slate-200 pt-4 text-center">
                <p className="text-sm text-slate-500">CarSearch Pro - Uw specialist in auto zoekopdrachten</p>
                <p className="text-xs text-slate-400">Tel: 020-123456 | info@carsearchpro.nl | www.carsearchpro.nl</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDownloading}>
            Sluiten
          </Button>
          <Button onClick={onDownload} disabled={isDownloading}>
            {isDownloading ? (
              <CarLoading text="PDF genereren..." />
            ) : (
              <>
                <i className="fas fa-download mr-2"></i>
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
