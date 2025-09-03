import { KnackClient } from "@/lib/knack/client";
import { KnackApplication } from "@/lib/knack/types/application";
import { DependencyGraph } from "@/lib/deps/graph";
import { buildGraph } from "@/lib/deps/build";

const cache = new Map<string, DependencyGraph>();

export async function fetchApplication(
  applicationId: string,
  apiKey?: string
): Promise<KnackApplication> {
  const client = new KnackClient({ applicationId, apiKey });
  const data = await client.getApplicationSchema();
  return data.application;
}

export async function getGraph(
  applicationId: string,
  apiKey?: string,
  force = false
): Promise<DependencyGraph> {
  if (!force && cache.has(applicationId)) {
    return cache.get(applicationId)!;
  }
  const app = await fetchApplication(applicationId, apiKey);
  const graph = buildGraph(app);
  cache.set(applicationId, graph);
  return graph;
}

export function clearGraph(applicationId?: string): void {
  if (applicationId) cache.delete(applicationId);
  else cache.clear();
}
