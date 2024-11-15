"use client";

import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { useConfig } from "@/hooks/useConfig";
import { useRouter } from "next/navigation";
import { KnackClient } from "@/lib/knack/api";
import { useState, useEffect, useMemo } from "react";
import { Check, HelpCircle, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Form validation schema
const configFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  applicationId: z.string().min(1, "Application ID is required"),
  apiKey: z.string().min(1, "API key is required for verification"),
  storeApiKey: z.boolean().default(false),
  apiDomain: z.string().min(1, "API Domain is required").default("api"),
  apiHost: z.string().min(1, "API Host is required").default("knack.com"),
  apiVersion: z.string().optional(),
  accountSlug: z.string().optional(),
  appSlug: z.string().optional(),
  builderUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .default("https://builder.knack.com"),
  appUrl: z.string().url().optional().or(z.literal("")),
});

type ConfigFormData = z.infer<typeof configFormSchema>;

interface ConfigFormProps {
  configId?: string;
}

// Form field components
interface FormFieldProps {
  name: keyof ConfigFormData;
  label: string;
  description?: string;
  placeholder?: string;
  type?: string;
  register: UseFormRegister<ConfigFormData>;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  helpText?: string | React.ReactNode;
}

const FormField = ({
  name,
  label,
  description,
  placeholder,
  type = "text",
  register,
  disabled,
  value,
  onChange,
}: FormFieldProps) => (
  <FormItem>
    <FormLabel>{label}</FormLabel>
    <FormControl>
      <Input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </FormControl>
    {description && <FormDescription>{description}</FormDescription>}
    <FormMessage />
  </FormItem>
);

const FormFieldWithPopover = ({
  name,
  label,
  description,
  placeholder,
  type = "text",
  register,
  disabled,
  value,
  onChange,
  helpText,
}: FormFieldProps) => (
  <FormItem>
    <div className="flex items-center gap-2">
      <FormLabel>{label}</FormLabel>
      {helpText && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-4 w-4 p-0 hover:bg-transparent"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">{helpText}</div>
          </PopoverContent>
        </Popover>
      )}
    </div>
    <FormControl>
      <Input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </FormControl>
    {description && <FormDescription>{description}</FormDescription>}
    <FormMessage />
  </FormItem>
);

const getErrorMessage = (error: unknown): string => {
  console.log("Raw error:", error);

  if (error instanceof Error) {
    console.log("Error message:", error.message);
    try {
      // Try to parse the error message as JSON
      const parsed = JSON.parse(error.message);
      return parsed.message || error.message;
    } catch {
      // If parsing fails, return the original message
      return error.message;
    }
  }
  return "An unexpected error occurred";
};

