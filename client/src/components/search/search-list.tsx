import { useQuery } from "@tanstack/react-query";
import { Search } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { generatePDF } from "@/lib/pdf-generator";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PDFPreview } from "@/components/pdf/pdf-preview";
import { CarLoading } from "@/components/ui/car-loading";

interface SearchListProps {
  statusFilter?: string;
}

export function SearchList({ statusFilter = "all" }: SearchListProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedSearch, setSelectedSearch] = useState<Search | null>(null);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const { data: searches, isLoading } = useQuery<Search[]>({
    queryKey: ["/api/searches"],
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <CarLoading 
          type="car" 
          size="lg" 
          text="Zoekopdrachten laden..." 
        />
      </div>
    );
  }
  
  if (!searches || searches.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-slate-500">Geen zoekopdrachten gevonden</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate("/search/new")}
          >
            Nieuwe Zoekopdracht
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Filter searches based on status
  const filteredSearches = statusFilter === "all" 
    ? searches 
    : searches.filter(search => search.status === statusFilter);
  
  // Pagination
  const totalPages = Math.ceil(filteredSearches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSearches = filteredSearches.slice(startIndex, startIndex + itemsPerPage);
  
  const handleEdit = (id: number) => {
    navigate(`/search/edit/${id}`);
  };
  
  const handlePreviewPDF = (search: Search) => {
    setSelectedSearch(search);
    setIsPdfPreviewOpen(true);
  };
  
  const handleDownloadPDF = async () => {
    if (!selectedSearch) return;
    
    try {
      setIsDownloading(true);
      await generatePDF(selectedSearch);
      toast({
        title: "PDF gedownload",
        description: "De PDF is succesvol gedownload.",
      });
      setIsDownloading(false);
      setIsPdfPreviewOpen(false);
    } catch (error) {
      setIsDownloading(false);
      toast({
        title: "Fout bij downloaden",
        description: "Er is een fout opgetreden bij het downloaden van de PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {paginatedSearches.map(search => (
            <li key={search.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-medium text-secondary truncate">
                        {search.carMake} {search.carModel} - {search.carColor}
                      </p>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-slate-500">
                          <i className="fas fa-user flex-shrink-0 mr-1.5 text-slate-400"></i>
                          <span>Klant: {search.customerFirstName} {search.customerLastName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col text-right items-end">
                    <Badge 
                      variant="secondary"
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        search.status === "active" ? "bg-green-100 text-green-800 border-green-100" : ""
                      }`}
                    >
                      {search.status === "active" ? "Actief" : "Voltooid"}
                    </Badge>
                    <span className="mt-2 text-sm text-slate-500">
                      Gecreëerd op {format(new Date(search.createdAt), "d MMMM yyyy")}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <div className="flex space-x-1">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-100">
                      {search.carTransmission}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-100">
                      {search.carType}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-100">
                      €{search.minPrice.toLocaleString()} - €{search.maxPrice.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="p-1.5 h-auto"
                      onClick={() => handleEdit(search.id)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="p-1.5 h-auto"
                      onClick={() => handlePreviewPDF(search)}
                    >
                      <i className="fas fa-download"></i>
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {totalPages > 1 && (
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Pagina <span className="font-medium">{currentPage}</span> van <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex-1 flex justify-end">
                <Button 
                  variant="outline" 
                  className="relative inline-flex items-center px-4 py-2 mr-3"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(page => page - 1)}
                >
                  Vorige
                </Button>
                <Button 
                  variant="outline" 
                  className="relative inline-flex items-center px-4 py-2"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(page => page + 1)}
                >
                  Volgende
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PDFPreview 
        open={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
        search={selectedSearch}
        onDownload={handleDownloadPDF}
        isDownloading={isDownloading}
      />
    </>
  );
}