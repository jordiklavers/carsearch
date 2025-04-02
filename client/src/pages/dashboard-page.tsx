import { useState } from "react";
import { useLocation } from "wouter";
import { SearchStats } from "@/components/search/search-stats";
import { SearchList } from "@/components/search/search-list";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Dashboard */}
      <div className="container mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button onClick={() => navigate("/search/new")}>
              <i className="fas fa-plus mr-2"></i>
              Nieuwe Zoekopdracht
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <SearchStats />
        
        {/* Recent Searches */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h2 className="text-lg font-medium text-slate-900">Recente Zoekopdrachten</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
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
          <SearchList statusFilter={statusFilter as "all" | "active" | "completed"} />
        </div>
      </div>
    </div>
  );
}
