/**
 * Configuration types
 */

export interface KnackConfig {
  /** The ID of your Knack application */
  applicationId: string;
  /** API key for object-based operations. Required for CRUD operations */
  apiKey?: string;
  /** The domain of the Knack API. Defaults to knack.com */
  apiDomain?: string;
  /** Base URL for the Knack API. Defaults to https://api.knack.com/v1 */
  apiHost?: string;
  /** API version. Defaults to v1 */
  apiVersion?: string;
  /** The slug of the Knack account */
  accountSlug?: string;
  /** The slug of the Knack app */
  appSlug?: string;
  /** The URL of the Knack builder */
  builderUrl?: string;
  /** The URL of the Knack app */
  appUrl?: string;
}
