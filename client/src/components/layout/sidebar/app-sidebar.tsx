import * as React from "react"
import {
  Zap,
  Search,
  History,
  User,
  Building,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useQuery } from "@tanstack/react-query"
import { Organization } from "@shared/schema"

import { NavProjects } from "@/components/layout/sidebar/nav-projects"
import { NavUser } from "@/components/layout/sidebar/nav-user"
import { TeamSwitcher } from "@/components/layout/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  
  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrg } = useQuery<Organization>({
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

  const teams = organization ? [{
    name: organization.name,
    logo: Building,
    plan: "Premium",
  }] : [];

  const projects = [
    {
      name: "Dashboard",
      url: "/",
      icon: Zap,
    },
    {
      name: "Nieuwe Zoekopdracht",
      url: "/search/new",
      icon: Search,
    },
    {
      name: "Geschiedenis",
      url: "/history",
      icon: History,
    },
    {
      name: "Klanten",
      url: "/customers",
      icon: User,
    },
    ...(user?.role === "admin" ? [{
      name: "Organisatie Beheer",
      url: "/organization",
      icon: Building,
    }] : [])
  ];

  if (!user) return null;

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        {isLoadingOrg ? (
          <div className="flex items-center justify-center h-12">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
        ) : (
          <TeamSwitcher teams={teams} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
          email: user.email,
          avatar: user.profilePicture ? `/api/images/${user.profilePicture}` : undefined,
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
