import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";
import type { KnackCurrencyFieldFormat } from "@/lib/knack/types/fields";
import type { KnackFormInput } from "@/lib/knack/types/views";

interface CurrencyInputProps {
  format: KnackCurrencyFieldFormat;
  source?: KnackFormInput["source"];
}

export function CurrencyInput({ format }: CurrencyInputProps) {
  return (
    <div className="relative">
      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input type="text" className="pl-8" placeholder="0.00" disabled />
    </div>
  );
}

export function CurrencyFormat({ format }: CurrencyInputProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Currency Symbol:</span>
        <Badge variant="secondary">{format.format}</Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Input Type:</span>
        <Badge variant="secondary">Number</Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Decimal Places:</span>
        <Badge variant="secondary">2</Badge>
      </div>
    </div>
  );
}
