"use client";

import { useQuery } from "@tanstack/react-query";
import type { KnackScene } from "../types";
import { getScenes } from "../actions";

export function useScenes() {
  const { data, error } = useQuery<KnackScene[]>({
    queryKey: ["scenes"],
    queryFn: getScenes,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    scenes: data ?? [],
    error,
  };
}
