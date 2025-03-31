import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AdminDevPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Admin Ontwikkelaarstools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Gebruikersnaam
            </label>
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
    </div>
  );
}