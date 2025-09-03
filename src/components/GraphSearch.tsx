"use client";
import { useMemo, useState } from "react";
import { useGraphStore } from "@/lib/store/graphStore";
import { toNodeId } from "@/lib/deps/types";

export function GraphSearch() {
  const { graph, setRoot } = useGraphStore();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!graph || !q) return [] as { id: string; label: string }[];
    const lower = q.toLowerCase();
    return graph
      .getAllNodes()
      .filter(
        (n) =>
          (n.name ?? n.key).toLowerCase().includes(lower) ||
          n.key.toLowerCase().includes(lower)
      )
      .slice(0, 20)
      .map((n) => ({ id: toNodeId(n), label: `${n.type}:${n.name ?? n.key}` }));
  }, [graph, q]);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 4, padding: 8 }}
    >
      <input
        placeholder="Search nodes"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q && (
        <div
          style={{ maxHeight: 240, overflow: "auto", border: "1px solid #ddd" }}
        >
          {results.map((r) => (
            <div
              key={r.id}
              style={{ padding: 6, cursor: "pointer" }}
              onClick={() => {
                const [type, key] = r.id.split(":");
                setRoot({ type: type as any, key });
              }}
            >
              {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
