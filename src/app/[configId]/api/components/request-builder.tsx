"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestBuilderProps {
  method: HttpMethod;
  endpoint: string;
  loading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onEndpointChange: (endpoint: string) => void;
  onSend: () => void;
  requiresAuth?: boolean;
  isAuthenticated?: boolean;
}

export function RequestBuilder({
  method,
  endpoint,
  loading,
  onMethodChange,
  onEndpointChange,
  onSend,
  requiresAuth = false,
  isAuthenticated = false,
}: RequestBuilderProps) {
  const isDisabled = loading || (requiresAuth && !isAuthenticated);
  const buttonTitle =
    requiresAuth && !isAuthenticated
      ? "Authentication required to make this request"
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-[200px]">
          <Label className="text-glow-blue">Method</Label>
          <RadioGroup
            value={method}
            onValueChange={(value) => onMethodChange(value as HttpMethod)}
            className="flex gap-3 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="GET"
                id="method-get"
                className="border-glow-purple/30"
              />
              <Label
                htmlFor="method-get"
                className="hover:text-glow-purple transition-colors duration-300"
              >
                GET
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="POST"
                id="method-post"
                className="border-glow-purple/30"
              />
              <Label
                htmlFor="method-post"
                className="hover:text-glow-purple transition-colors duration-300"
              >
                POST
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex-1">
          <Label className="text-glow-blue">Endpoint</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={endpoint}
              onChange={(e) => onEndpointChange(e.target.value)}
              placeholder="/objects"
              className={cn(
                "font-mono",
                "glass-border",
                "hover:border-glow-purple/20",
                "focus:border-glow-purple/30",
                "transition-all duration-300"
              )}
            />
            <Button
              onClick={onSend}
              disabled={isDisabled}
              title={buttonTitle}
              className={cn(
                "gap-2 min-w-[100px]",
                "glass-border",
                "hover:border-glow-purple/20",
                "hover:text-glow-purple hover:text-glow-sm",
                "transition-all duration-300",
                "disabled:opacity-50"
              )}
            >
              <Send className="w-4 h-4" />
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
