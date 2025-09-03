/* eslint-disable @typescript-eslint/no-explicit-any */
import { KnackApplication } from "./types/application";
import { KnackObject } from "./types/object";
import { KnackRecord } from "./types/record";

interface KnackClientConfig {
  applicationId: string;
  apiKey?: string;
  userToken?: string;
  apiDomain?: string;
  apiHost?: string;
  apiVersion?: string;
}

export class KnackClient {
  private readonly applicationId: string;
  private readonly apiKey?: string;
  private readonly userToken?: string;
  private readonly baseUrl: string;

  constructor(config: KnackClientConfig) {
    this.applicationId = config.applicationId;
    this.apiKey = config.apiKey;
    this.userToken = config.userToken;

    // Default values for API configuration
    const domain = config.apiDomain || "api";
    const host = config.apiHost || "knack.com";
    const version = config.apiVersion || "v1";

    // Special case for HIPAA accounts
    if (host.includes("hipaa")) {
      this.baseUrl = "https://usgc-api.knack.com/v1";
    } else {
      this.baseUrl = `https://${domain}.${host}/${version}`;
    }
  }

  private getHeaders(requiresJson: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      "X-Knack-Application-Id": this.applicationId,
    };

    // Object-based requests use API key
    if (this.apiKey) {
      headers["X-Knack-REST-API-KEY"] = this.apiKey;
    } else {
      // View-based requests use 'knack' as API key
      headers["X-Knack-REST-API-KEY"] = "knack";
    }

    // Add authorization header for view-based requests on protected pages
    if (this.userToken) {
      headers["Authorization"] = this.userToken;
    }

    // Add content-type for PUT/POST requests
    if (requiresJson) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  async getObjects(): Promise<KnackObject[]> {
    if (!this.apiKey) {
      throw new Error("API key required for object-based requests");
    }

    const response = await fetch(`${this.baseUrl}/objects`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch objects: ${response.statusText}`);
    }

    const data = await response.json();
    return data.objects;
  }

  async getObjectRecords(
    objectKey: string
  ): Promise<{ records: KnackRecord[] }> {
    if (!this.apiKey) {
      throw new Error("API key required for object-based requests");
    }

    const response = await fetch(
      `${this.baseUrl}/objects/${objectKey}/records`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch object records: ${response.statusText}`);
    }

    const data = await response.json();
    return data.records;
  }

  async getApplicationSchema(): Promise<{ application: KnackApplication }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/applications/${this.applicationId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          // Try to get error details from response
          if (contentType?.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = `API Error: ${response.status} - ${text.slice(
              0,
              100
            )}...`;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch application schema:", error);
      throw error;
    }
  }
}
