/**
 * Asset types and interfaces
 */

export type AssetType = "file" | "image";

export interface KnackAssetResponse {
  /** Unique identifier for the asset */
  id: string;
  /** The Knack application ID this asset belongs to */
  application_id: string;
  /** Whether the asset is stored in S3 */
  s3: boolean;
  /** Type of asset - either "file" or "image" */
  type: AssetType;
  /** Original filename of the asset */
  filename: string;
  /** URL to download/view the asset */
  url: string;
  /** URL for thumbnail (images only) */
  thumb_url: string;
  /** Size of the file in bytes */
  size: number;
  /** Field key where this asset is stored (if applicable) */
  field_key?: string;
}
