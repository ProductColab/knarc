"use client";

import { Views } from "./Views";
import { useViews } from "@/hooks/useViews";

export function ViewsContent() {
  const { data: views, error, isLoading } = useViews();

  return (
    <div className="container py-6">
      <Views views={views} error={error ?? undefined} loading={isLoading} />
    </div>
  );
}
