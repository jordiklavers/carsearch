import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";

interface HeaderProps {
  toggleMobileMenu: () => void;
}

export function Header({ toggleMobileMenu }: HeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to history page with search query
      setLocation(`/history?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  return (
    <header className="bg-white shadow-sm z-20 sticky top-0">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile menu button */}
        <button 
          type="button" 
          className="md:hidden text-slate-500 hover:text-slate-900 focus:outline-none"
          onClick={toggleMobileMenu}
        >
          <i className="fas fa-bars"></i>
        </button>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full max-w-md hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-slate-400"></i>
          </div>
          <Input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-slate-50 placeholder-slate-500"
            placeholder="Zoeken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            type="submit" 
            variant="ghost" 
            size="sm" 
            className="absolute inset-y-0 right-0 px-3"
          >
            Zoek
          </Button>
        </form>
        
        {/* Mobile profile */}
        <div className="md:hidden flex items-center">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
            <i className="fas fa-user text-slate-500 text-sm"></i>
          </div>
        </div>
        
        {/* Desktop header right section */}
        <div className="hidden md:flex items-center space-x-4">
          <button type="button" className="p-1 rounded-full text-slate-400 hover:text-slate-500 focus:outline-none">
            <i className="fas fa-bell"></i>
          </button>
          
          <button type="button" className="p-1 rounded-full text-slate-400 hover:text-slate-500 focus:outline-none">
            <i className="fas fa-question-circle"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
