import { useParams } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchForm } from "@/components/search/search-form";
import { useState } from "react";

export default function SearchFormPage() {
  const { id } = useParams<{ id: string }>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar - Hidden on mobile */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Header toggleMobileMenu={toggleMobileMenu} />

        {/* Mobile Nav - Fixed to bottom */}
        <MobileNav />

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-50 pb-16 md:pb-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <SearchForm searchId={id} />
          </div>
        </main>
      </div>
    </div>
  );
}
