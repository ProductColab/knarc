"use client";

import { useQuery } from "@tanstack/react-query";
import type { KnackApplicationSchema } from "../types";
import { getApplicationSchema } from "../actions";

export function useApplication() {
  const {
    data: application,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<KnackApplicationSchema, Error>({
    queryKey: ["application"],
    queryFn: getApplicationSchema,
  });

  return {
    application,
    loading,
    error,
    refetch,
  };
}
