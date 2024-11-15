"use client";
import { Input } from "@/components/ui/input";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

export function ApiKeyInput({ apiKey, onApiKeyChange }: ApiKeyInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-glow-blue">API Key</label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-glow-purple transition-colors duration-300" />
            </TooltipTrigger>
            <TooltipContent className="glass-card border-glow">
              <p>Required for accessing the /objects endpoint</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Input
        type="password"
        value={apiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        placeholder="Enter your API key"
        className={cn(
          "font-mono",
          "glass-border",
          "hover:border-glow-purple/20",
          "focus:border-glow-purple/30",
          "transition-all duration-300"
        )}
      />
    </div>
  );
}
