import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Determine if we need to show the org menu for admins
  const showOrgMenu = user?.role === "admin" && user?.organizationId;
  const menuItems = showOrgMenu ? 6 : 5; // Added customers page

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10">
      <div className={`flex justify-around p-2 ${showOrgMenu ? 'gap-1' : ''}`}>
        <Link href="/">
          <div className={cn(
            "flex flex-col items-center p-2 cursor-pointer",
            location === "/" ? "text-accent" : "text-slate-500"
          )}>
            <i className="fas fa-tachometer-alt text-lg"></i>
            <span className="text-xs mt-1">Dashboard</span>
          </div>
        </Link>
        
        <Link href="/search/new">
          <div className={cn(
            "flex flex-col items-center p-2 cursor-pointer",
            location === "/search/new" ? "text-accent" : "text-slate-500"
          )}>
            <i className="fas fa-search text-lg"></i>
            <span className="text-xs mt-1">Nieuw</span>
          </div>
        </Link>
        
        <Link href="/history">
          <div className={cn(
            "flex flex-col items-center p-2 cursor-pointer",
            location === "/history" ? "text-accent" : "text-slate-500"
          )}>
            <i className="fas fa-history text-lg"></i>
            <span className="text-xs mt-1">Geschiedenis</span>
          </div>
        </Link>
        
        <Link href="/customers">
          <div className={cn(
            "flex flex-col items-center p-2 cursor-pointer",
            location === "/customers" ? "text-accent" : "text-slate-500"
          )}>
            <i className="fas fa-users text-lg"></i>
            <span className="text-xs mt-1">Klanten</span>
          </div>
        </Link>
        
        {showOrgMenu && (
          <Link href="/organization">
            <div className={cn(
              "flex flex-col items-center p-2 cursor-pointer",
              location === "/organization" ? "text-accent" : "text-slate-500"
            )}>
              <i className="fas fa-building text-lg"></i>
              <span className="text-xs mt-1">Organisatie</span>
            </div>
          </Link>
        )}
        
        <Link href="/profile">
          <div className={cn(
            "flex flex-col items-center p-2 cursor-pointer",
            location === "/profile" ? "text-accent" : "text-slate-500"
          )}>
            <i className="fas fa-user-cog text-lg"></i>
            <span className="text-xs mt-1">Profiel</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
