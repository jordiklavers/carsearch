import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateUserProfileSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Loader2, UserCircle, Upload } from "lucide-react";

// Form schema for profile update
const profileFormSchema = updateUserProfileSchema.pick({
  firstName: true,
  lastName: true, 
  email: true,
  phone: true,
}).extend({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email("Voer een geldig e-mailadres in"),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.profilePicture ? `/api/images/${user.profilePicture}` : null
  );

  // Profile form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("PATCH", "/api/profile", data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Er is een fout opgetreden");
      }
      
      // Update the user data in the cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Profiel bijgewerkt",
        description: "Uw profielgegevens zijn succesvol bijgewerkt",
      });
    } catch (error: any) {
      toast({
        title: "Fout bij bijwerken profiel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      
      const response = await fetch("/api/profile/picture", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Er is een fout opgetreden bij het uploaden");
      }
      
      const data = await response.json();
      
      // Update the avatar URL
      setAvatarUrl(`/api/images/${data.picturePath}?${new Date().getTime()}`);
      
      // Invalidate user data to reflect changes
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Profielfoto geüpload",
        description: "Uw profielfoto is succesvol bijgewerkt",
      });
    } catch (error: any) {
      toast({
        title: "Fout bij uploaden",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Get user's initials for avatar fallback
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="container py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Mijn Profiel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profielfoto</CardTitle>
            <CardDescription>
              Upload een nieuwe profielfoto
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="w-32 h-32 mb-6">
              <AvatarImage src={avatarUrl || ""} alt={user?.username} />
              <AvatarFallback className="text-2xl">
                {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : getInitials()}
              </AvatarFallback>
            </Avatar>
            
            <Label 
              htmlFor="profile-picture" 
              className="cursor-pointer flex items-center justify-center gap-2 bg-muted py-2 px-4 rounded-md hover:bg-muted/80 transition-colors"
            >
              <Upload size={18} />
              <span>Kies een afbeelding</span>
            </Label>
            <Input 
              id="profile-picture" 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleProfilePictureChange}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground mt-2">
              JPEG, PNG of GIF, max 5MB
            </p>
          </CardContent>
        </Card>
        
        {/* Profile Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Persoonlijke Gegevens</CardTitle>
            <CardDescription>
              Werk uw persoonlijke gegevens bij
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voornaam</FormLabel>
                        <FormControl>
                          <Input placeholder="Uw voornaam" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achternaam</FormLabel>
                        <FormControl>
                          <Input placeholder="Uw achternaam" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mailadres</FormLabel>
                      <FormControl>
                        <Input placeholder="uw@email.nl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
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
                
                <div className="col-span-2 pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opslaan...
                      </>
                    ) : (
                      "Profiel Opslaan"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}