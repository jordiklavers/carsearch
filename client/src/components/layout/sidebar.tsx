import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // Get user's initials for avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "";
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col bg-primary text-white h-full">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-slate-700 px-4">
          <div className="flex items-center space-x-2">
            <i className="fas fa-car-side text-accent"></i>
            <span className="text-xl font-bold">CarSearch Pro</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
          <div className="px-4 space-y-1">
            <Link href="/">
              <div className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer",
                location === "/" 
                  ? "bg-primary-hover text-white" 
                  : "text-slate-300 hover:bg-primary-hover hover:text-white"
              )}>
                <i className="fas fa-tachometer-alt mr-3 text-accent"></i>
                Dashboard
              </div>
            </Link>
            
            <Link href="/search/new">
              <div className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer",
                location === "/search/new" 
                  ? "bg-primary-hover text-white" 
                  : "text-slate-300 hover:bg-primary-hover hover:text-white"
              )}>
                <i className="fas fa-search mr-3"></i>
                Nieuwe Zoekopdracht
              </div>
            </Link>
            
            <Link href="/history">
              <div className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer",
                location === "/history" 
                  ? "bg-primary-hover text-white" 
                  : "text-slate-300 hover:bg-primary-hover hover:text-white"
              )}>
                <i className="fas fa-history mr-3"></i>
                Geschiedenis
              </div>
            </Link>
            
            <Link href="/profile">
              <div className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer",
                location === "/profile" 
                  ? "bg-primary-hover text-white" 
                  : "text-slate-300 hover:bg-primary-hover hover:text-white"
              )}>
                <i className="fas fa-user-cog mr-3"></i>
                Mijn Profiel
              </div>
            </Link>
          </div>
        </nav>
        
        {/* User Profile */}
        <div className="flex items-center p-4 border-t border-slate-700">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.profilePicture ? `/api/images/${user.profilePicture}` : undefined} 
              alt={user?.username} 
            />
            <AvatarFallback className="text-xs bg-slate-700 text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.username}
            </p>
            <button 
              className="text-xs text-slate-400 hover:text-white"
              onClick={() => logoutMutation.mutate()}
            >
              Uitloggen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
