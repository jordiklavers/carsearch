import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Customer, InsertCustomer, insertCustomerSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Pencil, Trash2, Plus, Mail, Phone } from "lucide-react";
import { CarLoading } from "@/components/ui/car-loading";
import { useToast } from "@/hooks/use-toast";

// Extend the schema to make email validation more user-friendly
const createCustomerSchema = insertCustomerSchema.extend({
  email: z.string().email("Geldig e-mailadres is vereist"),
  firstName: z.string().min(1, "Voornaam is vereist"),
  lastName: z.string().min(1, "Achternaam is vereist"),
});

type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

export default function CustomersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Kon klanten niet laden");
      return res.json();
    },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Klant toegevoegd",
        description: "De klant is succesvol toegevoegd.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij toevoegen klant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: number; data: Partial<InsertCustomer> }) => {
      const res = await apiRequest("PATCH", `/api/customers/${data.id}`, data.data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      toast({
        title: "Klant bijgewerkt",
        description: "De klant is succesvol bijgewerkt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij bijwerken klant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/customers/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Klant verwijderd",
        description: "De klant is succesvol verwijderd.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij verwijderen klant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create form
  const createForm = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      notes: ""
    },
  });

  // Edit form
  const editForm = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      notes: ""
    },
  });

  // Reset and open Add dialog
  const handleOpenAddDialog = () => {
    createForm.reset();
    setIsAddDialogOpen(true);
  };

  // Reset and open Edit dialog
  const handleOpenEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    editForm.reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      zipCode: customer.zipCode || "",
      notes: customer.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  // Handle add form submission
  const onCreateSubmit = (data: CreateCustomerFormValues) => {
    createCustomerMutation.mutate(data);
  };

  // Handle edit form submission
  const onEditSubmit = (data: CreateCustomerFormValues) => {
    if (selectedCustomer) {
      updateCustomerMutation.mutate({
        id: selectedCustomer.id,
        data
      });
    }
  };

  // Handle delete customer
  const handleDeleteCustomer = (id: number) => {
    deleteCustomerMutation.mutate(id);
  };

  // No organization warning
  if (!user?.organizationId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Geen organisatie</CardTitle>
            <CardDescription>
              U moet lid zijn van een organisatie om klanten te kunnen beheren.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Klanten</h1>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Nieuwe Klant
        </Button>
      </div>

      {isLoading ? (
        <CarLoading text="Klanten laden..." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableCaption>
                {customers && customers.length > 0
                  ? `Lijst van ${customers.length} klanten`
                  : "Geen klanten gevonden"}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Adres</TableHead>
                  <TableHead>Toegevoegd op</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers && customers.length > 0 ? (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-2 text-slate-400" />
                            <a
                              href={`mailto:${customer.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {customer.email}
                            </a>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center text-sm mt-1">
                              <Phone className="h-3 w-3 mr-2 text-slate-400" />
                              <a
                                href={`tel:${customer.phone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {customer.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.address && customer.city ? (
                          <>
                            {customer.address}, {customer.zipCode || ""} {customer.city}
                          </>
                        ) : (
                          <span className="text-slate-400 text-sm italic">
                            Geen adres
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-sm">{format(customer.createdAt, 'dd-MM-yyyy')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEditDialog(customer)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bewerk klant</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Delete Customer */}
                          {user.role === "admin" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Weet u zeker dat u deze klant wilt verwijderen?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Deze actie kan niet ongedaan worden gemaakt. Dit verwijdert
                                    de klant permanent uit uw systeem.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCustomer(customer.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Verwijderen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Info className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-slate-600 mb-1">
                          Geen klanten gevonden
                        </p>
                        <p className="text-slate-400 text-sm max-w-md mx-auto">
                          U kunt een nieuwe klant toevoegen door op de
                          &quot;Nieuwe Klant&quot; knop te klikken.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nieuwe Klant Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe klant toe aan uw organisatie. Vul de onderstaande velden in.
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreateSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voornaam</FormLabel>
                      <FormControl>
                        <Input placeholder="Jan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Achternaam</FormLabel>
                      <FormControl>
                        <Input placeholder="de Vries" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mailadres</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jan.devries@voorbeeld.nl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefoonnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="06-12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Input placeholder="Voorbeeldstraat 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
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
                  control={createForm.control}
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

              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notities</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Voeg notities toe over deze klant..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                >
                  {createCustomerMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span> Bezig...
                    </>
                  ) : (
                    "Toevoegen"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Klant Bewerken</DialogTitle>
            <DialogDescription>
              Bewerk de gegevens van deze klant.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voornaam</FormLabel>
                      <FormControl>
                        <Input placeholder="Jan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Achternaam</FormLabel>
                      <FormControl>
                        <Input placeholder="de Vries" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mailadres</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jan.devries@voorbeeld.nl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefoonnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="06-12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Input placeholder="Voorbeeldstraat 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notities</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Voeg notities toe over deze klant..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  disabled={updateCustomerMutation.isPending}
                >
                  {updateCustomerMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span> Bezig...
                    </>
                  ) : (
                    "Opslaan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}