import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

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
          <Label>Method</Label>
          <RadioGroup
            value={method}
            onValueChange={(value) => onMethodChange(value as HttpMethod)}
            className="flex gap-3 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="GET" id="method-get" />
              <Label htmlFor="method-get">GET</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="POST" id="method-post" />
              <Label htmlFor="method-post">POST</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex-1">
          <Label>Endpoint</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={endpoint}
              onChange={(e) => onEndpointChange(e.target.value)}
              placeholder="/objects"
              className="font-mono"
            />
            <Button
              onClick={onSend}
              disabled={isDisabled}
              title={buttonTitle}
              className="gap-2 min-w-[100px]"
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
