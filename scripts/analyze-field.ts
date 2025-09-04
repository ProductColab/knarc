import { readFileSync } from "node:fs";
import { buildGraph } from "@/lib/deps/build";
import {
  buildFieldRipple,
  summarizeFieldRipple,
} from "@/lib/services/fieldRipple";
import {
  computeComplexity,
  builtinFeatures,
  computeObjectComplexityRollup,
} from "@/lib/services/complexity";
import type { KnackApplication } from "@/lib/knack/types/application";

function loadSchema(path: string): KnackApplication {
  const json = JSON.parse(readFileSync(path, "utf-8"));
  return json.application as KnackApplication;
}

const schemaPath = process.argv[2] ?? "./schema.json";
const objectKey = process.argv[3] ?? "object_4";
const fieldKey = process.argv[4] ?? "field_136";

const app = loadSchema(schemaPath);
const graph = buildGraph(app);

const ripple = buildFieldRipple(graph, fieldKey, { maxDepth: 50 });
const summary = summarizeFieldRipple(ripple);

const fieldNode = { type: "field" as const, key: fieldKey };
const fieldComplexity = computeComplexity(graph, fieldNode, {
  features: builtinFeatures,
  edgeExclusion: ["displays", "contains"],
});

console.log("Analyzing:", { objectKey, fieldKey });
console.log("Ripple summary:", summary);
console.log("Field complexity score:", fieldComplexity.score);
console.log("Field complexity breakdown:");
for (const b of fieldComplexity.breakdown) {
  console.log(
    `  - ${b.label}: raw=${b.raw} weight=${b.weight} weighted=${b.weighted}`
  );
}

// Inspect specific fields for detailed breakdown and ripple
const inspectFields = ["field_34", "field_171", fieldKey];
console.log("\nDetailed inspections:");
for (const fk of inspectFields) {
  const node = { type: "field" as const, key: fk };
  const res = computeComplexity(graph, node, {
    features: builtinFeatures,
    edgeExclusion: ["displays", "contains"],
  });
  const rip = buildFieldRipple(graph, fk, { maxDepth: 50 });
  const sum = summarizeFieldRipple(rip);
  console.log(`\nField ${fk} -> score=${res.score}`);
  for (const b of res.breakdown) {
    console.log(
      `  - ${b.label}: raw=${b.raw} weight=${b.weight} weighted=${b.weighted}`
    );
  }
  console.log("  Ripple:", sum);
}

const impactedFields = ripple.impactedFields
  .slice(0, 20)
  .map((n) => `${n.key}${n.name ? ` (${n.name})` : ""}`);
const impactedViews = ripple.impactedViews
  .slice(0, 20)
  .map((n) => `${n.key}${n.name ? ` (${n.name})` : ""}`);
console.log("Impacted fields (first 20):", impactedFields);
console.log("Impacted views (first 20):", impactedViews);

// Object complexity rollup
const objectRollup = computeObjectComplexityRollup(graph, objectKey, {
  features: builtinFeatures,
  edgeExclusion: ["displays", "contains"],
});
console.log("\nObject rollup complexity:", {
  object: `${objectRollup.object.key}${
    objectRollup.object.name ? ` (${objectRollup.object.name})` : ""
  }`,
  totalScore: objectRollup.totalScore,
  fieldCount: objectRollup.fieldResults.length,
});

// Print top 10 most complex fields in this object
const topFields = [...objectRollup.fieldResults]
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);
console.log("Top 10 fields by complexity:");
for (const r of topFields) {
  console.log(
    `  - ${r.node.key}${r.node.name ? ` (${r.node.name})` : ""}: score=${
      r.score
    }`
  );
}
