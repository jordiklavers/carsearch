import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "@shared/schema";

export function SearchStats() {
  const { data: searches, isLoading } = useQuery<Search[]>({
    queryKey: ["/api/searches"],
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-white shadow rounded-lg overflow-hidden">
            <CardContent className="p-5">
              <div className="animate-pulse flex items-center">
                <div className="h-12 w-12 rounded-md bg-slate-200"></div>
                <div className="ml-5 space-y-2 w-full">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  const activeSearches = searches?.filter(s => s.status === "active").length || 0;
  const completedSearches = searches?.filter(s => s.status === "completed").length || 0;
  const totalPDFs = searches?.length || 0; // Assuming each search has a PDF
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      {/* Active Searches */}
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
              <i className="fas fa-search text-white"></i>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-slate-500 truncate">Actieve Zoekopdrachten</dt>
                <dd>
                  <div className="text-lg font-medium text-slate-900">{activeSearches}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-slate-50 px-5 py-3">
          <div className="text-sm">
            <a href="/history?status=active" className="font-medium text-primary hover:text-primary/80">Bekijk alle</a>
          </div>
        </div>
      </Card>
      
      {/* Completed Searches */}
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <i className="fas fa-check text-white"></i>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-slate-500 truncate">Voltooide Zoekopdrachten</dt>
                <dd>
                  <div className="text-lg font-medium text-slate-900">{completedSearches}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-slate-50 px-5 py-3">
          <div className="text-sm">
            <a href="/history?status=completed" className="font-medium text-primary hover:text-primary/80">Bekijk alle</a>
          </div>
        </div>
      </Card>
      
      {/* Downloaded PDFs */}
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-accent rounded-md p-3">
              <i className="fas fa-file-pdf text-white"></i>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-slate-500 truncate">Gedownloade PDFs</dt>
                <dd>
                  <div className="text-lg font-medium text-slate-900">{totalPDFs}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-slate-50 px-5 py-3">
          <div className="text-sm">
            <a href="/history" className="font-medium text-primary hover:text-primary/80">Bekijk alle</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
