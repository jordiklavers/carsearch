import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Extend the schema with validation
const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(8, "Wachtwoord moet minimaal 8 karakters bevatten"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submission
  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }

  // Handle register submission
  function onRegisterSubmit(data: RegisterFormValues) {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col sm:flex-row items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Inloggen</TabsTrigger>
            <TabsTrigger value="register">Registreren</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Inloggen</CardTitle>
                <CardDescription>
                  Log in om uw auto zoekopdrachten te beheren.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gebruikersnaam</FormLabel>
                          <FormControl>
                            <Input placeholder="Uw gebruikersnaam" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wachtwoord</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Uw wachtwoord" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Bezig..." : "Inloggen"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Registreren</CardTitle>
                <CardDescription>
                  Maak een nieuw account aan om auto zoekopdrachten te beheren.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gebruikersnaam</FormLabel>
                          <FormControl>
                            <Input placeholder="Kies een gebruikersnaam" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wachtwoord</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Kies een wachtwoord" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bevestig wachtwoord</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Bevestig uw wachtwoord" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Bezig..." : "Registreren"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* App Hero/Info Section */}
      <div className="hidden sm:block w-full max-w-md p-8 ml-8">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center text-3xl font-bold text-primary mb-2">
            <i className="fas fa-car-side text-accent mr-2"></i>
            CarSearch Pro
          </div>
          <p className="text-slate-600">Uw specialistische auto-zoekplatform</p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <i className="fas fa-search"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-primary">Zoekopdrachten beheren</h3>
              <p className="mt-1 text-sm text-slate-600">Maak en beheer gedetailleerde auto zoekopdrachten voor uw klanten.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <i className="fas fa-file-pdf"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-primary">PDF Generatie</h3>
              <p className="mt-1 text-sm text-slate-600">Genereer professionele PDF bestanden met uw logo en branding.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
              <i className="fas fa-history"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-primary">Geschiedenis bijhouden</h3>
              <p className="mt-1 text-sm text-slate-600">Houd al uw zoekopdrachten bij en bewerk ze wanneer nodig.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
