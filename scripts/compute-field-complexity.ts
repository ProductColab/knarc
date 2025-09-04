import { readFileSync } from "node:fs";
import { buildGraph } from "@/lib/deps/build";
import type { KnackApplication } from "@/lib/knack/types/application";
import { computeComplexity } from "@/lib/services/complexity";

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

const result = computeComplexity(graph, field);
console.log(
  JSON.stringify(
    {
      field: fieldKey,
      score: result.score,
      breakdown: result.breakdown,
    },
    null,
    2
  )
);
