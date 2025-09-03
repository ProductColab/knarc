"use client";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useGraphStore } from "@/lib/store/graphStore";
import { toNodeId } from "@/lib/deps/types";

export function UsageAccordion() {
  const {
    graph,
    setRoot,
    applicationId,
    setConfig,
    peerMode,
    peerDepth,
    setPeerMode,
    setPeerDepth,
  } = useGraphStore();
  const [appId, setAppId] = useState(applicationId ?? "");
  const qc = useQueryClient();

  const objects = useMemo(
    () => (graph ? graph.getAllNodes().filter((n) => n.type === "object") : []),
    [graph]
  );
  const scenes = useMemo(
    () => (graph ? graph.getAllNodes().filter((n) => n.type === "scene") : []),
    [graph]
  );

  return (
    <div className="w-full max-w-md border rounded">
      <div className="flex items-center gap-2 p-2 border-b">
        <input
          className="flex-1 border px-2 py-1 rounded text-sm"
          placeholder="Application ID"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
        />
        <button
          className="px-2 py-1 text-sm border rounded"
          onClick={() => setConfig(appId)}
        >
          Load
        </button>
        <button
          className="px-2 py-1 text-sm border rounded"
          onClick={() => {
            // Clear graph cache and invalidate queries to force refetch
            try {
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const { clearGraph } = require("@/lib/services/knack-graph");
              clearGraph(appId);
            } catch {}
            qc.invalidateQueries({ queryKey: ["knack-graph", appId] });
            qc.invalidateQueries({ queryKey: ["knack-app", appId] });
          }}
        >
          Refresh
        </button>
      </div>
      <div className="flex items-center gap-3 p-2 border-b">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={peerMode}
            onChange={(e) => setPeerMode(e.target.checked)}
          />
          Peer dependencies
        </label>
        <div className="flex items-center gap-2 text-sm">
          <span>Depth</span>
          <input
            className="w-20 border px-2 py-1 rounded text-sm"
            type="text"
            value={Number.isFinite(peerDepth) ? String(peerDepth) : "∞"}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v === "" || v === "∞") {
                setPeerDepth(Number.POSITIVE_INFINITY);
              } else {
                const n = Number(v);
                if (!Number.isNaN(n) && n >= 0) setPeerDepth(n);
              }
            }}
          />
        </div>
      </div>
      <Accordion type="multiple" defaultValue={["objects", "scenes"]}>
        <AccordionItem value="objects">
          <AccordionTrigger>Objects ({objects.length})</AccordionTrigger>
          <AccordionContent>
            <div className="max-h-72 overflow-auto space-y-2">
              {objects.map((o) => {
                const fields = graph
                  ? graph
                      .getOutgoing(o)
                      .filter(
                        (e) => e.type === "contains" && e.to.type === "field"
                      )
                      .map((e) => e.to)
                  : [];
                return (
                  <div key={toNodeId(o)} className="border rounded">
                    <div className="flex items-center justify-between px-2 py-1 bg-gray-50">
                      <button
                        className="text-left hover:underline"
                        onClick={() => setRoot({ type: "object", key: o.key })}
                      >
                        {o.name ?? o.key}
                      </button>
                      <span className="text-xs text-gray-500">
                        {fields.length} fields
                      </span>
                    </div>
                    {fields.length > 0 && (
                      <ul className="max-h-40 overflow-auto p-2 space-y-1">
                        {fields.map((f) => (
                          <li key={toNodeId(f)}>
                            <button
                              className="text-left w-full hover:bg-gray-50 px-2 py-1 rounded"
                              onClick={() =>
                                setRoot({ type: "field", key: f.key })
                              }
                            >
                              {f.name ?? f.key}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="scenes">
          <AccordionTrigger>Scenes ({scenes.length})</AccordionTrigger>
          <AccordionContent>
            <div className="max-h-72 overflow-auto space-y-2">
              {scenes.map((s) => {
                const viewsRaw = graph
                  ? graph
                      .getOutgoing(s)
                      .filter(
                        (e) => e.type === "contains" && e.to.type === "view"
                      )
                      .map((e) => e.to)
                  : [];
                const views = Array.from(
                  new Map(viewsRaw.map((v) => [toNodeId(v), v])).values()
                );
                return (
                  <div key={toNodeId(s)} className="border rounded">
                    <div className="flex items-center justify-between px-2 py-1 bg-gray-50">
                      <span>{s.name ?? s.key}</span>
                      <span className="text-xs text-gray-500">
                        {views.length} views
                      </span>
                    </div>
                    {views.length > 0 && (
                      <ul className="max-h-40 overflow-auto p-2 space-y-1">
                        {views.map((v) => (
                          <li key={toNodeId(v)}>
                            <button
                              className="text-left w-full hover:bg-gray-50 px-2 py-1 rounded"
                              onClick={() =>
                                setRoot({ type: "view", key: v.key })
                              }
                            >
                              {v.name ?? v.key}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
