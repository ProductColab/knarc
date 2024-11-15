"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";
import { useKnack } from "@/lib/knack/context";
import { useConfig } from "@/hooks/useConfig";
import {
  CommonEndpoints,
  type CommonEndpoint,
  COMMON_ENDPOINTS,
} from "./common-endpoints";
import { QueryParameters, QueryParams, QUERY_PARAMS } from "./query-parameters";
import { ResponseSection, ApiResponse } from "./response-section";
import { RequestBuilder, HttpMethod } from "./request-builder";
import { ApiKeyInput } from "./api-key-input";
import { UrlPreview } from "./url-preview";
import { KnackResponseFormat } from "@/lib/knack/types/requests";
import Content from "@/components/ui/Content";
import { UserAuthSection } from "./user-auth-section";
import { SceneViewSelector } from "./scene-view-selector";
import { isSceneProtected } from "@/lib/knack/utils/scenes";
import type { KnackScene } from "@/lib/knack/types/scenes";
import { ObjectSelector } from "./object-selector";

export function ApiExplorer() {
  const { client } = useKnack();
  const { activeConfig } = useConfig();
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [endpoint, setEndpoint] = useState<string>("/objects");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [queryParams, setQueryParams] = useState<QueryParams>(() => {
    const defaults: QueryParams = {};
    QUERY_PARAMS.forEach((param) => {
      if ("defaultValue" in param && param.defaultValue) {
        defaults[param.name] = param.defaultValue;
      }
    });
    return defaults;
  });
  const [userToken, setUserToken] = useState<string>();
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [userEmail, setUserEmail] = useState<string>();
  const [scenes, setScenes] = useState<KnackScene[]>([]);

  // Check if current endpoint requires auth
  const requiresAuth = useMemo(() => {
    if (!endpoint.startsWith("/pages/")) {
      return false;
    }
    const sceneKey = endpoint.split("/")[2];
    const scene = scenes.find((s) => s.key === sceneKey);
    return scene && isSceneProtected(scene, scenes);
  }, [endpoint, scenes]);

  useEffect(() => {
    if (activeConfig?.apiKey) {
      setApiKey(activeConfig.apiKey);
    }
  }, [activeConfig]);

  useEffect(() => {
    const loadScenes = async () => {
      if (client) {
        const data = await client.getApplicationSchema();
        setScenes(data.scenes || []);
      }
    };
    loadScenes();
  }, [client]);

  if (!activeConfig || !client) {
    return null;
  }

  const handleEndpointSelect = (path: string) => {
    setEndpoint(path);
    setMethod("GET");
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await client.login({ email, password });
      setUserToken(response.session.user.token);
      setUserEmail(email);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const handleLogout = () => {
    client.logout();
    setUserToken(undefined);
    setUserEmail(undefined);
  };

  const handleSend = async () => {
    setLoading(true);
    const startTime = performance.now();

    try {
      if (endpoint.startsWith("/pages/")) {
        const sceneKey = endpoint.split("/")[2];
        const scene = scenes.find((s) => s.key === sceneKey);

        if (scene && isSceneProtected(scene, scenes)) {
          if (!userToken) {
            setShowAuthForm(true);
            throw new Error("Authentication required to access this scene");
          }
          client.setUserToken(userToken);
        }
      }

      let data;
      const options = {
        format: queryParams.format as KnackResponseFormat | undefined,
        page: queryParams.page ? parseInt(queryParams.page) : undefined,
        rows_per_page: queryParams.rows_per_page
          ? parseInt(queryParams.rows_per_page)
          : undefined,
        sort_field: queryParams.sort_field,
        sort_order: queryParams.sort_order as "asc" | "desc" | undefined,
      };

      const currentClient = endpoint.startsWith("/objects")
        ? client.withPrivateAccess(apiKey)
        : client;

      if (endpoint === "/objects") {
        data = await currentClient.getApplicationSchema();
      } else if (
        endpoint.startsWith("/objects/") &&
        endpoint.endsWith("/records")
      ) {
        const objectKey = endpoint.split("/")[2];
        data = await currentClient.getObjectRecords(objectKey, options);
      } else if (endpoint.startsWith("/pages/")) {
        const pathParts = endpoint.split("/");
        const sceneKey = pathParts[2];
        data = await currentClient.getSceneSchema(sceneKey);
      }

      const endTime = performance.now();

      setResponse({
        status: 200,
        data,
        headers: {
          "Content-Type": "application/json",
        },
        duration: Math.round(endTime - startTime),
      });
    } catch (error: unknown) {
      console.error("Request failed:", error);
      setResponse({
        status:
          error instanceof Error &&
          error.message === "Authentication required to access this scene"
            ? 401
            : 500,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        headers: {},
        duration: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQueryParam = (name: keyof QueryParams, value: string) => {
    setQueryParams((prev) => {
      if (!value || value === "__clear__") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: value };
    });
  };

  const buildQueryString = (params: QueryParams): string => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (key === "sort_order" && !params.sort_field) {
        return;
      }
      if (value) searchParams.append(key, value);
    });
    return searchParams.toString();
  };

  const fullUrl = `https://${activeConfig.apiDomain}/${
    activeConfig.apiHost
  }/v1${endpoint}${
    Object.keys(queryParams).length ? "?" + buildQueryString(queryParams) : ""
  }`;

  const handleAuthRequired = () => {
    setShowAuthForm(true);
  };

  // Helper to determine which endpoint type is active
  const getEndpointType = (path: string): CommonEndpoint | null => {
    return (
      COMMON_ENDPOINTS.find((ep) => {
        // Convert template path to regex
        const regexPath = ep.path.replace(/{([^}]+)}/g, "([^/]+)");
        return new RegExp(`^${regexPath}$`).test(path);
      })?.path ?? null
    );
  };

  const activeEndpointType = getEndpointType(endpoint);

  return (
    <Content>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Explorer</CardTitle>
              <CardDescription>
                Test Knack API endpoints and explore responses for{" "}
                {activeConfig.name}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                window.open(
                  "https://docs.knack.com/docs/api-introduction",
                  "_blank"
                )
              }
            >
              <Book className="w-4 h-4" />
              API Docs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <CommonEndpoints
            onEndpointSelect={handleEndpointSelect}
            activeEndpoint={activeEndpointType ?? ""}
          />

          {/* Show object selector for object endpoints */}
          {activeEndpointType === "/objects/{object_key}/records" && (
            <ObjectSelector
              onSelect={handleEndpointSelect}
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
            />
          )}

          {/* Show scene/view selector for view endpoints */}
          {activeEndpointType ===
            "/pages/{scene_key}/views/{view_key}/records" && (
            <SceneViewSelector
              onSelect={handleEndpointSelect}
              isAuthenticated={!!userToken}
              onAuthRequired={handleAuthRequired}
            />
          )}

          {/* Show auth section when needed */}
          {(showAuthForm || userToken) && (
            <UserAuthSection
              onLogin={handleLogin}
              onLogout={() => {
                handleLogout();
                setShowAuthForm(false);
              }}
              isAuthenticated={!!userToken}
              showForm={showAuthForm}
              userEmail={userEmail}
            />
          )}

          <RequestBuilder
            method={method}
            endpoint={endpoint}
            loading={loading}
            onMethodChange={setMethod}
            onEndpointChange={setEndpoint}
            onSend={handleSend}
            requiresAuth={requiresAuth}
            isAuthenticated={!!userToken}
          />

          <UrlPreview url={fullUrl} />

          {/* Show API key input only for object endpoints */}
          {activeEndpointType?.startsWith("/objects") && (
            <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />
          )}

          {/* Always show query parameters for now */}
          <QueryParameters
            queryParams={queryParams}
            onUpdateQueryParam={updateQueryParam}
          />

          <ResponseSection response={response} />
        </CardContent>
      </Card>
    </Content>
  );
}
