import type { KnackFormatMap, KnackFieldType } from "@/lib/knack/types/fields";
import type { KnackFormInput } from "@/lib/knack/types/views";
import { Badge } from "@/components/ui/badge";
import { Info, Settings2 } from "lucide-react";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ConnectionInput, ConnectionFormat } from "./inputs/ConnectionInput";
import { BooleanInput, BooleanFormat } from "./inputs/BooleanInput";
import { DateTimeInput, DateTimeFormat } from "./inputs/DateTimeInput";
import {
  MultipleChoiceInput,
  MultipleChoiceFormat,
} from "./inputs/MultipleChoiceInput";
import { CurrencyInput, CurrencyFormat } from "./inputs/CurrencyInput";
import { FileInput, FileFormat } from "./inputs/FileInput";
import { ShortTextInput, ShortTextFormat } from "./inputs/ShortTextInput";
import {
  ParagraphTextInput,
  ParagraphTextFormat,
} from "./inputs/ParagraphTextInput";
import { getFieldFormat } from "../../../utils/form";
import { cn } from "@/lib/utils";

interface FormInputsProps {
  inputs: KnackFormInput[];
  className?: string;
}

export function FormInputs({ inputs, className }: FormInputsProps) {
  return (
    <TableBody>
      {inputs.map((input) => (
        <FormInput
          key={input.field.key}
          input={input}
          className={cn(className, "hover:bg-muted/80")}
        />
      ))}
    </TableBody>
  );
}

interface FormInputProps {
  input: KnackFormInput;
  className?: string;
}

function FormInput({ input, className }: FormInputProps) {
  return (
    <TableRow className={className}>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="font-medium">{input.label}</div>
          <code className="text-xs text-muted-foreground">
            {input.field.key}
          </code>
        </div>
      </TableCell>
      <TableCell>
        <Badge>{input.type}</Badge>
      </TableCell>
      <TableCell>
        {input.instructions && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div dangerouslySetInnerHTML={{ __html: input.instructions }} />
          </div>
        )}
      </TableCell>
      <TableCell>
        <InputProperties input={input} />
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="w-80 p-4">
              <FormatProperties input={input} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
}

type InputComponentProps<T extends KnackFieldType> = {
  format: KnackFormatMap[T];
  source?: KnackFormInput["source"];
};

const INPUT_COMPONENTS: {
  [K in KnackFieldType]: React.ComponentType<InputComponentProps<K>>;
} = {
  connection: ConnectionInput,
  boolean: BooleanInput,
  date_time: DateTimeInput,
  multiple_choice: MultipleChoiceInput,
  currency: CurrencyInput,
  file: FileInput,
  short_text: ShortTextInput,
  paragraph_text: ParagraphTextInput,
} as const;

const FORMAT_COMPONENTS: {
  [K in KnackFieldType]: React.ComponentType<InputComponentProps<K>>;
} = {
  connection: ConnectionFormat,
  boolean: BooleanFormat,
  date_time: DateTimeFormat,
  multiple_choice: MultipleChoiceFormat,
  currency: CurrencyFormat,
  file: FileFormat,
  short_text: ShortTextFormat,
  paragraph_text: ParagraphTextFormat,
} as const;

function FormatProperties({ input }: FormInputProps) {
  if (!input.type) return null;

  const isValidInputType = (type: unknown): type is KnackFieldType => {
    return typeof type === "string" && type in FORMAT_COMPONENTS;
  };

  if (!isValidInputType(input.type)) return null;

  const format = getFieldFormat(input.type, input.format);
  const Component = FORMAT_COMPONENTS[input.type];

  return <Component format={format} source={input.source} />;
}

function InputProperties({ input }: FormInputProps) {
  if (!input.type) return null;

  const isValidInputType = (type: unknown): type is KnackFieldType => {
    return typeof type === "string" && type in INPUT_COMPONENTS;
  };

  if (!isValidInputType(input.type)) return null;

  const format = getFieldFormat(input.type, input.format);
  const Component = INPUT_COMPONENTS[input.type];

  return <Component format={format} source={input.source} />;
}
