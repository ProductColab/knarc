import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { KnackDateTimeFieldFormat } from "@/lib/knack/types/fields";
import type { KnackFormInput } from "@/lib/knack/types/views";

interface DateTimeInputProps {
  format: KnackDateTimeFieldFormat;
  source?: KnackFormInput["source"];
}

export function DateTimeInput({ format }: DateTimeInputProps) {
  return (
    <div className="flex items-center gap-3">
      <Input
        type="text"
        value={format.default_date || "No default date"}
        className="w-[200px]"
        disabled
      />
      {format.time_format !== "Ignore Time" && (
        <Input
          type="text"
          value={format.default_time || "No default time"}
          className="w-[120px]"
          disabled
        />
      )}
    </div>
  );
}

export function DateTimeFormat({ format }: DateTimeInputProps) {
  return (
    <div className="grid gap-3">
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Date Settings</span>
        <div className="grid gap-2 pl-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Format:</span>
            <Badge variant="secondary">{format.date_format}</Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Default Date:</span>
            <Badge variant="secondary">{format.default_date || "None"}</Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Calendar Picker:</span>
            <Badge variant="secondary">
              {format.calendar ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Time Settings</span>
        <div className="grid gap-2 pl-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Format:</span>
            <Badge variant="secondary">{format.time_format}</Badge>
          </div>

          {format.time_format !== "Ignore Time" && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Time Type:</span>
                <Badge variant="secondary" className="capitalize">
                  {format.time_type}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Default Time:</span>
                <Badge variant="secondary">
                  {format.default_time || "None"}
                </Badge>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
