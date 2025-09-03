import { useQuery } from "@tanstack/react-query";
import { getGraph, fetchApplication } from "@/lib/knack/graph";

export function useKnackGraph(applicationId?: string, apiKey?: string) {
  return useQuery({
    queryKey: ["knack-graph", applicationId],
    queryFn: async () => {
      if (!applicationId) throw new Error("applicationId required");
      return getGraph(applicationId, apiKey);
    },
    enabled: Boolean(applicationId),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useKnackApplication(applicationId?: string, apiKey?: string) {
  return useQuery({
    queryKey: ["knack-app", applicationId],
    queryFn: async () => {
      if (!applicationId) throw new Error("applicationId required");
      return fetchApplication(applicationId, apiKey);
    },
    enabled: Boolean(applicationId),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
