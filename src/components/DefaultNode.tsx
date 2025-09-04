"use client";

import { cn } from "@/lib/utils";

export function NodeShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-md border border-gray-200 px-4 py-3 text-xs leading-[1.4] max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap flex flex-col gap-1",
        className
      )}
    >
      {children}
    </div>
  );
}
