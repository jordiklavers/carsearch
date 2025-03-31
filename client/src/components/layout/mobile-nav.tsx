import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10">
      <div className="flex justify-around p-2">
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
