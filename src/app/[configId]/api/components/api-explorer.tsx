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
import { CommonEndpoints } from "./common-endpoints";
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
import { cn } from "@/lib/utils";

interface StoredConfig {
  endpoint: string;
  method: HttpMethod;
  apiKey?: string;
  queryParams: QueryParams;
}

const STORAGE_KEY = "api-explorer-config";

function getDefaultConfig(): StoredConfig {
  const defaultQueryParams: QueryParams = {};
  QUERY_PARAMS.forEach((param) => {
    if ("defaultValue" in param && param.defaultValue) {
      defaultQueryParams[param.name] = param.defaultValue;
    }
  });

  return {
    endpoint: "/objects",
    method: "GET",
    queryParams: defaultQueryParams,
  };
}
function buildQueryString(params: QueryParams): string {
  return new URLSearchParams(
    Object.entries(params)
      .filter(
        ([key, value]) => value && (key !== "sort_order" || params.sort_field)
      )
      .map(([key, value]) => [key, value!] as [string, string])
  ).toString();
}

export function ApiExplorer() {
  const { client } = useKnack();
  const { activeConfig } = useConfig();

  const [config, setConfig] = useState<StoredConfig>(() => {
    if (typeof window === "undefined") return getDefaultConfig();

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : getDefaultConfig();
    } catch (e) {
      console.error("Failed to parse stored config:", e);
      return getDefaultConfig();
    }
  });

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState<string>();
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [userEmail, setUserEmail] = useState<string>();
  const [scenes, setScenes] = useState<KnackScene[]>([]);

  const { endpoint, method, apiKey, queryParams } = config;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }, [config]);

  useEffect(() => {
    if (activeConfig?.apiKey && !config.apiKey) {
      updateConfig({ apiKey: activeConfig.apiKey });
    }
  }, [activeConfig, config.apiKey]);

  useEffect(() => {
    async function loadScenes() {
      if (!client) return;
      const data = await client.getApplicationSchema();
      setScenes(data.scenes || []);
    }
    loadScenes();
  }, [client]);

  const updateConfig = (updates: Partial<StoredConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const requiresAuth = useMemo(() => {
    if (!endpoint.startsWith("/pages/")) return false;
    const sceneKey = endpoint.split("/")[2];
    const scene = scenes.find((s) => s.key === sceneKey);
    return scene && isSceneProtected(scene, scenes);
  }, [endpoint, scenes]);

  const handleEndpointSelect = (path: string) => {
    updateConfig({ endpoint: path, method: "GET" });
  };

  const handleMethodChange = (newMethod: HttpMethod) => {
    updateConfig({ method: newMethod });
  };

  const handleApiKeyChange = (newKey: string) => {
    updateConfig({ apiKey: newKey });
  };

  const updateQueryParam = (name: keyof QueryParams, value: string) => {
    updateConfig({
      queryParams: {
        ...queryParams,
        [name]: value === "__clear__" ? undefined : value,
      },
    });
  };

  const handleLogin = async (email: string, password: string) => {
    if (!client) return;
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
    if (!client) return;
    client.logout();
    setUserToken(undefined);
    setUserEmail(undefined);
  };

  const handleSend = async () => {
    if (!client) return;

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
        ? client.withPrivateAccess(apiKey || "knack")
        : client;

      const data = await (async () => {
        if (endpoint === "/objects") {
          return currentClient.getApplicationSchema();
        }
        if (endpoint.startsWith("/objects/") && endpoint.endsWith("/records")) {
          const objectKey = endpoint.split("/")[2];
          return currentClient.getObjectRecords(objectKey, options);
        }
        if (endpoint.startsWith("/pages/")) {
          const sceneKey = endpoint.split("/")[2];
          return currentClient.getSceneSchema(sceneKey);
        }
      })();

      const endTime = performance.now();

      setResponse({
        status: 200,
        data,
        headers: { "Content-Type": "application/json" },
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

  const fullUrl =
    activeConfig &&
    `https://${activeConfig.apiDomain}/${activeConfig.apiHost}/v1${endpoint}${
      Object.keys(queryParams).length ? "?" + buildQueryString(queryParams) : ""
    }`;

  if (!activeConfig || !client || !fullUrl) {
    return null;
  }

  return (
    <Content>
      <Card className="glass-card border-glow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-glow-purple text-glow-sm">
                API Explorer
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Test Knack API endpoints and explore responses for{" "}
                {activeConfig.name}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className={cn(
                "gap-2",
                "glass-border",
                "hover:border-glow-purple/20",
                "hover:text-glow-purple hover:text-glow-sm",
                "transition-all duration-300"
              )}
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
            activeEndpoint={endpoint}
          />

          {endpoint.startsWith("/objects") && (
            <ObjectSelector
              onSelect={handleEndpointSelect}
              apiKey={apiKey || ""}
              onApiKeyChange={handleApiKeyChange}
            />
          )}

          {endpoint.startsWith("/pages/") && (
            <SceneViewSelector
              onSelect={handleEndpointSelect}
              isAuthenticated={!!userToken}
              onAuthRequired={() => setShowAuthForm(true)}
            />
          )}

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
            onMethodChange={handleMethodChange}
            onEndpointChange={(newEndpoint) =>
              updateConfig({ endpoint: newEndpoint })
            }
            onSend={handleSend}
            requiresAuth={requiresAuth}
            isAuthenticated={!!userToken}
          />

          <UrlPreview url={fullUrl} />

          {endpoint.startsWith("/objects") && (
            <ApiKeyInput
              apiKey={apiKey || ""}
              onApiKeyChange={handleApiKeyChange}
            />
          )}

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
