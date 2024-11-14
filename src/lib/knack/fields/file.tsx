import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import type { KnackField } from "./types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { z } from "zod";
import { useKnackFieldForm } from "../hooks/useKnackFieldForm";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Types
export interface KnackFileFieldFormat {
  secure: boolean;
  [key: string]: unknown;
}

export interface KnackFileValue {
  id: string;
  application_id: string;
  s3: boolean;
  type: "file" | "image";
  filename: string;
  url: string;
  thumb_url: string;
  size: number;
}

export interface KnackFileFieldProps {
  value: KnackFileValue | null;
  format: KnackFileFieldFormat;
  onChange?: (value: File | null) => void;
  onUpload?: (file: File) => Promise<void>;
  disabled?: boolean;
}

export type KnackFileField = KnackField<
  "file",
  KnackFileFieldFormat,
  KnackFileValue | null
>;

// Utilities
export function isFileField(field: unknown): field is KnackFileField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "file"
  );
}

// Format Configuration Component
const fileFormatSchema = z.object({
  name: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  secure: z.boolean(),
});

export const FileFormat = ({
  format,
  onChange,
  field,
}: {
  format: KnackFileFieldFormat;
  onChange: (format: KnackFileFieldFormat) => void;
  field?: KnackFileField;
}) => {
  const { form, handleChange } = useKnackFieldForm<
    "file",
    KnackFileFieldFormat
  >({
    defaultValues: format,
    schema: fileFormatSchema,
    onChange,
    field,
  });

  const { control } = form;

  return (
    <FormField
      control={control}
      name="secure"
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>Secure Upload</FormLabel>
          <FormControl>
            <Switch
              checked={formField.value as boolean}
              onCheckedChange={(checked) => handleChange("secure", checked)}
            />
          </FormControl>
          <FormDescription>
            Enable secure file uploads with additional authentication
          </FormDescription>
        </FormItem>
      )}
    />
  );
};

FileFormat.displayName = "FileFormat";

// Input Component
export const FileInput = forwardRef<HTMLInputElement, KnackFileFieldProps>(
  ({ onChange, onUpload, value, disabled, ...rest }, ref) => {
    return (
      <FormItem>
        <FormControl>
          <Input
            type="file"
            disabled={disabled}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              try {
                await onUpload?.(file);
                onChange?.(null);
              } catch (error) {
                console.error("File upload failed:", error);
              }
            }}
            {...rest}
            ref={ref}
            value={undefined}
          />
        </FormControl>
        {value && (
          <FormDescription>Current file: {value.filename}</FormDescription>
        )}
      </FormItem>
    );
  }
);

FileInput.displayName = "FileInput";

// Display Component
export const FileDisplay = ({ value }: { value: KnackFileValue }) => {
  const isImage = value.type === "image";
  const isPDF = value.filename.toLowerCase().endsWith(".pdf");
  const isPreviewable = isImage || isPDF;

  return (
    <div className="flex flex-col gap-2">
      {isPreviewable && (
        <div className="max-w-xl">
          {isImage && (
            <img
              src={value.url}
              alt={value.filename}
              className="max-w-full h-auto rounded-lg"
            />
          )}
          {isPDF && (
            <Document file={value.url} className="max-w-full">
              <Page
                pageNumber={1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <a
          href={value.url}
          download={value.filename}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={16} />
          {value.filename} ({formatFileSize(value.size)})
        </a>
      </div>
    </div>
  );
};

FileDisplay.displayName = "FileDisplay";

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
