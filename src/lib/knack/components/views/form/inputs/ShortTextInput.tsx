import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import type { KnackTextFieldFormat } from "@/lib/knack/types/fields";
import type { KnackFormInput } from "@/lib/knack/types/views";

interface ShortTextInputProps {
  format: KnackTextFieldFormat;
  source?: KnackFormInput["source"];
}

export function ShortTextInput({ format }: ShortTextInputProps) {
  return (
    <Input
      type="text"
      placeholder={format.default || "Enter text..."}
      disabled
    />
  );
}

export function ShortTextFormat({ format }: ShortTextInputProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Validation:</span>
        <Badge variant="secondary" className="capitalize">
          {format.validation.type === "none"
            ? "No Validation"
            : format.validation.type}
        </Badge>
      </div>

      {format.validation.regex && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Regex Pattern:</span>
          <Badge variant="outline">{format.validation.regex.pattern}</Badge>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Required:</span>
        <Badge variant="secondary" className="flex items-center gap-1">
          {format.required ? (
            <Check className="w-3 h-3" />
          ) : (
            <X className="w-3 h-3" />
          )}
          {format.required ? "Yes" : "No"}
        </Badge>
      </div>

      {format.default && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Default Value:</span>
          <Badge variant="secondary">{format.default}</Badge>
        </div>
      )}
    </div>
  );
}
