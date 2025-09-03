"use client";
import * as React from "react";
import * as RadixAccordion from "@radix-ui/react-accordion";

export const Accordion = RadixAccordion.Root;
export const AccordionItem = RadixAccordion.Item;

export const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Trigger>
>(function AccordionTrigger({ children, ...props }, ref) {
  return (
    <RadixAccordion.Header className="m-0 p-0">
      <RadixAccordion.Trigger
        ref={ref}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-gray-50 data-[state=open]:bg-gray-50"
        {...props}
      >
        {children}
        <span aria-hidden className="ml-2">
          ▾
        </span>
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
});

export const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Content>
>(function AccordionContent({ children, ...props }, ref) {
  return (
    <RadixAccordion.Content
      ref={ref}
      className="px-3 py-2 text-sm border-b"
      {...props}
    >
      {children}
    </RadixAccordion.Content>
  );
});
