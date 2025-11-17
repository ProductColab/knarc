import { useEffect, useState } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { RuleExplorer } from "@/components/RuleExplorer";
import { useGraphStore } from "@/lib/store/graphStore";
import { Button } from "@/components/ui/button";
import { Network, List } from "lucide-react";

export function App() {
  const { setConfig } = useGraphStore();
  const [route, setRoute] = useState(() => {
    // Initialize from hash or default to graph
    return window.location.hash.slice(1) || "graph";
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const appId = url.searchParams.get("applicationId");
    const apiKey = url.searchParams.get("apiKey") ?? undefined;
    if (appId) setConfig(appId, apiKey);
  }, [setConfig]);

  useEffect(() => {
    // Update hash when route changes
    window.location.hash = route;
  }, [route]);

  useEffect(() => {
    // Listen for hash changes (back/forward buttons)
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(1) || "graph");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Navigation */}
      <div className="border-b bg-background px-4 py-2 flex items-center gap-2">
        <Button
          variant={route === "graph" ? "default" : "ghost"}
          size="sm"
          onClick={() => setRoute("graph")}
          className="flex items-center gap-2"
        >
          <Network className="h-4 w-4" />
          Graph
        </Button>
        <Button
          variant={route === "rules" ? "default" : "ghost"}
          size="sm"
          onClick={() => setRoute("rules")}
          className="flex items-center gap-2"
        >
          <List className="h-4 w-4" />
          Rules
        </Button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {route === "graph" ? (
          <GraphCanvas />
        ) : (
          <div className="h-full overflow-auto p-4">
            <RuleExplorer />
          </div>
        )}
      </div>
    </div>
  );
}
