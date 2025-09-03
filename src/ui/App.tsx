import { useEffect } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { useGraphStore } from "@/lib/store/graphStore";

export function App() {
  const { setConfig } = useGraphStore();

  useEffect(() => {
    const url = new URL(window.location.href);
    const appId = url.searchParams.get("applicationId");
    const apiKey = url.searchParams.get("apiKey") ?? undefined;
    if (appId) setConfig(appId, apiKey);
  }, [setConfig]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1 }}>
        <GraphCanvas />
      </div>
    </div>
  );
}
