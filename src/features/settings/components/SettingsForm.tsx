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
import { KnackConfig } from "../types";
import { useToast } from "@/hooks/use-toast";

export const SettingsSchema = z.object({
  applicationId: z.string().min(1),
  apiKey: z.string().min(1),
  apiDomain: z.string().min(1),
  apiHost: z.string().min(1),
  apiVersion: z.string().min(1),
});

interface SettingsFormProps {
  settings: KnackConfig;
  onSubmit: (
    data: KnackConfig
  ) => Promise<{ data: KnackConfig | null; error: Error | null }>;
}

export function SettingsForm({ settings, onSubmit }: SettingsFormProps) {
  const { toast } = useToast();
  const form = useForm<KnackConfig>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: settings,
  });

  const handleSubmit = async (data: KnackConfig) => {
    try {
      await onSubmit(data);
      toast({
        title: "Settings updated",
        description: "Your settings have been successfully saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update settings. Please try again. ${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="applicationId"
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
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter API key" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiDomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Domain</FormLabel>
              <FormControl>
                <Input placeholder="Enter API domain" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiHost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Host</FormLabel>
              <FormControl>
                <Input placeholder="Enter API host" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiVersion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Version</FormLabel>
              <FormControl>
                <Input placeholder="Enter API version" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save Settings</Button>
      </form>
    </Form>
  );
}
