import { readFileSync } from "node:fs";
import { buildGraph } from "@/lib/deps/build";
import type { KnackApplication } from "@/lib/knack/types/application";
import { computeComplexity } from "@/lib/services/complexity";

function loadSchema(path: string): KnackApplication {
  const json = JSON.parse(readFileSync(path, "utf-8"));
  return json.application as KnackApplication;
}

const schemaPath = process.argv[2] ?? "./schema.json";
const entityType = (process.argv[3] ?? "field") as
  | "field"
  | "view"
  | "object"
  | "scene";
const entityKey = process.argv[4] ?? "field_1";

const app = loadSchema(schemaPath);
const graph = buildGraph(app);
const node = graph
  .getAllNodes()
  .find((n) => n.type === entityType && n.key === entityKey);

if (!node) {
  console.error(`Entity not found: ${entityType}:${entityKey}`);
  process.exit(1);
}

const result = computeComplexity(graph, node);
console.log(
  JSON.stringify(
    {
      entity: `${entityType}:${entityKey}`,
      score: result.score,
      breakdown: result.breakdown,
    },
    null,
    2
  )
);
