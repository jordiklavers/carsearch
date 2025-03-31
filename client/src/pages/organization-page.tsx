import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Organization, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CarLoading } from "@/components/ui/car-loading";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function OrganizationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Get organization data
  const { data: organization, isLoading: orgLoading } = useQuery<Organization>({
    queryKey: ["/api/organizations", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const res = await fetch(`/api/organizations/${user.organizationId}`);
      if (!res.ok) throw new Error("Failed to load organization");
      return await res.json();
    },
    enabled: !!user?.organizationId,
  });

  // Get organization members
  const { data: members, isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/organizations", user?.organizationId, "members"],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      const res = await fetch(
        `/api/organizations/${user.organizationId}/members`,
      );
      if (!res.ok) throw new Error("Failed to load members");
      return await res.json();
    },
    enabled: !!user?.organizationId && user?.role === "admin",
  });

  // Organization update mutation
  const updateOrgMutation = useMutation({
    mutationFn: async (updatedData: Partial<Organization>) => {
      const res = await apiRequest(
        "PATCH",
        `/api/organizations/${organization?.id}`,
        updatedData,
      );
      return await res.json();
    },
    onSuccess: (updatedOrg) => {
      queryClient.setQueryData(
        ["/api/organizations", user?.organizationId],
        updatedOrg,
      );
      toast({
        title: "Organisatie bijgewerkt",
        description: "De gegevens zijn succesvol opgeslagen.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description:
          error.message ||
          "Er is een fout opgetreden bij het bijwerken van de organisatie.",
        variant: "destructive",
      });
    },
  });

  // Logo upload handler
  const handleLogoUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!logoFile || !organization) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("logo", logoFile);

      const res = await fetch(`/api/organizations/${organization.id}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload logo");
      }

      const data = await res.json();
      queryClient.setQueryData(
        ["/api/organizations", user?.organizationId],
        data.organization,
      );

      toast({
        title: "Logo geüpload",
        description: "Het logo is succesvol geüpload.",
      });

      setLogoFile(null);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het uploaden van het logo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Role update mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: number;
      role: "admin" | "member";
    }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/role`, {
        role,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", user?.organizationId, "members"],
      });
      toast({
        title: "Rol bijgewerkt",
        description: "De gebruikersrol is succesvol bijgewerkt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description:
          error.message ||
          "Er is een fout opgetreden bij het bijwerken van de rol.",
        variant: "destructive",
      });
    },
  });

  // General organization update handler
  const handleGeneralSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const updatedData = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      zipCode: formData.get("zipCode") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      website: formData.get("website") as string,
    };

    updateOrgMutation.mutate(updatedData);
  };

  // PDF styling update handler
  const handlePdfSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const updatedData = {
      pdfPrimaryColor: formData.get("pdfPrimaryColor") as string,
      pdfSecondaryColor: formData.get("pdfSecondaryColor") as string,
      pdfCompanyName: formData.get("pdfCompanyName") as string,
      pdfContactInfo: formData.get("pdfContactInfo") as string,
    };

    updateOrgMutation.mutate(updatedData);
  };

  // Role change handler
  const handleRoleChange = (userId: number, role: "admin" | "member") => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  if (orgLoading) {
    return <CarLoading fullscreen text="Organisatie gegevens laden..." />;
  }

  if (!organization && !orgLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header toggleMobileMenu={toggleMobileMenu} />
          <MobileNav />
          <main className="flex-1 overflow-y-auto bg-slate-50 pb-16 md:pb-0">
            <div className="container mx-auto py-10">
              <Card className="max-w-lg mx-auto">
                <CardHeader>
                  <CardTitle>Geen organisatie gevonden</CardTitle>
                  <CardDescription>
                    Je bent nog niet toegewezen aan een organisatie. Neem contact op
                    met een beheerder om toegang te krijgen.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold mb-6">Organisatie Beheer</h1>
            
            <Tabs defaultValue="general">
              <TabsList className="mb-4">
                <TabsTrigger value="general">Algemeen</TabsTrigger>
                <TabsTrigger value="branding">Huisstijl</TabsTrigger>
                {user?.role === "admin" && (
                  <TabsTrigger value="members">Leden</TabsTrigger>
                )}
              </TabsList>

              {/* General tab */}
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>Algemene Informatie</CardTitle>
                    <CardDescription>
                      Beheer de algemene gegevens van je organisatie.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form id="generalForm" onSubmit={handleGeneralSubmit}>
                      <div className="grid gap-6 mb-6">
                        <div className="grid gap-3">
                          <Label htmlFor="name">Organisatie naam</Label>
                          <Input
                            id="name"
                            name="name"
                            defaultValue={organization?.name}
                          />
                        </div>

                        <div className="grid gap-3">
                          <Label htmlFor="address">Adres</Label>
                          <Input
                            id="address"
                            name="address"
                            defaultValue={organization?.address || ""}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-3">
                            <Label htmlFor="city">Plaats</Label>
                            <Input
                              id="city"
                              name="city"
                              defaultValue={organization?.city || ""}
                            />
                          </div>
                          <div className="grid gap-3">
                            <Label htmlFor="zipCode">Postcode</Label>
                            <Input
                              id="zipCode"
                              name="zipCode"
                              defaultValue={organization?.zipCode || ""}
                            />
                          </div>
                        </div>

                        <div className="grid gap-3">
                          <Label htmlFor="phone">Telefoonnummer</Label>
                          <Input
                            id="phone"
                            name="phone"
                            defaultValue={organization?.phone || ""}
                          />
                        </div>

                        <div className="grid gap-3">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={organization?.email || ""}
                          />
                        </div>

                        <div className="grid gap-3">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            name="website"
                            defaultValue={organization?.website || ""}
                          />
                        </div>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      form="generalForm"
                      disabled={updateOrgMutation.isPending}
                    >
                      {updateOrgMutation.isPending ? (
                        <CarLoading size="sm" type="spinner" text="Opslaan..." />
                      ) : (
                        "Opslaan"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Branding tab */}
              <TabsContent value="branding">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Logo</CardTitle>
                      <CardDescription>
                        Upload het logo van je organisatie. Dit logo wordt ook
                        gebruikt in PDF documenten.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        {organization?.logo ? (
                          <div className="w-40 h-40 border rounded-md flex items-center justify-center overflow-hidden">
                            <img
                              src={`/api/images/${organization.logo}`}
                              alt="Organisatie logo"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-40 h-40 bg-slate-100 rounded-md flex items-center justify-center">
                            <p className="text-sm text-slate-500">Geen logo</p>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleLogoUpload} className="space-y-4">
                        <div className="grid gap-3">
                          <Label htmlFor="logo">Upload nieuw logo</Label>
                          <Input
                            id="logo"
                            name="logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                          />
                        </div>

                        <Button type="submit" disabled={!logoFile || isUploading}>
                          {isUploading ? (
                            <CarLoading size="sm" type="spinner" />
                          ) : (
                            "Logo uploaden"
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>PDF Styling</CardTitle>
                      <CardDescription>
                        Pas de visuele stijl van de gegenereerde PDF documenten aan.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form id="pdfForm" onSubmit={handlePdfSubmit}>
                        <div className="grid gap-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-3">
                              <Label htmlFor="pdfPrimaryColor">Primaire kleur</Label>
                              <div className="flex">
                                <Input
                                  id="pdfPrimaryColor"
                                  name="pdfPrimaryColor"
                                  defaultValue={
                                    organization?.pdfPrimaryColor || "#4a6da7"
                                  }
                                  className="rounded-r-none"
                                  type="color"
                                />
                                <div
                                  className="w-10 border border-l-0 rounded-r-md"
                                  style={{
                                    backgroundColor:
                                      organization?.pdfPrimaryColor || "#4a6da7",
                                  }}
                                />
                              </div>
                            </div>

                            <div className="grid gap-3">
                              <Label htmlFor="pdfSecondaryColor">
                                Secundaire kleur
                              </Label>
                              <div className="flex">
                                <Input
                                  id="pdfSecondaryColor"
                                  name="pdfSecondaryColor"
                                  defaultValue={
                                    organization?.pdfSecondaryColor || "#333333"
                                  }
                                  className="rounded-r-none"
                                  type="color"
                                />
                                <div
                                  className="w-10 border border-l-0 rounded-r-md"
                                  style={{
                                    backgroundColor:
                                      organization?.pdfSecondaryColor || "#333333",
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3">
                            <Label htmlFor="pdfCompanyName">
                              Bedrijfsnaam in PDF
                            </Label>
                            <Input
                              id="pdfCompanyName"
                              name="pdfCompanyName"
                              defaultValue={
                                organization?.pdfCompanyName || "CarSearch Pro"
                              }
                            />
                          </div>

                          <div className="grid gap-3">
                            <Label htmlFor="pdfContactInfo">
                              Contactgegevens in PDF
                            </Label>
                            <Input
                              id="pdfContactInfo"
                              name="pdfContactInfo"
                              defaultValue={organization?.pdfContactInfo || ""}
                            />
                          </div>
                        </div>
                      </form>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        form="pdfForm"
                        disabled={updateOrgMutation.isPending}
                      >
                        {updateOrgMutation.isPending ? (
                          <CarLoading size="sm" type="spinner" text="Opslaan..." />
                        ) : (
                          "Opslaan"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>

              {/* Members tab - only visible for admins */}
              {user?.role === "admin" && (
                <TabsContent value="members">
                  <Card>
                    <CardHeader>
                      <CardTitle>Organisatieleden</CardTitle>
                      <CardDescription>
                        Beheer de gebruikers die toegang hebben tot deze organisatie.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {membersLoading ? (
                        <CarLoading text="Leden laden..." />
                      ) : (
                        <div className="rounded-md border">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-slate-50 border-b">
                                <th className="p-3 text-left font-medium text-sm">
                                  Naam
                                </th>
                                <th className="p-3 text-left font-medium text-sm">
                                  Email
                                </th>
                                <th className="p-3 text-left font-medium text-sm">
                                  Rol
                                </th>
                                <th className="p-3 text-left font-medium text-sm">
                                  Beheer
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {members && members.length > 0 ? (
                                members.map((member: User) => (
                                  <tr key={member.id} className="border-b">
                                    <td className="p-3 text-sm">
                                      {member.firstName} {member.lastName}
                                      {member.id === user.id && (
                                        <span className="text-xs text-slate-500 ml-1">
                                          (jij)
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-sm">{member.email}</td>
                                    <td className="p-3 text-sm capitalize">
                                      {member.role}
                                    </td>
                                    <td className="p-3">
                                      {member.id !== user.id && (
                                        <div className="flex space-x-2">
                                          {member.role === "member" ? (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                handleRoleChange(member.id, "admin")
                                              }
                                              disabled={
                                                updateUserRoleMutation.isPending
                                              }
                                            >
                                              Maak admin
                                            </Button>
                                          ) : (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                handleRoleChange(member.id, "member")
                                              }
                                              disabled={
                                                updateUserRoleMutation.isPending
                                              }
                                            >
                                              Maak lid
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="p-4 text-center text-sm text-slate-500"
                                  >
                                    Geen leden gevonden
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}