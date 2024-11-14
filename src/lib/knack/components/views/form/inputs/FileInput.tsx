import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Lock, Upload, Globe, Key, Database, Link } from "lucide-react";
import type { HTMLAttributes } from "react";
import type { KnackFileField } from "@/lib/knack/fields/file";

export function FileInput({ ...props }: HTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Input
        type="file"
        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 file:transition-colors"
        {...props}
      />
      <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export function FileFormat({ field }: { field: KnackFileField }) {
  const { format } = field;
  return (
    <div className="grid gap-4 p-1">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          <Database className="w-4 h-4" />
          Storage:
        </span>
        <Badge
          variant="secondary"
          className="flex items-center gap-2 py-1 px-3"
        >
          {format.secure ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              Secure Storage
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5" />
              Standard Storage
            </>
          )}
        </Badge>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          <Key className="w-4 h-4" />
          Access:
        </span>
        <Badge
          variant="secondary"
          className="flex items-center gap-2 py-1 px-3"
        >
          {format.secure ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              Authenticated
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5" />
              Public
            </>
          )}
        </Badge>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          <Link className="w-4 h-4" />
          URL Type:
        </span>
        <Badge
          variant="secondary"
          className="flex items-center gap-2 py-1 px-3"
        >
          {format.secure ? (
            <>
              <Key className="w-3.5 h-3.5" />
              Signed S3 URL
            </>
          ) : (
            <>
              <Link className="w-3.5 h-3.5" />
              Direct S3 URL
            </>
          )}
        </Badge>
      </div>
    </div>
  );
}
