"use client";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Config, ConfigSubmitHandler } from "@/features/config/types";
import { useToast } from "@/hooks/use-toast";
import { useVerifyConfig } from "@/lib/knack/hooks/useVerifyConfig";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const REGIONS = {
  US: "api",
  EU: "eu-api",
  "Gov Cloud": "usgc-api",
  OTHER: "custom",
} as const;

type RegionType = (typeof REGIONS)[keyof typeof REGIONS];

const KnackConfigSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  apiKey: z.string().min(1, "API Key is required"),
  apiDomain: z.string().min(1).default("api"),
  apiHost: z.string().min(1).default("knack.com"),
  apiVersion: z.string().min(1).default("v1"),
});

const ConfigSchema = z.object({
  id: z.number().optional(),
  config: KnackConfigSchema,
});

interface ConfigFormProps {
  config: Config;
  onSubmit: ConfigSubmitHandler;
}

export function ConfigForm({ config, onSubmit }: ConfigFormProps) {
  const { toast } = useToast();
  const { verify } = useVerifyConfig();

  const form = useForm<Config>({
    resolver: zodResolver(ConfigSchema),
    defaultValues: {
      ...config,
      config: {
        ...config.config,
        apiDomain: config.config.apiDomain || "api",
        apiHost: config.config.apiHost || "knack.com",
        apiVersion: config.config.apiVersion || "v1",
      },
    },
  });

  const [showCustomDomain, setShowCustomDomain] = useState(
    !Object.values(REGIONS).includes(
      form.getValues("config.apiDomain") as RegionType
    )
  );

  const handleSubmit = async (data: Config) => {
    try {
      // Verify first
      const verificationResult = await verify(data.config);

      // Save with application info if verification was successful
      const configId = await onSubmit({
        id: data.id,
        config: data.config,
        applicationInfo: verificationResult.applicationInfo,
      });

      if (!verificationResult.isValid) {
        toast({
          title: "Configuration Saved",
          description:
            "Warning: Connection verification failed. Please check your settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Configuration Saved",
          description: "Your configuration has been saved successfully.",
        });
      }

      return configId;
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save configuration. Please try again. ${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="config.applicationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter application ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter API key"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.apiDomain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <Select
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setShowCustomDomain(true);
                    } else {
                      setShowCustomDomain(false);
                      field.onChange(value);
                    }
                  }}
                  defaultValue={
                    Object.entries(REGIONS).find(
                      ([, domain]) => domain === field.value
                    )?.[1] || "custom"
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(REGIONS).map(([label, value]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showCustomDomain && (
                  <FormControl>
                    <Input
                      placeholder="Enter custom API domain"
                      {...field}
                      className="mt-2"
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced Settings</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FormField
                control={form.control}
                name="config.apiHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Host</FormLabel>
                    <FormControl>
                      <Input placeholder="knack.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config.apiVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Version</FormLabel>
                    <FormControl>
                      <Input placeholder="v1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Save Configuration
        </Button>
      </form>
    </Form>
  );
}