export default function ConfigForm({ configId }: ConfigFormProps) {
  const { configs, createConfig, updateConfig, isCreating, isUpdating } =
    useConfig();
  const router = useRouter();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const existingConfig = configId
    ? configs.find((c) => c.id === configId)
    : null;

  const defaultValues = existingConfig
    ? {
        name: existingConfig.name,
        applicationId: existingConfig.applicationId,
        apiKey: existingConfig.apiKey,
        apiDomain: existingConfig.apiDomain || "api",
        apiHost: existingConfig.apiHost || "knack.com",
        apiVersion: existingConfig.apiVersion || "v1",
        accountSlug: existingConfig.accountSlug,
        appSlug: existingConfig.appSlug,
        builderUrl: existingConfig.builderUrl || "https://builder.knack.com",
        appUrl: existingConfig.appUrl || "",
        storeApiKey: !!existingConfig.apiKey,
      }
    : {
        name: "",
        applicationId: "",
        apiKey: "",
        apiDomain: "api",
        apiHost: "knack.com",
        apiVersion: "v1",
        builderUrl: "https://builder.knack.com",
        appUrl: "",
        storeApiKey: false,
      };

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const validateCredentials = async (data: ConfigFormData) => {
    try {
      setValidationError(null);
      const testClient = new KnackClient({
        applicationId: data.applicationId,
        apiKey: data.apiKey,
        apiDomain: data.apiDomain,
        apiHost: data.apiHost,
        apiVersion: data.apiVersion,
      });

      console.log("Validating with config:", {
        ...data,
        apiKey: "[REDACTED]",
      });

      const schema = await testClient.getApplicationSchema();

      if (schema.account?.slug) {
        form.setValue("accountSlug", schema.account.slug);
      }

      if (schema.slug) {
        form.setValue("appSlug", schema.slug);
        form.setValue(
          "appUrl",
          `https://${schema.account?.slug || ""}.knack.com/apps/${schema.slug}`
        );
      }

      setIsVerified(true);
      return true;
    } catch (error) {
      console.log("Validation error caught:", error);
      const message = getErrorMessage(error);
      console.log("Processed error message:", message);
      setValidationError(message);
      setIsVerified(false);
      return false;
    }
  };

  const handleSubmit = async (data: ConfigFormData) => {
    if (!isVerified) {
      setValidationError("Please verify your credentials before saving");
      return;
    }

    try {
      const configData = {
        ...data,
        apiKey: data.storeApiKey ? data.apiKey : undefined,
      };

      console.log("📥 Fetching application schema for new config...");

      if (existingConfig) {
        await updateConfig({
          id: existingConfig.id,
          config: configData,
        });
        router.push(`/${existingConfig.id}/scenes`);
      } else {
        const newConfig = await createConfig({
          ...configData,
          isActive: configs.length === 0,
        });
        if (newConfig) {
          router.push(`/${newConfig.id}/scenes`);
        }
      }
    } catch (error) {
      console.error("Failed to save config:", error);
      setValidationError("Failed to save configuration. Please try again.");
    }
  };

  const watchedValues = useMemo(
    () => ({
      applicationId: form.watch("applicationId"),
      apiKey: form.watch("apiKey"),
    }),
    [form]
  );

  useEffect(() => {
    setIsVerified(false);
  }, [watchedValues]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {existingConfig ? "Edit Configuration" : "New Configuration"}
        </h1>
        <p className="text-muted-foreground">
          Configure your Knack application settings
        </p>
      </div>

      <div className="bg-muted p-4 rounded-lg mb-8">
        <h3 className="font-semibold mb-2">Why is your API Key necessary?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We use your API key to verify your ownership of the application.
          Without it, anyone would be able to add your application ID here and
          have access to its schema. Technically, we only need your API key to
          make object-based requests in the API Explorer.{" "}
          <a
            href="https://docs.knack.com/docs/api-key-app-id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Learn more about Knack API keys →
          </a>
        </p>
        <h3 className="font-semibold mb-2">Is my API Key secure?</h3>
        <p className="text-sm text-muted-foreground">
          Your API key is stored securely in your browser&apos;s local database
          and never leaves your device. We don&apos;t transmit your credentials
          to any servers - all operations are performed directly between your
          browser and Knack&apos;s API.
        </p>
      </div>

      {validationError && (
        <div className="bg-destructive/10 text-destructive px-6 py-4 rounded-lg mb-6">
          <div className="font-semibold mb-1">Validation Error</div>
          <p className="text-sm">{validationError}</p>
          {validationError.includes("HIPAA") && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIsAdvancedOpen(true)}
            >
              Open Advanced Settings
            </Button>
          )}
        </div>
      )}

      {isVerified && (
        <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-md mb-6 flex items-center gap-2">
          <Check className="h-4 w-4" />
          Credentials verified successfully
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            name="name"
            label="Configuration Name"
            description="A friendly name to identify this configuration"
            placeholder="My Knack App"
            register={form.register}
          />

          <FormFieldWithPopover
            name="applicationId"
            label="Application ID"
            placeholder="5f3c..."
            register={form.register}
            helpText={
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Your Application ID can be found in your Knack Builder under
                  Settings &gt; API & Code &gt; API.
                </p>
                <a
                  href="https://docs.knack.com/docs/api-key-app-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Learn more about finding your Application ID →
                </a>
              </div>
            }
          />

          <FormFieldWithPopover
            name="apiKey"
            label="API Key"
            type="password"
            register={form.register}
            helpText={
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Your API key is required to verify ownership and access object
                  data. It can be found in your Knack Builder under Settings
                  &gt; API & Code &gt; API.
                </p>
                <a
                  href="https://docs.knack.com/docs/api-key-app-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Learn more about API keys →
                </a>
              </div>
            }
          />

          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={form.watch("storeApiKey")}
                onCheckedChange={(checked) => {
                  form.setValue("storeApiKey", checked as boolean);
                }}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Store API Key
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">About API Key Storage</h4>
                      <p className="text-sm text-muted-foreground">
                        Storing your API key is optional and only required if
                        you want to use the object-based routes in the API
                        Explorer. Without a stored API key, you can still
                        explore scenes and views, but won&apos;t be able to
                        access object data directly.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </FormLabel>
              <FormDescription>
                Choose whether to store the API key locally
              </FormDescription>
            </div>
          </FormItem>

          <div className="flex gap-4 py-6 border-y">
            <Button
              type="button"
              onClick={() => validateCredentials(form.getValues())}
              disabled={isCreating || isUpdating}
            >
              Verify Credentials
            </Button>
            <Button
              type="submit"
              disabled={!isVerified || isCreating || isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating || isUpdating ? "Saving..." : "Save Configuration"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>

          <Collapsible
            open={isAdvancedOpen}
            onOpenChange={setIsAdvancedOpen}
            className="space-y-4"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full justify-between p-0 font-semibold"
              >
                <span>Advanced Settings</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isAdvancedOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6">
              <FormField
                name="apiDomain"
                label="API Domain"
                description="The domain prefix for API requests (default: api)"
                placeholder="api"
                register={form.register}
                value={form.watch("apiDomain")}
                onChange={(value) => form.setValue("apiDomain", value)}
              />
              <FormField
                name="apiHost"
                label="API Host"
                description="The main domain for Knack (default: knack.com)"
                placeholder="knack.com"
                register={form.register}
              />
              <FormField
                name="apiVersion"
                label="API Version"
                placeholder="v1"
                register={form.register}
              />
              <FormField
                name="accountSlug"
                label="Account Slug"
                description="Auto-populated after verification"
                register={form.register}
                disabled={!isVerified}
              />
              <FormField
                name="appSlug"
                label="App Slug"
                description="Auto-populated after verification"
                register={form.register}
                disabled={!isVerified}
              />
              <FormField
                name="builderUrl"
                label="Builder URL"
                description="URL to access the Knack builder interface"
                type="url"
                register={form.register}
              />
              <FormField
                name="appUrl"
                label="App URL"
                description="Auto-populated after verification"
                type="url"
                register={form.register}
                disabled={!isVerified}
              />
            </CollapsibleContent>
          </Collapsible>
        </form>
      </Form>
    </>
  );
}
