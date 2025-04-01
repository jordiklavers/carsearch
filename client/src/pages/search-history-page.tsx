import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { SearchList } from "@/components/search/search-list";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export default function SearchHistoryPage() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const initialStatus = urlParams.get("status") || "all";
  
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    
    navigate(`/history?${params.toString()}`);
  };
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Zoekopdrachten Geschiedenis</h1>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button onClick={() => navigate("/search/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Zoekopdracht
          </Button>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-slate-900">Alle Zoekopdrachten</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <Select
                value={statusFilter}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="active">Actief</SelectItem>
                  <SelectItem value="completed">Voltooid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <SearchList statusFilter={statusFilter} />
      </div>
    </div>
  );
}
