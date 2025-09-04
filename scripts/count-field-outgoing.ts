import { readFileSync } from "node:fs";
import { buildGraph } from "@/lib/deps/build";
import type { KnackApplication } from "@/lib/knack/types/application";

function loadSchema(path: string): KnackApplication {
  const json = JSON.parse(readFileSync(path, "utf-8"));
  return json.application as KnackApplication;
}

const schemaPath = process.argv[2] ?? "./schema.json";
const fieldKey = process.argv[3] ?? "field_1";

const app = loadSchema(schemaPath);
const graph = buildGraph(app);

const field = graph
  .getAllNodes()
  .find((n) => n.type === "field" && n.key === fieldKey);

if (!field) {
  console.error(`Field not found: ${fieldKey}`);
  process.exit(1);
}

const outgoing = graph.getOutgoing(field);
const breakdown: Record<string, number> = {};
for (const e of outgoing) breakdown[e.type] = (breakdown[e.type] ?? 0) + 1;

console.log(
  JSON.stringify(
    {
      field: fieldKey,
      outgoingCount: outgoing.length,
      breakdown,
    },
    null,
    2
  )
);
