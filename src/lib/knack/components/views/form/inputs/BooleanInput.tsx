import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { KnackBooleanFieldFormat } from "@/lib/knack/types/fields";
import type { KnackFormInput } from "@/lib/knack/types/views";

interface BooleanInputProps {
  format: KnackBooleanFieldFormat;
  source?: KnackFormInput["source"];
}

export function BooleanInput({ format }: BooleanInputProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="preview-checkbox"
        defaultChecked={format.default}
        disabled
      />
      <Label
        htmlFor="preview-checkbox"
        className="text-sm text-muted-foreground"
      >
        {format.format === "yes_no" ? "Yes/No" : "True/False"}
      </Label>
    </div>
  );
}

export function BooleanFormat({ format }: BooleanInputProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Input Type:</span>
        <Badge variant="secondary" className="capitalize">
          {format.input}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Format:</span>
        <Badge variant="secondary" className="capitalize">
          {format.format}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Default Value:</span>
        <Badge variant="secondary" className="flex items-center gap-1">
          {format.default ? (
            <Check className="w-3 h-3" />
          ) : (
            <X className="w-3 h-3" />
          )}
          {format.default ? "Yes" : "No"}
        </Badge>
      </div>

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
    </div>
  );
}
