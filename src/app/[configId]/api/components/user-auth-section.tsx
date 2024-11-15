"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <Label className="text-sm font-medium text-glow-blue">
          User Authentication
        </Label>
        {isAuthenticated && (
          <Badge
            variant="default"
            className={cn(
              "truncate max-w-[50%]",
              "glass-border border-glow-purple",
              "text-glow-purple"
            )}
          >
            Logged in as {userEmail}
          </Badge>
        )}
      </div>

      {showForm && !isAuthenticated && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-glow-blue">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={cn(
                "glass-border",
                "hover:border-glow-purple/20",
                "focus:border-glow-purple/30",
                "transition-all duration-300"
              )}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-glow-blue">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={cn(
                "glass-border",
                "hover:border-glow-purple/20",
                "focus:border-glow-purple/30",
                "transition-all duration-300"
              )}
            />
          </div>
          <Button
            type="submit"
            className={cn(
              "w-full gap-2",
              "glass-border",
              "hover:border-glow-purple/20",
              "hover:text-glow-purple hover:text-glow-sm",
              "transition-all duration-300"
            )}
            disabled={isLoading}
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      )}

      {isAuthenticated && (
        <Button
          variant="outline"
          className={cn(
            "w-full gap-2",
            "glass-border",
            "hover:border-glow-purple/20",
            "hover:text-glow-purple hover:text-glow-sm",
            "transition-all duration-300"
          )}
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      )}
    </div>
  );
}
