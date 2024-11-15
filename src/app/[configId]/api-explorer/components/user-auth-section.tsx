import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut } from "lucide-react";

interface UserAuthSectionProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onLogout: () => void;
  isAuthenticated: boolean;
  showForm: boolean;
  userEmail?: string;
}

export function UserAuthSection({
  onLogin,
  onLogout,
  isAuthenticated,
  showForm,
  userEmail,
}: UserAuthSectionProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(email, password);
      setPassword(""); // Clear password after successful login
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">User Authentication</Label>
        {isAuthenticated && (
          <Badge variant="default" className="truncate max-w-[50%]">
            Logged in as {userEmail}
          </Badge>
        )}
      </div>

      {showForm && !isAuthenticated && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            <LogIn className="w-4 h-4" />
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      )}

      {isAuthenticated && (
        <Button variant="outline" className="w-full gap-2" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      )}
    </div>
  );
}
