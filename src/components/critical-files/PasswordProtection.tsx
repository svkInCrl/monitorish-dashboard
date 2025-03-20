
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

// This would normally be stored securely on the server side
// or in an environment variable, this is just for demonstration
const ADMIN_PASSWORD = "admin123";

interface PasswordProtectionProps {
  onAuthenticated: () => void;
}

export function PasswordProtection({ onAuthenticated }: PasswordProtectionProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate a network request
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        toast({
          title: "Authentication successful",
          description: "You now have access to critical files.",
        });
        onAuthenticated();
      } else {
        setError("Invalid password. Please try again.");
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "The password you entered is incorrect.",
        });
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Password Required</CardTitle>
        <CardDescription className="text-center">
          Enter your password to access critical files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Authenticate"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Contact your administrator if you don't have access.
      </CardFooter>
    </Card>
  );
}
