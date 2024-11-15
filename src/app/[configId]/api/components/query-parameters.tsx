"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type QueryParamBase = {
  name: string;
  description: string;
  example: string;
};

export type SelectQueryParam = QueryParamBase & {
  type: "select";
  options: readonly string[];
  defaultValue: string;
};

export type NumberQueryParam = QueryParamBase & {
  type: "number";
  min?: number;
  max?: number;
  defaultValue?: string;
};

export type TextQueryParam = QueryParamBase & {
  type: "text";
  placeholder?: string;
  defaultValue?: string;
};

export type QueryParam = SelectQueryParam | NumberQueryParam | TextQueryParam;

export const QUERY_PARAMS: QueryParam[] = [
  {
    name: "format",
    description: "Response format (raw, html, or both)",
    example: "format=raw",
    type: "select",
    options: ["raw", "html", "both"] as const,
    defaultValue: "both",
  },
  {
    name: "page",
    description: "Page number for pagination",
    example: "page=1",
    type: "number",
    min: 1,
    defaultValue: "1",
  },
  {
    name: "rows_per_page",
    description: "Number of records per page (max 1000)",
    example: "rows_per_page=25",
    type: "number",
    min: 1,
    max: 1000,
    defaultValue: "25",
  },
  {
    name: "sort_field",
    description: "Field key to sort by",
    example: "sort_field=field_1",
    type: "text",
    placeholder: "field_1",
  },
  {
    name: "sort_order",
    description: "Sort direction (asc or desc)",
    example: "sort_order=asc",
    type: "select",
    options: ["asc", "desc"] as const,
    defaultValue: "asc",
  },
] as const;

export type QueryParams = {
  [K in (typeof QUERY_PARAMS)[number]["name"]]?: string;
};

interface QueryParametersProps {
  queryParams: QueryParams;
  onUpdateQueryParam: (name: keyof QueryParams, value: string) => void;
}

export function QueryParameters({
  queryParams,
  onUpdateQueryParam,
}: QueryParametersProps) {
  const renderQueryParamInput = (param: QueryParam) => {
    if (param.type === "select") {
      return (
        <Select
          value={queryParams[param.name] || param.defaultValue}
          onValueChange={(value) => onUpdateQueryParam(param.name, value)}
          disabled={param.name === "sort_order" && !queryParams.sort_field}
        >
          <SelectTrigger className="glass-border hover:border-glow-purple/20 transition-all duration-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-card border-glow">
            {param.options.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="hover:text-glow-purple hover:text-glow-sm transition-all duration-300"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={param.type === "number" ? "number" : "text"}
        min={param.type === "number" ? param.min : undefined}
        max={param.type === "number" ? param.max : undefined}
        value={queryParams[param.name] || ""}
        onChange={(e) => onUpdateQueryParam(param.name, e.target.value)}
        placeholder={
          param.type === "number"
            ? param.example.split("=")[1]
            : param.placeholder
        }
        className={cn(
          "glass-border",
          "hover:border-glow-purple/20",
          "focus:border-glow-purple/30",
          "transition-all duration-300"
        )}
      />
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-glow-blue">
        Query Parameters
      </label>
      <div className="grid grid-cols-1 gap-2">
        {QUERY_PARAMS.map((param) => (
          <div
            key={param.name}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-md glass-card"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <code className="font-mono text-glow-purple">{param.name}</code>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-glow-purple transition-colors duration-300" />
                    </TooltipTrigger>
                    <TooltipContent className="glass-card border-glow">
                      <p>
                        {param.description}
                        {param.name === "sort_order" &&
                          " (Only applied when sort_field is set)"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-muted-foreground">
                Example: ?{param.example}
              </p>
            </div>
            <div className="w-full sm:w-[200px]">
              {renderQueryParamInput(param)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
