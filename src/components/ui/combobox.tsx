"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CommandLoading } from "cmdk";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  searchTerms?: string[];
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export function Combobox({
  options = [],
  value,
  onSelect,
  placeholder = "Select an option",
  emptyText = "No results found.",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  loading = false,
  loadingText = "Loading...",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selected = options.find((option) => option.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;

    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const matchLabel = option.label.toLowerCase().includes(query);
      const matchValue = option.value.toLowerCase().includes(query);
      const matchSearchTerms = option.searchTerms?.some((term) =>
        term.toLowerCase().includes(query)
      );

      return matchLabel || matchValue || matchSearchTerms;
    });
  }, [options, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            "glass-border",
            "hover:border-glow-purple/20",
            "focus:border-glow-purple/30",
            "transition-all duration-300",
            open && "border-glow-purple/30",
            className
          )}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              selected?.icon
            )}
            <span className={cn(!selected && "text-muted-foreground")}>
              {loading ? loadingText : selected?.label ?? placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[--radix-popover-trigger-width] p-0",
          "glass-card",
          "border border-glow-purple/20",
          "shadow-lg shadow-black/20",
          "backdrop-blur-xl",
          "border-glow"
        )}
        align="start"
        sideOffset={4}
      >
        <Command
          shouldFilter={false}
          className="overflow-hidden rounded-[inherit]"
        >
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className={cn(
              "border-0",
              "glass-border",
              "bg-transparent",
              "focus:ring-0",
              "border-b border-glow-purple/10"
            )}
          />
          <CommandList className="max-h-[200px] overflow-y-auto">
            {loading ? (
              <CommandLoading>
                <div className="flex items-center gap-2 p-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingText}
                </div>
              </CommandLoading>
            ) : (
              <>
                {filteredOptions.length === 0 && (
                  <CommandEmpty className="text-muted-foreground p-2">
                    {emptyText}
                  </CommandEmpty>
                )}
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        onSelect(option.value);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                      className={cn(
                        "cursor-pointer",
                        "transition-colors duration-150",
                        "hover:bg-muted",
                        "aria-selected:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                      {value === option.value && (
                        <Check className="ml-auto h-4 w-4 text-glow-purple" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
