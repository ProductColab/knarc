import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Common Endpoints</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {COMMON_ENDPOINTS.map((ep) => (
          <TooltipProvider key={ep.path}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={`
                    relative justify-start font-mono text-sm w-full h-auto whitespace-normal
                    transition-colors duration-300 border overflow-hidden
                    ${
                      activeEndpoint === ep.path
                        ? "border-primary"
                        : "hover:border-primary/50 hover:bg-background/50"
                    }
                  `}
                  onClick={() => onEndpointSelect(ep.path)}
                >
                  {/* Animated background glow */}
                  {activeEndpoint === ep.path && (
                    <motion.div
                      layoutId="glow"
                      className="absolute inset-0 bg-primary/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}

                  <Badge
                    variant="outline"
                    className={`
                      relative mr-2 shrink-0 transition-all duration-300
                      ${
                        activeEndpoint === ep.path
                          ? "bg-primary-foreground text-primary border-primary-foreground"
                          : "text-muted-foreground hover:text-primary-foreground"
                      }
                    `}
                  >
                    {ep.method}
                  </Badge>
                  <motion.span
                    className={`
                      relative break-words transition-colors duration-300
                      ${
                        activeEndpoint === ep.path
                          ? "text-primary-foreground"
                          : ""
                      }
                    `}
                    initial={false}
                    animate={{
                      textShadow:
                        activeEndpoint === ep.path
                          ? "0 0 10px rgba(var(--primary-glow-rgb), 0.5)"
                          : "none",
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {ep.path.replace(/\//g, " / ")}
                  </motion.span>

                  {/* Animated glow effect */}
                  {activeEndpoint === ep.path && (
                    <motion.div
                      layoutId="shadow"
                      className="absolute inset-0 shadow-glow pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{ep.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
