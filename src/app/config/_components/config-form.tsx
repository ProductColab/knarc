"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useConfig } from "@/lib/hooks/use-config";
import { saveConfiguration } from "@/lib/config-store";
import { configSchema } from "@/lib/config-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ConfigFormData = {
  apiDomain: string;
  apiPrefix: string;
  applicationId: string;
  apiKey: string;
  accountSlug: string;
  appSlug: string;
};

function CredentialsTab({ form }: { form: UseFormReturn<ConfigFormData> }) {
  return (
    <TabsContent value="credentials" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="applicationId">Application ID</Label>
        <Input
          id="applicationId"
          {...form.register("applicationId")}
          placeholder="e.g. 6707c48f6f4c5d028061aba5"
        />
        {form.formState.errors.applicationId && (
          <p className="text-sm text-destructive">
            {form.formState.errors.applicationId.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          type="password"
          {...form.register("apiKey")}
          placeholder="Your Knack API key"
        />
        {form.formState.errors.apiKey && (
          <p className="text-sm text-destructive">
            {form.formState.errors.apiKey.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountSlug">Account Slug</Label>
        <Input
          id="accountSlug"
          {...form.register("accountSlug")}
          placeholder="e.g. my-account"
        />
        {form.formState.errors.accountSlug && (
          <p className="text-sm text-destructive">
            {form.formState.errors.accountSlug.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="appSlug">App Slug</Label>
        <Input
          id="appSlug"
          {...form.register("appSlug")}
          placeholder="e.g. my-app"
        />
        {form.formState.errors.appSlug && (
          <p className="text-sm text-destructive">
            {form.formState.errors.appSlug.message}
          </p>
        )}
      </div>
    </TabsContent>
  );
}

function DomainTab({ form }: { form: UseFormReturn<ConfigFormData> }) {
  return (
    <TabsContent value="domain" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="apiDomain">API Domain</Label>
        <Input
          id="apiDomain"
          {...form.register("apiDomain")}
          placeholder="e.g. knack.com"
        />
        <p className="text-sm text-muted-foreground">
          The base domain for your Knack application
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiPrefix">API Prefix</Label>
        <Input
          id="apiPrefix"
          {...form.register("apiPrefix")}
          placeholder="e.g. api or usgc-api"
        />
        <p className="text-sm text-muted-foreground">
          The subdomain prefix for API requests
        </p>
      </div>
    </TabsContent>
  );
}

export default function ConfigPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { configs, refreshConfigs } = useConfig();

  const activeConfig = configs.length > 0 ? configs[0] : null;

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      apiDomain: activeConfig?.apiDomain ?? "knack.com",
      apiPrefix: activeConfig?.apiPrefix ?? "api",
      applicationId: activeConfig?.applicationId ?? "",
      apiKey: activeConfig?.apiKey ?? "",
      accountSlug: activeConfig?.accountSlug ?? "",
      appSlug: activeConfig?.appSlug ?? "",
    },
  });

  useEffect(() => {
    if (activeConfig) {
      form.reset({
        apiDomain: activeConfig.apiDomain,
        apiPrefix: activeConfig.apiPrefix,
        applicationId: activeConfig.applicationId,
        apiKey: activeConfig.apiKey,
        accountSlug: activeConfig.accountSlug,
        appSlug: activeConfig.appSlug,
      });
    }
  }, [activeConfig, form]);

  const onSubmit = async (data: ConfigFormData) => {
    setSaving(true);
    try {
      const config = {
        name: activeConfig?.name ?? `${data.accountSlug}/${data.appSlug}`,
        ...data,
        isActive: true,
      };

      saveConfiguration(config);
      refreshConfigs();
      router.refresh();
      router.push("/");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {activeConfig ? "Edit Configuration" : "New Configuration"}
            </CardTitle>
            <CardDescription>
              {activeConfig
                ? "Update your Knack application configuration"
                : "Configure your Knack application credentials and API settings"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="credentials" className="space-y-4">
              <TabsList>
                <TabsTrigger value="credentials">Credentials</TabsTrigger>
                <TabsTrigger value="domain">Domain Settings</TabsTrigger>
              </TabsList>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <CredentialsTab form={form} />
                <DomainTab form={form} />

                <div className="pt-6 space-x-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? "Saving..." : "Save Configuration"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
