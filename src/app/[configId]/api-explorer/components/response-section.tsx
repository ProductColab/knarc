import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export interface ApiResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
  duration: number;
}

interface ResponseSectionProps {
  response: ApiResponse | null;
}

export function ResponseSection({ response }: ResponseSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!response) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant={response.status < 400 ? "default" : "destructive"}>
              Status: {response.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {response.duration}ms
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={copyResponse}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Response
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="response" className="w-full">
          <TabsList>
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>
          <TabsContent value="response">
            <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent value="headers">
            <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
              {JSON.stringify(response.headers, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
