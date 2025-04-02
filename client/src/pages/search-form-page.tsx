import { useParams, useLocation } from "wouter";
import { SearchForm } from "@/components/search/search-form";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search } from "@shared/schema";
import { CarLoading } from "@/components/ui/car-loading";
import { Button } from "@/components/ui/button";

export default function SearchFormPage() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  
  // Validate ID format
  if (id && !/^\d+$/.test(id)) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-medium">Ongeldige URL</h2>
            <p className="text-red-600 mt-1">
              De opgegeven zoekopdracht ID is ongeldig.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/search/new')}
            >
              Nieuwe Zoekopdracht
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fetch search data if editing
  const { data: searchData, isLoading, error } = useQuery<Search>({
    queryKey: id ? [`/api/searches/${id}`] : [],
    enabled: !!id,
    retry: false, // Don't retry on 404
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/searches/${id}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? "Zoekopdracht niet gevonden" : "Er is een fout opgetreden");
      }
      return res.json();
    }
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex justify-center">
            <CarLoading text="Zoekopdracht laden..." />
          </div>
        </div>
      </div>
    );
  }

  // Show error state if search not found or other error
  if (error) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-medium">Fout</h2>
            <p className="text-red-600 mt-1">
              {error instanceof Error ? error.message : "Er is een fout opgetreden"}
            </p>
            <div className="mt-4 flex space-x-3">
              <Button onClick={() => navigate('/search/new')}>
                Nieuwe Zoekopdracht
              </Button>
              <Button variant="outline" onClick={() => navigate('/history')}>
                Terug naar overzicht
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto h-full">
        <div>
          <SearchForm searchId={id} />
        </div>
      </div>
    </div>
  );
}
