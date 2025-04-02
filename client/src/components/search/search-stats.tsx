import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResponse {
  searches: Search[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function SearchStats() {
  const { data, isLoading } = useQuery<SearchResponse>({
    queryKey: ["/api/searches"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/searches");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeSearches =
    data?.searches?.filter((s) => s.status === "active").length || 0;
  const completedSearches =
    data?.searches?.filter((s) => s.status === "completed").length || 0;
  const totalPDFs = data?.pagination.total || 0;

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
                <dt className="text-sm font-medium text-slate-500 truncate">
                  Actieve Zoekopdrachten
                </dt>
                <dd>
                  <div className="text-lg font-medium text-slate-900">
                    {activeSearches}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-slate-50 px-5 py-3">
          <div className="text-sm">
            <a
              href="/history?status=active"
              className="font-medium text-primary hover:text-primary/80"
            >
              Bekijk alle
            </a>
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
                <dt className="text-sm font-medium text-slate-500 truncate">
                  Voltooide Zoekopdrachten
                </dt>
                <dd>
                  <div className="text-lg font-medium text-slate-900">
                    {completedSearches}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-slate-50 px-5 py-3">
          <div className="text-sm">
            <a
              href="/history?status=completed"
              className="font-medium text-primary hover:text-primary/80"
            >
              Bekijk alle
            </a>
          </div>
        </div>
      </Card>

      {/* Downloaded PDFs */}
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-accent rounded-md p-3">
              <i className="fas fa-file-pdf text-primary"></i>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-slate-500 truncate">
                  Gedownloade PDFs
                </dt>
                <dd>
                  <div className="text-lg font-medium text-slate-900">
                    {totalPDFs}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-slate-50 px-5 py-3">
          <div className="text-sm">
            <a
              href="/history"
              className="font-medium text-primary hover:text-primary/80"
            >
              Bekijk alle
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
