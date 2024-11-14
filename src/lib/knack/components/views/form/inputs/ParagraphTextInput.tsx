import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";
import type { KnackParagraphFieldFormat } from "@/lib/knack/types/fields";
import type { KnackFormInput } from "@/lib/knack/types/views";

interface ParagraphTextInputProps {
  format: KnackParagraphFieldFormat;
  source?: KnackFormInput["source"];
}

export function ParagraphTextInput({ format }: ParagraphTextInputProps) {
  return (
    <Textarea
      placeholder={format.default || "Enter text..."}
      disabled
      className="min-h-[100px]"
    />
  );
}

export function ParagraphTextFormat({ format }: ParagraphTextInputProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Type:</span>
        <Badge variant="secondary" className="capitalize">
          {format.validation.type === "rich_text"
            ? "Rich Text Editor"
            : "Plain Text"}
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
