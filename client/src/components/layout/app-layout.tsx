import { useState, ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar/sidebar-old";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <SidebarProvider>
      {/* Sidebar - Hidden on mobile */}
      <AppSidebar />
      <SidebarInset>
        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <Header toggleMobileMenu={toggleMobileMenu} />

          {/* Mobile Nav - Fixed to bottom */}
          <MobileNav />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-slate-50 pb-16 md:pb-0">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
