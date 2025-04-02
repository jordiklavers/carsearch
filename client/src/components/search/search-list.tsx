import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PDFPreview } from "@/components/pdf/pdf-preview";
import { CarLoading } from "@/components/ui/car-loading";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generatePDF } from "@/lib/pdf-generator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchListProps {
  statusFilter?: "all" | "active" | "completed" | "in_progress" | "sent" | "rejected";
}

interface SearchResponse {
  searches: Search[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const STATUS_OPTIONS = [
  { value: "active", label: "Actief", color: "bg-green-100 text-green-800 border-green-100" },
  { value: "in_progress", label: "In behandeling", color: "bg-blue-100 text-blue-800 border-blue-100" },
  { value: "sent", label: "Verstuurd", color: "bg-purple-100 text-purple-800 border-purple-100" },
  { value: "rejected", label: "Afgewezen", color: "bg-red-100 text-red-800 border-red-100" },
  { value: "completed", label: "Voltooid", color: "bg-slate-100 text-slate-800 border-slate-100" },
] as const;

export function SearchList({ statusFilter = "all" }: SearchListProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedSearch, setSelectedSearch] = useState<Search | null>(null);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchToDelete, setSearchToDelete] = useState<Search | null>(null);

  // Fetch searches query
  const { data, isLoading } = useQuery<SearchResponse>({
    queryKey: ["/api/searches", currentPage, statusFilter],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/searches?page=${currentPage}&limit=${itemsPerPage}`
      );
      return res.json();
    },
    staleTime: 30000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/searches/${id}`);
      if (!res.ok) {
        throw new Error("Er is een fout opgetreden bij het verwijderen van de zoekopdracht");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/searches"] });
      toast({
        title: "Zoekopdracht verwijderd",
        description: "De zoekopdracht is succesvol verwijderd.",
      });
      setSearchToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/searches/${id}`, {
        body: JSON.stringify({ status }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || "Er is een fout opgetreden bij het bijwerken van de status");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/searches"] });
      toast({
        title: "Status bijgewerkt",
        description: "De status is succesvol bijgewerkt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleDelete = (search: Search) => {
    setSearchToDelete(search);
  };

  const handleStatusChange = (search: Search, newStatus: string) => {
    updateStatusMutation.mutate({ id: search.id, status: newStatus });
  };

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-8">
        <CarLoading text="Zoekopdrachten laden..." />
      </div>
    );
  }

  if (!data?.searches || data.searches.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-slate-500">Geen zoekopdrachten gevonden</p>
          <Button className="mt-4" onClick={() => navigate("/search/new")}>
            Nieuwe Zoekopdracht
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Filter searches based on status
  const filteredSearches =
    statusFilter === "all"
      ? data.searches
      : data.searches.filter((search) => search.status === statusFilter);

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {filteredSearches.map((search) => (
            <li key={search.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-medium text-primary truncate">
                        {search.carMake} {search.carModel} - {search.carColor}
                      </p>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-slate-500">
                          <i className="fas fa-user flex-shrink-0 mr-1.5 text-slate-400"></i>
                          <span>
                            Klant: {search.customerFirstName}{" "}
                            {search.customerLastName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col text-right items-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 ${
                            STATUS_OPTIONS.find(opt => opt.value === search.status)?.color || ""
                          }`}
                        >
                          {STATUS_OPTIONS.find(opt => opt.value === search.status)?.label || "Onbekend"}
                          <i className="fas fa-chevron-down text-xs"></i>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[160px]">
                        {STATUS_OPTIONS.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            onClick={() => handleStatusChange(search, option.value)}
                            className={`${option.color} py-2 px-3 cursor-pointer`}
                          >
                            <div className="flex items-center gap-2">
                              <i className={`fas ${
                                option.value === "active" ? "fa-check-circle" :
                                option.value === "in_progress" ? "fa-clock" :
                                option.value === "sent" ? "fa-paper-plane" :
                                option.value === "rejected" ? "fa-times-circle" :
                                "fa-check"
                              }`}></i>
                              <span>{option.label}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="mt-2 text-sm text-slate-500">
                      Gecreëerd op{" "}
                      {format(new Date(search.createdAt), "d MMMM yyyy")}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <div className="flex space-x-1">
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border-blue-100"
                    >
                      {search.carTransmission}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-slate-100 text-slate-800 border-slate-100"
                    >
                      {search.carType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-slate-100 text-slate-800 border-slate-100"
                    >
                      €{search.minPrice.toLocaleString()} - €
                      {search.maxPrice.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-1.5 h-auto"
                            onClick={() => handleEdit(search.id)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Bewerken</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-1.5 h-auto"
                            onClick={() => handlePreviewPDF(search)}
                          >
                            <i className="fas fa-download"></i>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>PDF downloaden</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-1.5 h-auto text-red-500 hover:text-red-600 hover:border-red-500"
                            onClick={() => handleDelete(search)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Verwijderen</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!searchToDelete} onOpenChange={(open) => !open && setSearchToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zoekopdracht verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze zoekopdracht wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSearchToDelete(null)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => searchToDelete && deleteMutation.mutate(searchToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <CarLoading className="mr-2" />
                  <span>Verwijderen...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-trash mr-2"></i>
                  <span>Verwijderen</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Vorige
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={currentPage === data.pagination.totalPages}
            >
              Volgende
            </Button>
            <span className="self-center text-sm text-slate-500">
              Pagina {currentPage} van {data.pagination.totalPages}
            </span>
          </div>
        </div>
      )}

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
