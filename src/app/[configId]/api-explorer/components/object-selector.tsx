import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database } from "lucide-react";
import { useKnack } from "@/lib/knack/context";
import type { KnackObject } from "@/lib/knack/types/application";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { ApiKeyInput } from "./api-key-input";

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

  // Convert objects to combobox options
  const objectOptions: ComboboxOption[] = objects.map((obj) => ({
    value: obj.key,
    label: obj.name,
    icon: <Database className="w-4 h-4 text-muted-foreground" />,
    searchTerms: [obj.key], // Allow searching by key as well
  }));

  // Load objects when API key changes
  useEffect(() => {
    const loadObjects = async () => {
      if (!apiKey) {
        setObjects([]);
        return;
      }

      try {
        setLoading(true);
        const schema = await client
          ?.withPrivateAccess(apiKey)
          .getApplicationSchema();
        if (schema) {
          setObjects(schema.objects);
        }
      } catch (err) {
        setError("Failed to load objects. Please check your API key.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadObjects();
  }, [client, apiKey]);

  // Handle object selection
  const handleObjectSelect = (objectKey: string) => {
    setSelectedObject(objectKey);
    onSelect(`/objects/${objectKey}/records`);
  };

  return (
    <div className="space-y-4">
      <ApiKeyInput apiKey={apiKey} onApiKeyChange={onApiKeyChange} />

      <div className="space-y-2">
        <Label>Object</Label>
        <Combobox
          options={objectOptions}
          value={selectedObject}
          onSelect={handleObjectSelect}
          placeholder="Select an object"
          searchPlaceholder="Search objects..."
          loading={loading}
          disabled={!apiKey}
          emptyText={
            apiKey ? "No objects found" : "Enter API key to view objects"
          }
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
