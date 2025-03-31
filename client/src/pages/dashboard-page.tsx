import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SearchStats } from "@/components/search/search-stats";
import { SearchList } from "@/components/search/search-list";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Hidden on mobile */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header toggleMobileMenu={toggleMobileMenu} />
        
        {/* Mobile Nav - Fixed to bottom */}
        <MobileNav />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 pb-16 md:pb-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {/* Dashboard */}
            <div className="mb-8">
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
                <SearchList statusFilter={statusFilter} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
