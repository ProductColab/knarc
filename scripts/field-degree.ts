import { readFileSync } from "node:fs";
import { buildGraph } from "@/lib/deps/build";
import type { KnackApplication } from "@/lib/knack/types/application";
import { buildObjectRipple } from "@/lib/services/objectRipple";
import { toNodeId } from "@/lib/deps/types";
import {
  getDisplayedEndpoints,
  shouldDisplayEdgeInRipple,
} from "@/lib/services/edgeDisplay";

function loadSchema(path: string): KnackApplication {
  const json = JSON.parse(readFileSync(path, "utf-8"));
  return json.application as KnackApplication;
}

const schemaPath = process.argv[2] ?? "./schema.json";
const objectKey = process.argv[3] ?? "object_4";
const fieldKey = process.argv[4] ?? "field_1";

const app = loadSchema(schemaPath);
const fullGraph = buildGraph(app);
const ripple = buildObjectRipple(fullGraph, objectKey, {
  excludeEdgeTypes: ["displays", "contains"],
  maxDepth: Number.POSITIVE_INFINITY,
});

// Match GraphCanvas/toRippleFlow behavior (root-aware contains)
const rootId = ripple.root ? toNodeId(ripple.root) : undefined;
const edges = ripple.edges.filter((e) => shouldDisplayEdgeInRipple(e, rootId));

const id = `field:${fieldKey}`;

// Group edges by unique source->target, mirroring toRippleFlow grouping
const unique = new Map<
  string,
  { source: string; target: string; types: string[] }
>();
for (const e of edges) {
  const { sourceId: source, targetId: target } = getDisplayedEndpoints(e);
  const key = `${source}->${target}`;
  if (!unique.has(key)) {
    unique.set(key, { source, target, types: [e.type] });
  } else {
    const u = unique.get(key)!;
    if (!u.types.includes(e.type)) u.types.push(e.type);
  }
}

let incoming = 0;
let outgoing = 0;
for (const u of unique.values()) {
  if (u.target === id) incoming++;
  if (u.source === id) outgoing++;
}

console.log(
  JSON.stringify(
    { object: objectKey, field: fieldKey, incoming, outgoing },
    null,
    2
  )
);
