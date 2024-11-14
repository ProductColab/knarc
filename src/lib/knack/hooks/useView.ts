"use client";

import { useQuery } from "@tanstack/react-query";
import type { KnackView, KnackScene } from "../types";
import { findViewAndScene } from "../actions";

export function useView(viewKey: string) {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<{ view: KnackView; scene: KnackScene } | null, Error>({
    queryKey: ["view", viewKey],
    queryFn: () => findViewAndScene(viewKey),
    enabled: !!viewKey,
  });

  return {
    view: data?.view ?? null,
    scene: data?.scene ?? null,
    loading,
    error,
    refetch,
  };
}
