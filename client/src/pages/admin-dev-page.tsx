import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertOrganizationSchema } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Organization schema for the form
const createOrgSchema = insertOrganizationSchema.pick({
  name: true,
  email: true,
  phone: true,
  website: true,
  address: true,
  city: true,
  zipCode: true,
}).extend({
  name: z.string().min(1, "Naam is verplicht"),
});

// Schema for assigning user to organization
const assignUserSchema = z.object({
  username: z.string().min(1, "Gebruikersnaam is verplicht"),
  organizationId: z.string().min(1, "Organisatie is verplicht"),
});

type CreateOrgFormValues = z.infer<typeof createOrgSchema>;
type AssignUserFormValues = z.infer<typeof assignUserSchema>;

export default function AdminDevPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{ id: number; name: string }>>([]);
  const { toast } = useToast();

  // Load organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("/api/organizations");
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrganizations();
  }, []);

  // Form for creating organization
  const orgForm = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      zipCode: "",
    },
  });

  // Form for assigning user to organization
  const assignForm = useForm<AssignUserFormValues>({
    resolver: zodResolver(assignUserSchema),
    defaultValues: {
      username: "",
      organizationId: "",
    },
  });

  const makeAdmin = async () => {
    if (!username) {
      toast({
        title: "Gebruikersnaam vereist",
        description: "Vul een gebruikersnaam in om admin rechten toe te kennen",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/dev/make-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Er is een fout opgetreden");
      }

      const data = await response.json();
      toast({
        title: "Admin rechten toegekend",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createOrganization = async (data: CreateOrgFormValues) => {
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Er is een fout opgetreden");
      }

      const responseData = await response.json();
      toast({
        title: "Organisatie aangemaakt",
        description: `Organisatie "${data.name}" is succesvol aangemaakt.`,
      });
      
      // Reset form and refresh organizations list
      orgForm.reset();
      setOrganizations(prev => [...prev, { id: responseData.id, name: responseData.name }]);
    } catch (error: any) {
      toast({
        title: "Fout bij aanmaken organisatie",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const assignUserToOrg = async (data: AssignUserFormValues) => {
    try {
      const response = await fetch("/api/users/assign-organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          organizationId: parseInt(data.organizationId),
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Er is een fout opgetreden");
      }

      toast({
        title: "Gebruiker toegewezen",
        description: `Gebruiker "${data.username}" is succesvol toegewezen aan de organisatie.`,
      });
      
      // Reset form
      assignForm.reset();
    } catch (error: any) {
      toast({
        title: "Fout bij toewijzen gebruiker",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Ontwikkelaarstools</h1>
      
      <Tabs defaultValue="admin" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
          <TabsTrigger value="admin">Admin Rechten</TabsTrigger>
          <TabsTrigger value="organizations">Organisaties</TabsTrigger>
          <TabsTrigger value="assign">Gebruikers Toewijzen</TabsTrigger>
        </TabsList>
        
        {/* Admin Rights Tab */}
        <TabsContent value="admin">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Admin Rechten Toekennen
              </CardTitle>
              <CardDescription>
                Geef een bestaande gebruiker admin rechten.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Gebruikersnaam</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Voer de gebruikersnaam in"
                />
                <p className="text-sm text-muted-foreground">
                  De gebruiker moet al bestaan om admin rechten toe te kennen
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={makeAdmin} 
                disabled={isLoading} 
                className="w-full"
              >
                {isLoading ? "Bezig..." : "Maak Admin"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Organisatie Aanmaken
              </CardTitle>
              <CardDescription>
                Maak een nieuwe organisatie aan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...orgForm}>
                <form onSubmit={orgForm.handleSubmit(createOrganization)} className="space-y-4">
                  <FormField
                    control={orgForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Naam *</FormLabel>
                        <FormControl>
                          <Input placeholder="Bedrijfsnaam" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={orgForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input placeholder="info@bedrijf.nl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={orgForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefoon</FormLabel>
                          <FormControl>
                            <Input placeholder="020-1234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={orgForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.bedrijf.nl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={orgForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres</FormLabel>
                        <FormControl>
                          <Input placeholder="Straat 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={orgForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postcode</FormLabel>
                          <FormControl>
                            <Input placeholder="1234 AB" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={orgForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plaats</FormLabel>
                          <FormControl>
                            <Input placeholder="Amsterdam" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full mt-4">
                    Organisatie Aanmaken
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Assign Users Tab */}
        <TabsContent value="assign">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Gebruiker Toewijzen aan Organisatie
              </CardTitle>
              <CardDescription>
                Wijs een bestaande gebruiker toe aan een organisatie.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...assignForm}>
                <form onSubmit={assignForm.handleSubmit(assignUserToOrg)} className="space-y-4">
                  <FormField
                    control={assignForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gebruikersnaam</FormLabel>
                        <FormControl>
                          <Input placeholder="Gebruikersnaam" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={assignForm.control}
                    name="organizationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organisatie</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een organisatie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizations.map(org => (
                              <SelectItem key={org.id} value={org.id.toString()}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full mt-4">
                    Gebruiker Toewijzen
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}