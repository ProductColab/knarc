/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Types and client for interacting with the Knack API.
 * @packageDocumentation
 */

import type { KnackConfig } from "./types/config";
import type { KnackApplicationSchema, KnackObject } from "./types/application";
import type { KnackField } from "./types/fields";
import type { KnackScene } from "./types/scenes";
import type { KnackView } from "./types/views";
import type {
  KnackRecord,
  KnackRecordInput,
  KnackResponse,
} from "./types/records";
import type { KnackFilter } from "./types/filters";
import type { KnackAssetResponse, AssetType } from "./types/assets";
import type { KnackLoginResponse, KnackLoginCredentials } from "./types/auth";
import type {
  KnackRequestOptions,
  KnackResponseFormat,
  KnackRecordWithFormat,
  DateRangeFilter,
  DateRangeType,
  FilterMatch,
  KnackConnectionFilter,
} from "./types/requests";
import type { KnackConnectionField } from "./fields";

/**
 * Client for interacting with the Knack API.
 * Provides methods for CRUD operations on records, managing connections,
 * handling file uploads, and retrieving schema information.
 *
 * @example
 * ```typescript
 * const client = new KnackClient({
 *   applicationId: "your-app-id",
 *   apiKey: "your-api-key"
 * });
 *
 * // Get records from an object
 * const records = await client.getObjectRecords("object_1");
 *
 * // Create a new record
 * const newRecord = await client.createObjectRecord("object_1", {
 *   field_1: "value"
 * });
 * ```
 */
export class KnackClient {
  private config: KnackConfig;
  private userToken?: string;
  private baseUrl: string;
  private isPublicClient: boolean;

  constructor(config: KnackConfig, isPublicClient: boolean = true) {
    this.config = config;
    this.isPublicClient = isPublicClient;

    const domain = config.apiDomain || 'api';
    const host = config.apiHost || 'knack.com';
    const version = config.apiVersion || 'v1';
    this.baseUrl = `https://${domain}.${host}/${version}`;
  }

  // Create a new instance with private access
  withPrivateAccess(apiKey: string): KnackClient {
    const newConfig = {
      ...this.config,
      apiKey
    };
    console.log('Creating private client with config:', newConfig);
    return new KnackClient(newConfig, false);
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "X-Knack-Application-Id": this.config.applicationId,
      "Content-Type": "application/json",
    };

    if (!this.isPublicClient && this.config.apiKey) {
      headers["X-Knack-REST-API-Key"] = this.config.apiKey;
    } else {
      headers["X-Knack-REST-API-Key"] = "knack";
    }

