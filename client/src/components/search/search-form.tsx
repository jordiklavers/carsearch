import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CarLoading } from "@/components/ui/car-loading";
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
  insertSearchSchema, 
  InsertSearch, 
  Search, 
  carMakes, 
  carTypes, 
  carColors, 
  transmissionTypes, 
  fuelTypes,
  searchStatuses,
  Customer,
  InsertCustomer,
  insertCustomerSchema
} from "@shared/schema";
import { uploadImages } from "@/lib/file-upload";
import { PDFPreview } from "@/components/pdf/pdf-preview";
import { generatePDF } from "@/lib/pdf-generator";
import { CustomerSelectModal } from "@/components/search/customer-select-modal";

interface SearchFormProps {
  searchId?: string;
}

export function SearchForm({ searchId }: SearchFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<Search | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSelectModalOpen, setIsCustomerSelectModalOpen] = useState(false);

  // Fetch search data if editing
  const { data: searchData, isLoading: isLoadingSearch } = useQuery<Search>({
    queryKey: searchId ? [`/api/searches/${searchId}`] : [],
    enabled: !!searchId,
    gcTime: 0,
    refetchOnMount: true,
  });

  // Form setup with default values
  const form = useForm<InsertSearch>({
    resolver: zodResolver(insertSearchSchema),
    defaultValues: {
      customerFirstName: "",
      customerLastName: "",
      customerEmail: "",
      customerPhone: "",
      carMake: "",
      carModel: "",
      carType: "",
      carYear: "",
      carColor: "",
      carTransmission: "",
      carFuel: "",
      minPrice: 0,
      maxPrice: 0,
      additionalRequirements: "",
      status: "active",
    }
  });

  // Populate form when editing and data is loaded
  useEffect(() => {
    if (searchData) {
      console.log('Populating form with search data:', searchData);
      form.reset({
        customerFirstName: searchData.customerFirstName,
        customerLastName: searchData.customerLastName,
        customerEmail: searchData.customerEmail,
        customerPhone: searchData.customerPhone,
        carMake: searchData.carMake,
        carModel: searchData.carModel,
        carType: searchData.carType,
        carYear: searchData.carYear,
        carColor: searchData.carColor,
        carTransmission: searchData.carTransmission,
        carFuel: searchData.carFuel,
        minPrice: searchData.minPrice,
        maxPrice: searchData.maxPrice,
        additionalRequirements: searchData.additionalRequirements ?? "",
        status: searchData.status
      });
    }
  }, [searchData, form]);

  // Add debug logging for the query state
  useEffect(() => {
    console.log('Query state:', {
      searchId,
      isLoading: isLoadingSearch,
      hasData: !!searchData,
      data: searchData
    });
  }, [searchId, isLoadingSearch, searchData]);
  
  // Fetch customers for the organization
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: user?.organizationId ? ["/api/customers"] : [],
    enabled: !!user?.organizationId,
  });

  // Create/Update search mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertSearch) => {
      if (searchId) {
        // Update existing search
        const res = await apiRequest("PUT", `/api/searches/${searchId}`, data);
        return await res.json();
      } else {
        // Create new search
        const res = await apiRequest("POST", "/api/searches", data);
        return await res.json();
      }
    },
    onSuccess: async (data: Search) => {
      // Upload images if there are any
      if (imageFiles.length > 0) {
        try {
          const imageIds = await uploadImages(imageFiles, data.id);
          // Update the search with image IDs
          const updateRes = await apiRequest("PATCH", `/api/searches/${data.id}/images`, { images: imageIds });
          const updatedSearch = await updateRes.json();
          setCurrentSearch(updatedSearch);
        } catch (error) {
          toast({
            title: "Error uploading images",
            description: "Er is een fout opgetreden bij het uploaden van afbeeldingen.",
            variant: "destructive",
          });
          setCurrentSearch(data);
        }
      } else {
        setCurrentSearch(data);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/searches"] });
      setIsPdfPreviewOpen(true);
      
      toast({
        title: searchId ? "Zoekopdracht bijgewerkt" : "Zoekopdracht aangemaakt",
        description: "De zoekopdracht is succesvol " + (searchId ? "bijgewerkt" : "aangemaakt") + ".",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Download PDF mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      setIsDownloading(true);
      if (currentSearch) {
        await generatePDF(currentSearch);
      }
    },
    onSuccess: () => {
      setIsDownloading(false);
      toast({
        title: "PDF gedownload",
        description: "De PDF is succesvol gedownload.",
      });
      setIsPdfPreviewOpen(false);
      navigate("/");
    },
    onError: (error: Error) => {
      setIsDownloading(false);
      toast({
        title: "Fout bij downloaden",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: InsertSearch) => {
    mutation.mutate(data);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    downloadMutation.mutate();
  };

  // Cancel form
  const handleCancel = () => {
    navigate("/");
  };
  
  // Create customer form
  const customerForm = useForm<z.infer<typeof insertCustomerSchema>>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      notes: ""
    }
  });
  
  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: (customer: Customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomer(customer);
      setIsNewCustomerDialogOpen(false);
      
      // Fill in customer details in the search form
      form.setValue("customerFirstName", customer.firstName);
      form.setValue("customerLastName", customer.lastName);
      form.setValue("customerEmail", customer.email);
      form.setValue("customerPhone", customer.phone || "");
      
      toast({
        title: "Klant aangemaakt",
        description: `Klant ${customer.firstName} ${customer.lastName} is succesvol aangemaakt.`,
      });
      
      // Reset the customer form
      customerForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij aanmaken klant",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle customer selection
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.setValue("customerFirstName", customer.firstName);
    form.setValue("customerLastName", customer.lastName);
    form.setValue("customerEmail", customer.email);
    form.setValue("customerPhone", customer.phone || "");
  };
  
  // Handle new customer form submission
  const onCreateCustomerSubmit = (data: InsertCustomer) => {
    createCustomerMutation.mutate(data);
  };

  // Show loading state when fetching search data
  if (isLoadingSearch) {
    return ( 
      <div className="flex items-center justify-center py-12">
        <CarLoading text="Zoekopdracht laden..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {searchId ? "Zoekopdracht Bewerken" : "Nieuwe Zoekopdracht"}
        </h1>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleCancel}>
            <i className="fas fa-times mr-2"></i>
            Annuleren
          </Button>
          <Button 
            type="submit" 
            form="search-form" 
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <CarLoading className="mr-2" />
                <span>Bezig met opslaan...</span>
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                <span>Opslaan</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form 
          id="search-form" 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="flex flex-col min-h-0"
        >
          <div className="flex-1 space-y-4 overflow-y-auto">
            {/* Customer Details Section */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                <h3 className="text-lg font-bold leading-6 text-slate-900">Klantgegevens</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Vul de gegevens van de klant in of selecteer een bestaande klant.
                </p>
              </div>
              
              {/* Customer Selection */}
              {user?.organizationId && (
                <div className="px-4 py-3 sm:px-6 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">Bestaande klant:</span>
                      {selectedCustomer ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-900">
                            {selectedCustomer.firstName} {selectedCustomer.lastName}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(null);
                              form.setValue("customerFirstName", "");
                              form.setValue("customerLastName", "");
                              form.setValue("customerEmail", "");
                              form.setValue("customerPhone", "");
                            }}
                          >
                            <i className="fas fa-times text-slate-400 hover:text-slate-600" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-500">Geen klant geselecteerd</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCustomerSelectModalOpen(true)}
                      >
                        <i className="fas fa-search mr-2" />
                        Klant zoeken
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => setIsNewCustomerDialogOpen(true)}
                      >
                        <i className="fas fa-plus mr-2" />
                        Nieuwe klant
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="customerFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voornaam</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="customerLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Achternaam</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefoonnummer</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Car Details Section */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                <h3 className="text-lg font-bold leading-6 text-slate-900">Auto Details</h3>
                <p className="mt-1 text-sm text-slate-500">Specificeer de gewenste auto.</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="carMake"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Merk</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer merk" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {carMakes.map(make => (
                                <SelectItem key={make} value={make}>{make}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="carModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Bijv. X5, A4, C-Klasse" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="carType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {carTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="carYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bouwjaar</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Bijv. 2022 of 2020-2022" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="carColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kleur</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer kleur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {carColors.map(color => (
                                <SelectItem key={color} value={color}>{color}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="carTransmission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transmissie</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer transmissie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {transmissionTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="carFuel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brandstof</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer brandstof" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fuelTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="minPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimale prijs (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="maxPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximale prijs (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="sm:col-span-6">
                    <FormField
                      control={form.control}
                      name="additionalRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aanvullende eisen</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={3}
                              placeholder="Beschrijf eventuele specifieke wensen of eisen voor deze auto"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="mt-2 text-sm text-slate-500">Beschrijf eventuele specifieke wensen of eisen voor deze auto.</p>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status Section */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                <h3 className="text-lg font-bold leading-6 text-slate-900">Status</h3>
                <p className="mt-1 text-sm text-slate-500">Pas de status van deze zoekopdracht aan.</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {searchStatuses.map(status => (
                                <SelectItem key={status} value={status}>
                                  {status === "active" ? "Actief" : 
                                   status === "completed" ? "Afgerond" : 
                                   status === "cancelled" ? "Geannuleerd" : status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                          <p className="mt-2 text-sm text-slate-500">
                            Actief: Zoekopdracht is lopend. Afgerond: Auto is gevonden. Geannuleerd: Zoektocht gestopt.
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Images Section */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                <h3 className="text-lg font-bold leading-6 text-slate-900">Foto's</h3>
                <p className="mt-1 text-sm text-slate-500">Upload foto's van de gewenste auto.</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {/* Image Upload Button */}
                  <label className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center h-40 cursor-pointer hover:border-secondary hover:bg-slate-50">
                    <i className="fas fa-plus text-slate-400 text-2xl mb-2"></i>
                    <span className="text-sm text-slate-500">Upload foto</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      multiple
                    />
                  </label>
                  
                  {/* Display uploaded images */}
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative border border-slate-300 rounded-lg overflow-hidden h-40">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Uploaded ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-white rounded-md p-1 shadow-sm w-6 h-6 flex items-center justify-center"
                      >
                        <i className="fas fa-times text-red-500"></i>
                      </button>
                    </div>
                  ))}
                  
                  {/* Display existing images when editing */}
                  {searchData?.images && searchData.images.map((image, index) => (
                    <div key={`existing-${index}`} className="relative border border-slate-300 rounded-lg overflow-hidden h-40">
                      <img 
                        src={`/api/images/${image}`} 
                        alt={`Existing ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                        Bestaande afbeelding
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Save buttons */}
          <div className="flex justify-end bg-background py-4 border-t border-slate-200">
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                if (searchData) {
                  setCurrentSearch(searchData);
                  setIsPdfPreviewOpen(true);
                } else {
                  toast({
                    title: "Kan geen PDF genereren",
                    description: "Sla de zoekopdracht eerst op voordat je een PDF genereert.",
                    variant: "destructive"
                  });
                }
              }}
              disabled={!searchData || downloadMutation.isPending}
              className="mr-2"
            >
              {downloadMutation.isPending ? (
                <>
                  <CarLoading className="mr-2" />
                  <span>PDF genereren...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-download mr-2"></i>
                  <span>Download PDF</span>
                </>
              )}
            </Button>
            
            <Button 
              type="submit" 
              form="search-form" 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <CarLoading className="mr-2" />
                  <span>Bezig met opslaan...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  <span>Opslaan</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
      
      {/* Modals */}
      <PDFPreview 
        open={isPdfPreviewOpen} 
        onClose={() => setIsPdfPreviewOpen(false)} 
        search={currentSearch}
        onDownload={handleDownloadPDF}
        isDownloading={downloadMutation.isPending}
      />
      
      <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nieuwe klant toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe klant toe aan uw organisatie. Deze wordt direct geselecteerd voor deze zoekopdracht.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(onCreateCustomerSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={customerForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voornaam</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={customerForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Achternaam</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={customerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefoonnummer</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={customerForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={customerForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={customerForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plaats</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={customerForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notities</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Optionele notities over deze klant" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewCustomerDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCustomerMutation.isPending}
                >
                  {createCustomerMutation.isPending ? (
                    <>Bezig met opslaan...</>
                  ) : (
                    <>Klant toevoegen</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add CustomerSelectModal */}
      <CustomerSelectModal
        isOpen={isCustomerSelectModalOpen}
        onClose={() => setIsCustomerSelectModalOpen(false)}
        onSelect={handleSelectCustomer}
      />
    </div>
  );
}
