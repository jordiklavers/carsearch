import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10">
      <div className="flex justify-around p-2">
        <Link href="/">
          <a className={cn(
            "flex flex-col items-center p-2",
            location === "/" ? "text-accent" : "text-slate-500"
          )}>
            <i className="fas fa-tachometer-alt text-lg"></i>
            <span className="text-xs mt-1">Dashboard</span>
          </a>
        </Link>
        
        <Link href="/search/new">
          <a className={cn(
            "flex flex-col items-center p-2",
            location === "/search/new" ? "text-accent" : "text-slate-500"
          )}>
            <i className="fas fa-search text-lg"></i>
            <span className="text-xs mt-1">Nieuw</span>
          </a>
        </Link>
        
        <Link href="/history">
          <a className={cn(
            "flex flex-col items-center p-2",
            location === "/history" ? "text-accent" : "text-slate-500"
          )}>
            <i className="fas fa-history text-lg"></i>
            <span className="text-xs mt-1">Geschiedenis</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
