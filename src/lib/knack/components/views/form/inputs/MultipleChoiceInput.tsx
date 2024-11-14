import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { KnackMultipleChoiceFieldFormat } from "@/lib/knack/types/fields";
import type { KnackFormInput } from "@/lib/knack/types/views";

interface MultipleChoiceInputProps {
  format: KnackMultipleChoiceFieldFormat;
  source?: KnackFormInput["source"];
}

export function MultipleChoiceInput({ format }: MultipleChoiceInputProps) {
  const normalizedOptions = format.options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option
  );

  if (format.input_type === "dropdown") {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={format.blank} />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <RadioGroup disabled defaultValue={format.default}>
      {normalizedOptions.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <RadioGroupItem value={option.value} id={option.value} />
          <Label htmlFor={option.value}>{option.label}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export function MultipleChoiceFormat({ format }: MultipleChoiceInputProps) {
  const normalizedOptions = format.options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option
  );

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Input Type:</span>
        <Badge variant="secondary" className="capitalize">
          {format.input_type}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Sorting:</span>
        <Badge variant="secondary" className="capitalize">
          {format.sorting}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Placeholder:</span>
        <Badge variant="secondary">{format.blank}</Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Default:</span>
        <Badge variant="secondary">
          {format.default === "kn-blank" ? "None" : format.default}
        </Badge>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Options:</span>
        <div className="grid gap-1 pl-2">
          {normalizedOptions.map((option) => (
            <Badge key={option.value} variant="outline">
              {option.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
