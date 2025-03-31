import { memo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Organization } from "@shared/schema";

// Memoize the organization name to prevent unnecessary re-renders
const OrganizationName = memo(({ organizationId }: { organizationId: number }) => {
  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organizations", organizationId],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${organizationId}`);
      if (!res.ok) throw new Error("Failed to load organization");
      return await res.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (!organization) return null;
  return (
    <div className="px-4 py-1 bg-primary-hover rounded-md text-sm text-center text-white w-full">
      {organization.name}
    </div>
  );
});

// Memoize the navigation items for better performance
const NavItem = memo(({ href, icon, label, currentPath }: { 
  href: string; 
  icon: string; 
  label: string;
  currentPath: string;
}) => {
  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer",
        currentPath === href
          ? "bg-primary-hover text-white" 
          : "text-slate-300 hover:bg-primary-hover hover:text-white"
      )}>
        <i className={`${icon} mr-3`}></i>
        {label}
      </div>
    </Link>
  );
});

// Memoize the user profile section
const UserProfile = memo(({ user, organization }: { 
  user: any;
  organization: Organization | null;
}) => {
  const { logoutMutation } = useAuth();
  
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
    <div className="flex flex-col p-4 border-t border-slate-700">
      <div className="flex items-center">
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={user?.profilePicture ? `/api/images/${user.profilePicture}` : undefined} 
            alt={user?.username} 
            loading="lazy"
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
          <p className="text-xs text-slate-300">
            {user?.role && user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </p>
        </div>
      </div>
      
      <button 
        className="text-xs text-slate-400 hover:text-white mt-3 text-center"
        onClick={() => logoutMutation.mutate()}
      >
        Uitloggen
      </button>
    </div>
  );
});

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Prefetch organization data to improve perceived performance
  const { data: organization } = useQuery<Organization>({
    queryKey: user?.organizationId ? ["/api/organizations", user.organizationId] : [],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const res = await fetch(`/api/organizations/${user.organizationId}`);
      if (!res.ok) throw new Error("Failed to load organization");
      return await res.json();
    },
    enabled: !!user?.organizationId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <div className="hidden md:flex md:w-64 md:flex-col bg-primary text-white h-screen sticky top-0 left-0">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center h-auto border-b border-slate-700 px-4 py-3">
          <div className="flex items-center space-x-2">
            <i className="fas fa-car-side text-accent"></i>
            <span className="text-xl font-bold">CarSearch Pro</span>
          </div>
          {user?.organizationId && (
            <div className="mt-2 w-full">
              <OrganizationName organizationId={user.organizationId} />
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
          <div className="px-4 space-y-1">
            <NavItem 
              href="/" 
              icon="fas fa-tachometer-alt" 
              label="Dashboard" 
              currentPath={location} 
            />
            
            <NavItem 
              href="/search/new" 
              icon="fas fa-search" 
              label="Nieuwe Zoekopdracht" 
              currentPath={location} 
            />
            
            <NavItem 
              href="/history" 
              icon="fas fa-history" 
              label="Geschiedenis" 
              currentPath={location} 
            />

            <NavItem 
              href="/customers" 
              icon="fas fa-users" 
              label="Klanten" 
              currentPath={location} 
            />
            
            <NavItem 
              href="/profile" 
              icon="fas fa-user-cog" 
              label="Mijn Profiel" 
              currentPath={location} 
            />

            {/* Organization Management Link for Admins */}
            {user?.role === "admin" && user?.organizationId && (
              <NavItem 
                href="/organization" 
                icon="fas fa-building" 
                label="Organisatie Beheer" 
                currentPath={location} 
              />
            )}
          </div>
        </nav>
        
        {/* User Profile */}
        {user && <UserProfile user={user} organization={organization || null} />}
      </div>
    </div>
  );
}