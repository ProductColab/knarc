import type { KnackField } from "./types";
import { Input } from "@/components/ui/input";
import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useKnackFieldForm } from "../hooks/useKnackFieldForm";

/**
 * Format options for address fields
 */
export interface KnackAddressFieldFormat {
  /** Whether to enable address autocomplete suggestions */
  enable_autocomplete?: boolean;
  /** Address format - US or International */
  format: "US" | "International";
  /** Input type - standard address or lat/long coordinates */
  input: "address" | "lat_long";
  [key: string]: unknown;
}

/**
 * Value structure for address fields
 */
export interface KnackAddressFieldValue {
  /** Street address line 1 */
  street: string;
  /** Optional street address line 2 */
  street2: string | null;
  /** City name */
  city: string;
  /** State/province */
  state: string;
  /** Postal/ZIP code */
  zip: string;
  /** Country */
  country: string | null;
  /** Longitude coordinate */
  longitude: number | null;
  /** Latitude coordinate */
  latitude: number | null;
  /** Full formatted address string */
  full: string;
}

/**
 * A Knack address field definition
 */
export type KnackAddressField = KnackField<
  "address",
  KnackAddressFieldFormat,
  KnackAddressFieldValue
>;

/**
 * Props for address field components
 */
export interface KnackAddressFieldProps {
  /** Current address value */
  value: KnackAddressFieldValue;
  /** Field format configuration */
  format: KnackAddressFieldFormat;
  /** Change handler */
  onChange?: (value: KnackAddressFieldValue) => void;
  /** Whether the field is disabled */
  disabled?: boolean;
}

/**
 * Type guard to check if a field is an address field
 */
export function isAddressField(field: unknown): field is KnackAddressField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "address"
  );
}

/**
 * Input component for standard address entry
 */
const DefaultAddressInput = ({
  value,
  format,
  onChange,
  disabled,
}: KnackAddressFieldProps) => {
  const { control } = useForm<KnackAddressFieldValue>({
    defaultValues: value,
    resolver: zodResolver(
      z.object({
        street: z.string().min(1, "Street address is required"),
        street2: z.string().nullable(),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State/Province is required"),
        zip: z.string().min(1, "ZIP/Postal code is required"),
        country:
          format.format === "International"
            ? z.string().min(1, "Country is required").nullable()
            : z.string().nullable(),
        longitude: z.number().nullable(),
        latitude: z.number().nullable(),
        full: z.string(),
      })
    ),
  });

  return (
    <div className="flex flex-col gap-2">
      <FormField
        control={control}
        name="street"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                placeholder="Street Address"
                {...field}
                disabled={disabled}
                onChange={(e) => {
                  field.onChange(e);
                  onChange?.({ ...value, street: e.target.value });
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="street2"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                placeholder="Street Address Line 2"
                {...field}
                disabled={disabled}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onChange?.({ ...value, street2: e.target.value });
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-2">
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="City"
                  {...field}
                  disabled={disabled}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange?.({ ...value, city: e.target.value });
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="State/Province"
                  {...field}
                  disabled={disabled}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange?.({ ...value, state: e.target.value });
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <FormField
          control={control}
          name="zip"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="ZIP/Postal Code"
                  {...field}
                  disabled={disabled}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange?.({ ...value, zip: e.target.value });
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {format.format === "International" && (
          <FormField
            control={control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Country"
                    {...field}
                    disabled={disabled}
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e);
                      onChange?.({ ...value, country: e.target.value });
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
};

DefaultAddressInput.displayName = "DefaultAddressInput";

/**
 * Input component for latitude/longitude coordinate entry
 */
const LatLongInput = ({
  value,
  onChange,
  disabled,
}: KnackAddressFieldProps) => {
  const { control } = useForm<KnackAddressFieldValue>({
    defaultValues: value,
    resolver: zodResolver(
      z.object({
        latitude: z
          .number()
          .min(-90, "Latitude must be between -90 and 90")
          .max(90, "Latitude must be between -90 and 90")
          .nullable(),
        longitude: z
          .number()
          .min(-180, "Longitude must be between -180 and 180")
          .max(180, "Longitude must be between -180 and 180")
          .nullable(),
      })
    ),
  });

  return (
    <div className="grid grid-cols-2 gap-2">
      <FormField
        control={control}
        name="latitude"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                type="number"
                placeholder="Latitude"
                {...field}
                disabled={disabled}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onChange?.({
                    ...value,
                    latitude: parseFloat(e.target.value),
                  });
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="longitude"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                type="number"
                placeholder="Longitude"
                {...field}
                disabled={disabled}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onChange?.({
                    ...value,
                    longitude: parseFloat(e.target.value),
                  });
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};

LatLongInput.displayName = "LatLongInput";

const addressFormatSchema = z.object({
  name: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  conditional: z.boolean().optional(),
  user: z.boolean().optional(),
  rules: z.array(z.any()).optional(),
  validation: z.array(z.any()).optional(),
  enable_autocomplete: z.boolean().optional(),
  format: z.enum(["US", "International"]),
  input: z.enum(["address", "lat_long"]),
});

/**
 * Component for configuring address field format options
 */
export const AddressFormat = ({
  format,
  onChange,
}: {
  format: KnackAddressFieldFormat;
  onChange: (format: KnackAddressFieldFormat) => void;
}) => {
  const { form, handleChange } = useKnackFieldForm({
    defaultValues: format,
    schema: addressFormatSchema,
    onChange,
  });

  const { control } = form;

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="enable_autocomplete"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Enable Autocomplete</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) =>
                  handleChange("enable_autocomplete", checked)
                }
              />
            </FormControl>
            <FormDescription>
              Enable address autocomplete suggestions
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

AddressFormat.displayName = "AddressFormat";

/**
 * Main input component for address fields
 */
export const AddressInput = forwardRef<
  HTMLInputElement,
  KnackAddressFieldProps
>((props) => {
  return props.format.input === "lat_long" ? (
    <LatLongInput {...props} />
  ) : (
    <DefaultAddressInput {...props} />
  );
});

AddressInput.displayName = "AddressInput";

/**
 * Display component for standard addresses
 */
const DefaultAddressDisplay = ({
  value,
}: {
  value: KnackAddressFieldValue;
}) => {
  return <div>{value.full}</div>;
};

/**
 * Display component for latitude/longitude coordinates
 */
const LatLongDisplay = ({ value }: { value: KnackAddressFieldValue }) => {
  return <div>{`${value.latitude}, ${value.longitude}`}</div>;
};

LatLongDisplay.displayName = "LatLongDisplay";

/**
 * Main display component for address fields
 */
export const AddressDisplay = ({
  format,
  value,
}: {
  format: KnackAddressFieldFormat;
  value: KnackAddressFieldValue;
}) => {
  return format.input === "lat_long" ? (
    <LatLongDisplay value={value} />
  ) : (
    <DefaultAddressDisplay value={value} />
  );
};

AddressDisplay.displayName = "AddressDisplay";
