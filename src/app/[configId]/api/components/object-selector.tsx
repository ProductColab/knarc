"use client";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database } from "lucide-react";
import { useKnack } from "@/lib/knack/context";
import type { KnackObject } from "@/lib/knack/types/application";
import { Combobox } from "@/components/ui/combobox";
import { ApiKeyInput } from "./api-key-input";
import { cn } from "@/lib/utils";

interface ObjectSelectorProps {
  onSelect: (path: string) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function ObjectSelector({
  onSelect,
  apiKey,
  onApiKeyChange,
}: ObjectSelectorProps) {
  const { client } = useKnack();
  const [objects, setObjects] = useState<KnackObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const objectOptions = objects.map((obj) => ({
    value: obj.key,
    label: obj.name,
    icon: <Database className="w-4 h-4 text-muted-foreground" />,
    searchTerms: [obj.key],
  }));

  useEffect(() => {
    let isMounted = true;

    async function loadObjects() {
      if (!apiKey || !client) {
        setObjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(undefined);

        const privateClient = client.withPrivateAccess(apiKey);
        const schema = await privateClient.getApplicationSchema();

        if (!isMounted) return;

        if (schema?.objects) {
          setObjects(schema.objects);
        } else {
          throw new Error("Invalid response format from API");
        }
      } catch (err) {
        if (!isMounted) return;

        console.error("Failed to load objects:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load objects. Please check your API key."
        );
        setObjects([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadObjects();

    return () => {
      isMounted = false;
    };
  }, [client, apiKey]);

  function handleObjectSelect(objectKey: string) {
    if (!objectKey) return;

    const selectedObj = objects.find((obj) => obj.key === objectKey);
    if (!selectedObj) {
      console.error("Selected object not found:", objectKey);
      return;
    }

    setSelectedObject(objectKey);
    onSelect(`/objects/${objectKey}/records`);
  }

  return (
    <div className="space-y-4">
      <ApiKeyInput apiKey={apiKey} onApiKeyChange={onApiKeyChange} />

      <div className="space-y-2">
        <Label className="text-glow-blue">Object</Label>
        <Combobox
          options={objectOptions}
          value={selectedObject}
          onSelect={handleObjectSelect}
          placeholder="Select an object"
          searchPlaceholder="Search objects..."
          loading={loading}
          disabled={!apiKey || loading}
          emptyText={
            apiKey ? "No objects found" : "Enter API key to view objects"
          }
          className={cn(
            "glass-border",
            "hover:border-glow-purple/20",
            "focus:border-glow-purple/30",
            "transition-all duration-300"
          )}
        />
      </div>

      {error && (
        <Alert
          variant="destructive"
          className="glass-card border-destructive/50"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
