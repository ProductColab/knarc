"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const COMMON_ENDPOINTS = [
  {
    path: "/objects/{object_key}/records",
    description: "Get records from a specific object",
    method: "GET",
  },
  {
    path: "/pages/{scene_key}/views/{view_key}/records",
    description: "Get records from a specific view",
    method: "GET",
  },
] as const;

export type CommonEndpoint = (typeof COMMON_ENDPOINTS)[number]["path"];

interface CommonEndpointsProps {
  onEndpointSelect: (path: string) => void;
  activeEndpoint: string;
}

export function CommonEndpoints({
  onEndpointSelect,
  activeEndpoint,
}: CommonEndpointsProps) {
  // Helper to check if an endpoint pattern matches the active endpoint
  const isEndpointActive = (pattern: string) => {
    if (activeEndpoint === pattern) return true;

    // Special case for /objects endpoint
    if (pattern === "/objects/{object_key}/records") {
      return (
        activeEndpoint.startsWith("/objects/") &&
        activeEndpoint.endsWith("/records")
      );
    }

    // Special case for /pages endpoint
    if (pattern === "/pages/{scene_key}/views/{view_key}/records") {
      return (
        activeEndpoint.startsWith("/pages/") &&
        activeEndpoint.includes("/views/") &&
        activeEndpoint.endsWith("/records")
      );
    }

    return false;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-glow-blue">
        Common Endpoints
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {COMMON_ENDPOINTS.map((ep) => (
          <TooltipProvider key={ep.path}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "relative justify-start font-mono text-sm w-full h-auto whitespace-normal",
                    "glass-border",
                    "transition-all duration-300",
                    isEndpointActive(ep.path)
                      ? "border-glow-active text-glow-purple text-glow-sm"
                      : "hover:border-glow-purple/20 hover:text-glow-purple hover:text-glow-sm"
                  )}
                  onClick={() => onEndpointSelect(ep.path)}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "relative mr-2 shrink-0",
                      "transition-all duration-300",
                      isEndpointActive(ep.path)
                        ? "border-glow-purple text-glow-purple"
                        : "text-muted-foreground"
                    )}
                  >
                    {ep.method}
                  </Badge>
                  <span className="break-words">
                    {ep.path.replace(/\//g, " / ")}
                  </span>

                  {isEndpointActive(ep.path) && (
                    <motion.div
                      layoutId="glow"
                      className="absolute inset-0 bg-glow-gradient opacity-5 rounded-md"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.05 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="glass-card border-glow">
                <p>{ep.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
