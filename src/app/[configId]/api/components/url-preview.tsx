"use client";

interface UrlPreviewProps {
  url: string;
}

export function UrlPreview({ url }: UrlPreviewProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-glow-blue">
        Full Request URL
      </label>
      <div className="p-3 rounded-md glass-card font-mono text-sm break-all">
        {url}
      </div>
    </div>
  );
}
