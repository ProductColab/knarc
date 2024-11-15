"use client";

import { cn } from "@/lib/utils";

export default function Content({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("container mx-auto px-4 md:px-8", className)}>
      {children}
    </div>
  );
}