    return headers;
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}/${path}`;
  }

  private buildQueryString(options?: KnackRequestOptions): string {
    if (!options) return "";

    const params = new URLSearchParams();

    if (options.format) {
      params.append("format", options.format);
    }

    if (options.sceneParameter) {
      const { sceneUrl, recordId } = options.sceneParameter;
      params.append(`${sceneUrl}_id`, recordId);
    }

    if (options.page) params.append("page", options.page.toString());
    if (options.rowsPerPage)
      params.append("rows_per_page", options.rowsPerPage.toString());
    if (options.sortField) params.append("sort_field", options.sortField);
    if (options.sortOrder) params.append("sort_order", options.sortOrder);

    if (options.filters?.length) {
      const formattedFilters = options.filters.map((filter) => {
        if (filter.value instanceof Date) {
          const baseFilter = {
            ...filter,
            value: filter.value.toISOString(),
          };

          if (filter.operator.startsWith("is_")) {
            return {
              ...baseFilter,
              range: (filter as DateRangeFilter).range,
              type: (filter as DateRangeFilter).type,
            };
          }

          return baseFilter;
        }
        return filter;
      });

      const filterObject = {
        match: options.filterMatch || "and",
        rules: formattedFilters,
      };

      params.append("filters", JSON.stringify(filterObject));
    }

    return params.toString() ? `?${params.toString()}` : "";
  }

  /**
   * Creates a filter for date ranges
   * @param fieldKey - The field to filter on
   * @param operator - Whether to filter on previous or next time period
   * @param range - Number of time units to include
   * @param type - Type of time unit (days, weeks, months, years)
   * @returns A configured date range filter
   *
   * @example
   * ```typescript
   * const filter = client.createDateRangeFilter(
   *   "field_1",
   *   "is_during_the_previous",
   *   7,
   *   "days"
   * );
   * ```
   */
  createDateRangeFilter(
    fieldKey: string,
    operator: "is_during_the_previous" | "is_during_the_next",
    range: number,
    type: DateRangeType
  ): DateRangeFilter {
    return {
      field: fieldKey,
      operator,
      value: new Date(),
      range,
      type,
    };
  }

  /**
   * Creates a compound filter combining multiple filters
   * @param filters - Array of filters to combine
   * @param match - How to combine the filters ("and" or "or")
   * @returns Request options containing the compound filter
   *
   * @example
   * ```typescript
   * const filter = client.createCompoundFilter([
   *   { field: "field_1", operator: "is", value: "value1" },
   *   { field: "field_2", operator: "contains", value: "value2" }
   * ], "and");
   * ```
   */
  createCompoundFilter(
    filters: KnackFilter[],
    match: FilterMatch = "and"
  ): KnackRequestOptions {
    return {
      filters,
      filterMatch: match,
    };
  }

  /**
   * Retrieves records from a Knack object
   * @param objectKey - Key of the object to get records from
   * @param options - Request options including filters, pagination, etc
   * @returns Array of records matching the criteria
   *
   * @example
   * ```typescript
   * // Get records with both raw and formatted values
   * const records = await client.getObjectRecords("object_1");
   *
   * // Get only formatted values
   * const formatted = await client.getObjectRecords("object_1", {
   *   format: "formatted"
   * });
   * ```
   */
  async getObjectRecords<F extends KnackResponseFormat = "both">(
    objectKey: string,
    options?: KnackRequestOptions & { format?: F }
  ): Promise<KnackRecordWithFormat<KnackRecord, F>[]> {
    const url = this.buildUrl(
      `objects/${objectKey}/records${this.buildQueryString(options)}`
    );
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    await this.handleResponse(response);
    const data: KnackResponse<KnackRecordWithFormat<KnackRecord, F>> =
      await response.json();
    return data.records;
  }

  /**
   * Retrieves a single record from a Knack object
   * @param objectKey - Key of the object containing the record
   * @param recordId - ID of the record to retrieve
   * @param options - Request options for formatting
   * @returns The requested record
   *
   * @example
   * ```typescript
   * const record = await client.getObjectRecord("object_1", "12345");
   * ```
   */
  async getObjectRecord<F extends KnackResponseFormat = "both">(
    objectKey: string,
    recordId: string,
    options?: Pick<KnackRequestOptions, "format"> & { format?: F }
  ): Promise<KnackRecordWithFormat<KnackRecord, F>> {
    const url = this.buildUrl(
      `objects/${objectKey}/records/${recordId}${this.buildQueryString(
        options
      )}`
    );
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    await this.handleResponse(response);
    return response.json();
  }

  /**
   * Creates a new record in a Knack object
   * @param objectKey - Key of the object to create the record in
   * @param data - Record data to create
   * @returns The created record
   *
   * @example
   * ```typescript
   * const newRecord = await client.createObjectRecord("object_1", {
   *   field_1: "value",
   *   field_2: 123
   * });
   * ```
   */
  async createObjectRecord(
    objectKey: string,
    data: KnackRecordInput
  ): Promise<KnackRecord> {
    const url = this.buildUrl(`objects/${objectKey}/records`);
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    await this.handleResponse(response);
    return response.json();
  }

  /**
   * Updates an existing record in a Knack object
   * @param objectKey - Key of the object containing the record
   * @param recordId - ID of the record to update
   * @param data - Updated record data
   * @returns The updated record
   *
   * @example
   * ```typescript
   * const updatedRecord = await client.updateObjectRecord(
   *   "object_1",
   *   "12345",
   *   { field_1: "new value" }
   * );
   * ```
   */
  async updateObjectRecord(
    objectKey: string,
    recordId: string,
    data: KnackRecordInput
  ): Promise<KnackRecord> {
    const url = this.buildUrl(`objects/${objectKey}/records/${recordId}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    await this.handleResponse(response);
    return response.json();
  }

  /**
   * Deletes a record from a Knack object
   * @param objectKey - Key of the object containing the record
   * @param recordId - ID of the record to delete
   *
   * @example
   * ```typescript
   * await client.deleteObjectRecord("object_1", "12345");
   * ```
   */
  async deleteObjectRecord(objectKey: string, recordId: string): Promise<void> {
    const url = this.buildUrl(`objects/${objectKey}/records/${recordId}`);
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    await this.handleResponse(response);
  }

  /**
   * Formats connection data into the format expected by Knack
   * @param connections - Array of connection records or IDs
   * @returns Array of connection IDs
   *
   * @example
   * ```typescript
   * const ids = client.formatConnectionInput([
   *   { id: "123", identifier: "Record 1" },
   *   { id: "456", identifier: "Record 2" }
   * ]);
   * // Returns: ["123", "456"]
   * ```
   */
  formatConnectionInput(
    connections: (KnackConnectionField | string)[]
  ): string[] {
    if (!Array.isArray(connections) || connections.length === 0) {
      return [];
    }

    return typeof connections[0] === "string"
      ? connections as string[]
      : connections.map((conn: any) => conn.id);
  }

  /**
   * Creates a filter for finding connected records
   * @param connectionFieldKey - The field containing the connection
   * @param parentRecordId - ID of the parent record to find connections for
   * @returns A configured connection filter
   *
   * @example
   * ```typescript
   * const filter = client.createConnectionFilter("field_1", "12345");
   * ```
   */
  createConnectionFilter(
    connectionFieldKey: string,
    parentRecordId: string
  ): KnackConnectionFilter {
    return {
      field: connectionFieldKey,
      operator: "is",
      value: parentRecordId,
    };
  }

  /**
   * Retrieves records connected to a parent record
   * @param objectKey - Key of the object containing connected records
   * @param connectionFieldKey - Field key containing the connection
   * @param parentRecordId - ID of the parent record
   * @param additionalOptions - Additional request options
   * @returns Array of connected records
   *
   * @example
   * ```typescript
   * const connectedRecords = await client.getConnectedRecords(
   *   "object_2",
   *   "field_1",
   *   "12345"
   * );
   * ```
   */
  async getConnectedRecords<F extends KnackResponseFormat = "both">(
    objectKey: string,
    connectionFieldKey: string,
    parentRecordId: string,
    additionalOptions?: Omit<KnackRequestOptions, "filters"> & { format?: F }
  ): Promise<KnackRecordWithFormat<KnackRecord, F>[]> {
    const connectionFilter = this.createConnectionFilter(
      connectionFieldKey,
      parentRecordId
    );

    return this.getObjectRecords(objectKey, {
      ...additionalOptions,
      filters: [connectionFilter],
    });
  }

  /**
   * Retrieves records from a Knack view
   * @param sceneKey - Key of the scene containing the view
   * @param viewKey - Key of the view to get records from
   * @param options - Request options including filters, pagination, etc
   * @returns Array of records from the view
   *
   * @example
   * ```typescript
   * const viewRecords = await client.getViewRecords(
   *   "scene_1",
   *   "view_1",
   *   { page: 1, rowsPerPage: 20 }
   * );
   * ```
   */
  async getViewRecords<F extends KnackResponseFormat = "both">(
    sceneKey: string,
    viewKey: string,
    options?: KnackRequestOptions & { format?: F }
  ): Promise<KnackRecordWithFormat<KnackRecord, F>[]> {
    const url = this.buildUrl(
      `pages/${sceneKey}/views/${viewKey}/records${this.buildQueryString(
        options
      )}`
    );

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    await this.handleResponse(response);
    const data: KnackResponse<KnackRecordWithFormat<KnackRecord, F>> =
      await response.json();
    return data.records;
  }

  private getUploadHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "X-Knack-Application-Id": this.config.applicationId,
    };

    if (!this.isPublicClient && this.config.apiKey) {
      headers["X-Knack-REST-API-Key"] = this.config.apiKey;
    } else {
      headers["X-Knack-REST-API-Key"] = "knack";
    }

    return headers;
  }

  /**
   * Uploads a file or image to Knack
   * @param file - File or Blob to upload
   * @param assetType - Type of asset ("file" or "image")
   * @returns Upload response containing the asset ID
   *
   * @example
   * ```typescript
   * const file = new File(["content"], "document.pdf");
   * const upload = await client.uploadAsset(file);
   * ```
   */
  async uploadAsset(
    file: File | Blob,
    assetType: AssetType = "file"
  ): Promise<KnackAssetResponse> {
    const formData = new FormData();
    formData.append("files", file);

    const url = this.buildUrl(
      `applications/${this.config.applicationId}/assets/${assetType}/upload`
    );

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: formData,
    });

    await this.handleResponse(response);
    return response.json();
  }

  /**
   * Uploads a file and creates a new record with the file attached
   * @param objectKey - Key of the object to create record in
   * @param file - File to upload
   * @param fieldKey - Field to store the file in
   * @param additionalData - Additional record data
   * @param assetType - Type of asset
   * @returns The created record
   *
   * @example
   * ```typescript
   * const file = new File(["content"], "document.pdf");
   * const record = await client.uploadAssetAndCreateRecord(
   *   "object_1",
   *   file,
   *   "field_1",
   *   { name: "My Document" }
   * );
   * ```
   */
  async uploadAssetAndCreateRecord(
    objectKey: string,
    file: File | Blob,
    fieldKey: string,
    additionalData?: Omit<KnackRecordInput, typeof fieldKey>,
    assetType: AssetType = "file"
  ): Promise<KnackRecord> {
    const uploadResponse = await this.uploadAsset(file, assetType);

    const recordData: KnackRecordInput = {
      ...additionalData,
      [fieldKey]: uploadResponse.id,
    };

    return this.createObjectRecord(objectKey, recordData);
  }

  /**
   * Uploads a file and updates an existing record with the file
   * @param objectKey - Key of the object containing the record
   * @param recordId - ID of the record to update
   * @param file - File to upload
   * @param fieldKey - Field to store the file in
   * @param additionalData - Additional record data to update
   * @param assetType - Type of asset
   * @returns The updated record
   *
   * @example
   * ```typescript
   * const file = new File(["content"], "document.pdf");
   * const record = await client.uploadAssetAndUpdateRecord(
   *   "object_1",
   *   "12345",
   *   file,
   *   "field_1"
   * );
   * ```
   */
  async uploadAssetAndUpdateRecord(
    objectKey: string,
    recordId: string,
    file: File | Blob,
    fieldKey: string,
    additionalData?: Omit<KnackRecordInput, typeof fieldKey>,
    assetType: AssetType = "file"
  ): Promise<KnackRecord> {
    const uploadResponse = await this.uploadAsset(file, assetType);

    const recordData: KnackRecordInput = {
      ...additionalData,
      [fieldKey]: uploadResponse.id,
    };

    return this.updateObjectRecord(objectKey, recordId, recordData);
  }

  /**
   * Gets the download URL for a file/image asset stored in a Knack record
   * @param record - The Knack record containing the asset
   * @param fieldKey - The field key where the asset is stored
   * @returns The download URL for the asset, or null if not found
   *
   * @example
   * ```typescript
   * const record = await client.getObjectRecord("object_1", "12345");
   * const url = client.getAssetDownloadUrl(record, "field_1");
   * if (url) {
   *   // Download the file
   * }
   * ```
   */
  getAssetDownloadUrl(record: KnackRecord, fieldKey: string): string | null {
    const rawField = `${fieldKey}_raw`;
    const fileData = record[rawField] as unknown as
      | KnackAssetResponse
      | undefined;

    return fileData?.url ?? null;
  }

  /**
   * Gets headers for authenticated view operations
   * @private
   * @returns Headers including authentication if user is logged in
   */
  private getAuthenticatedViewHeaders(): HeadersInit {
    const headers = new Headers(this.getHeaders());

    if (this.userToken) {
      headers.set("Authorization", this.userToken);
    }

    return headers;
  }

  /**
   * Logs in a user to access authenticated views
   * @param credentials - User login credentials
   * @returns Login response with user token
   *
   * @example
   * ```typescript
   * const response = await client.login({
   *   email: "user@example.com",
   *   password: "password123"
   * });
   * ```
   */
  async login(credentials: KnackLoginCredentials): Promise<KnackLoginResponse> {
    const url = this.buildUrl(
      `applications/${this.config.applicationId}/session`
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    await this.handleResponse(response);
    const loginResponse: KnackLoginResponse = await response.json();
    this.userToken = loginResponse.session.user.token;

    return loginResponse;
  }

  /**
   * Logs out the current user
   */
  logout(): void {
    this.userToken = undefined;
  }

  /**
   * Checks if a user is currently authenticated
   * @returns True if a user is logged in
   */
  isAuthenticated(): boolean {
    return !!this.userToken;
  }

  /**
   * Sets the user token manually
   * @param token - User authentication token
   */
  setUserToken(token: string): void {
    this.userToken = token;
  }

  /**
   * Gets the current user token
   * @returns The current user token or undefined if not logged in
   */
  getUserToken(): string | undefined {
    return this.userToken;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = response.statusText;

      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData?.errors?.[0] ||
          errorData?.message ||
          responseText ||
          response.statusText;
      } catch {
        errorMessage = responseText || response.statusText;
      }

      throw new Error(`API Error (${response.status}): ${errorMessage}`);
    }
    return response;
  }

  /**
   * Retrieves the complete application data from Knack
   * @throws {Error} If the API key is not configured or if the request fails
   * @returns The complete application response including schema
   *
   * @example
   * ```typescript
   * const response = await client.getApplication();
   * console.log(response.scenes); // List all scenes in the application
   * ```
   */
  async getApplication(): Promise<KnackApplicationSchema> {
    // if (this.isPublicClient) {
    //   throw new Error("API key required: Use withPrivateAccess() to access private endpoints");
    // }

    const applicationId = this.getApplicationId();
    console.log('Fetching application:', { applicationId });

    if (!applicationId) {
      throw new Error("Application ID is required to fetch application");
    }

    const url = this.buildUrl(`applications/${applicationId}`);
    console.log('Making request to:', url);

    const headers = this.getHeaders();
    console.log('Using headers:', headers);

    const response = await fetch(url, { headers });
    await this.handleResponse(response);

    const data = await response.json();
    return data.application;
  }

  /**
   * Retrieves the complete application schema from Knack
   * @throws {Error} If the API key is not configured or if the request fails
   * @returns The complete application schema
   *
   * @example
   * ```typescript
   * const schema = await client.getApplicationSchema();
   * console.log(schema.scenes); // List all scenes in the application
   * ```
   */
  async getApplicationSchema(): Promise<KnackApplicationSchema> {
    // Now we can just call getApplication since they use the same endpoint
    return this.getApplication();
  }

  /**
   * Retrieves a specific object's schema from the application
   * @param objectKey - The key of the object to retrieve (e.g., "object_1")
   * @throws {Error} If the API key is not configured or if the request fails
   * @returns The object's schema
   *
   * @example
   * ```typescript
   * const objectSchema = await client.getObjectSchema('object_1');
   * console.log(objectSchema.fields); // List all fields in the object
   * ```
   */
  async getObjectSchema(objectKey: string): Promise<KnackObject> {
    const schema = await this.getApplicationSchema();
    const object = schema.objects.find((obj) => obj.key === objectKey);

    if (!object) {
      throw new Error(`Object ${objectKey} not found in application schema`);
    }

    return object;
  }

  /**
   * Retrieves field definitions for a specific object
   * @param objectKey - The key of the object to retrieve fields for
   * @throws {Error} If the API key is not configured or if the request fails
   * @returns Array of field definitions
   *
   * @example
   * ```typescript
   * const fields = await client.getObjectFields('object_1');
   * const emailFields = fields.filter(f => f.type === 'email');
   * ```
   */
  async getObjectFields(objectKey: string): Promise<KnackField[]> {
    const object = await this.getObjectSchema(objectKey);
    return object.fields;
  }

  /**
   * Gets a specific field's schema from an object
   * @param objectKey - The key of the object containing the field
   * @param fieldKey - The key of the field to retrieve
   * @throws {Error} If the field is not found
   * @returns The field's schema
   *
   * @example
   * ```typescript
   * const emailField = await client.getObjectField('object_1', 'field_1');
   * console.log(emailField.type); // 'email'
   * ```
   */
  async getObjectField(
    objectKey: string,
    fieldKey: string
  ): Promise<KnackField> {
    const fields = await this.getObjectFields(objectKey);
    const field = fields.find((f) => f.key === fieldKey);

    if (!field) {
      throw new Error(`Field ${fieldKey} not found in object ${objectKey}`);
    }

    return field;
  }

  /**
   * Retrieves a specific scene's schema by key
   * @param sceneKey - The key of the scene to retrieve (e.g., "scene_1")
   * @throws {Error} If the scene is not found
   * @returns The scene's schema
   *
   * @example
   * ```typescript
   * const scene = await client.getSceneSchema('scene_1');
   * console.log(scene.views); // List all views in the scene
   * ```
   */
  async getSceneSchema(sceneKey: string): Promise<KnackScene> {
    const schema = await this.getApplicationSchema();
    const scene = schema.scenes.find((s) => s.key === sceneKey);

    if (!scene) {
      throw new Error(`Scene ${sceneKey} not found in application schema`);
    }

    return scene;
  }

  /**
   * Gets all views for a specific scene
   * @param sceneKey - The key of the scene containing the views
   * @returns Array of views in the scene
   *
   * @example
   * ```typescript
   * const views = await client.getSceneViews('scene_1');
   * const tableViews = views.filter(v => v.type === 'table');
   * ```
   */
  async getSceneViews(sceneKey: string): Promise<KnackView[]> {
    const scene = await this.getSceneSchema(sceneKey);
    return scene.views;
  }

  /**
   * Gets a specific view from a scene
   * @param sceneKey - The key of the scene containing the view
   * @param viewKey - The key of the view to retrieve (e.g., "view_1")
   * @throws {Error} If the view is not found
   * @returns The requested view
   *
   * @example
   * ```typescript
   * const view = await client.getSceneView('scene_1', 'view_1');
   * if (view.type === 'table') {
   *   console.log('This is a table view');
   * }
   * ```
   */
  async getSceneView(sceneKey: string, viewKey: string): Promise<KnackView> {
    const views = await this.getSceneViews(sceneKey);
    const view = views.find((v) => v.key === viewKey);

    if (!view) {
      throw new Error(`View ${viewKey} not found in scene ${sceneKey}`);
    }

    return view;
  }

  // Getters for config values needed by API Explorer
  public getApplicationId(): string {
    return this.config.applicationId;
  }

  getApiKey(): string | undefined {
    return this.config.apiKey;
  }

  getApiHost(): string | undefined {
    return this.config.apiHost;
  }
}
