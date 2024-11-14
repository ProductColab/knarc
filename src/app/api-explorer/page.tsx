"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useKnack } from "@/lib/knack/context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Copy, Check, HelpCircle, Book } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
  duration: number;
}

const COMMON_ENDPOINTS = [
  {
    path: "/objects",
    description: "List all objects in your application",
    method: "GET",
  },
  {
    path: "/objects/{object_key}/records",
    description: "Get records from a specific object",
    method: "GET",
  },
  {
    path: "/pages/{scene_key}/views/{view_key}/records",
    description: "Get records from a specific view",
    method: "GET",
  },
];

type QueryParamBase = {
  name: string;
  description: string;
  example: string;
};

type SelectQueryParam = QueryParamBase & {
  type: "select";
  options: readonly string[];
  defaultValue: string;
};

type NumberQueryParam = QueryParamBase & {
  type: "number";
  min?: number;
  max?: number;
  defaultValue?: string;
};

type TextQueryParam = QueryParamBase & {
  type: "text";
  placeholder?: string;
  defaultValue?: string;
};

type QueryParam = SelectQueryParam | NumberQueryParam | TextQueryParam;

const QUERY_PARAMS: QueryParam[] = [
  {
    name: "format",
    description: "Response format (raw, html, or both)",
    example: "format=raw",
    type: "select",
    options: ["raw", "html", "both"] as const,
    defaultValue: "both",
  },
  {
    name: "page",
    description: "Page number for pagination",
    example: "page=1",
    type: "number",
    min: 1,
    defaultValue: "1",
  },
  {
    name: "rows_per_page",
    description: "Number of records per page (max 1000)",
    example: "rows_per_page=25",
    type: "number",
    min: 1,
    max: 1000,
    defaultValue: "25",
  },
  {
    name: "sort_field",
    description: "Field key to sort by",
    example: "sort_field=field_1",
    type: "text",
    placeholder: "field_1",
  },
  {
    name: "sort_order",
    description: "Sort direction (asc or desc)",
    example: "sort_order=asc",
    type: "select",
    options: ["asc", "desc"] as const,
    defaultValue: "asc",
  },
] as const;

type QueryParams = {
  [K in (typeof QUERY_PARAMS)[number]["name"]]?: string;
};

export default function ApiExplorerPage() {
  const { client } = useKnack();
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [endpoint, setEndpoint] = useState("/objects");
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [queryParams, setQueryParams] = useState<QueryParams>(() => {
    const defaults: QueryParams = {};
    QUERY_PARAMS.forEach((param) => {
      if (param.defaultValue) {
        defaults[param.name] = param.defaultValue;
      }
    });
    return defaults;
  });

  const handleEndpointSelect = (path: string) => {
    setEndpoint(path);
    setMethod(path.includes("records") ? "GET" : "GET");
  };

  const handleSend = async () => {
    setLoading(true);
    const startTime = performance.now();

    try {
      const cleanEndpoint = endpoint.replace(/^\//, "");
      const url = `${client.getApiHost()}/v1/${cleanEndpoint}`;

      const response = await fetch(url, {
        method,
        headers: client.getHeaders(),
        body: method !== "GET" ? requestBody : undefined,
      });

      const data = await response.json();
      const endTime = performance.now();

      setResponse({
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        duration: Math.round(endTime - startTime),
      });
    } catch (error) {
      setResponse({
        status: 500,
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

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateQueryParam = (name: keyof QueryParams, value: string) => {
    setQueryParams((prev) => {
      if (!value || value === "__clear__") {
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

  const fullUrl = `${client.getApiHost()}/v1${endpoint}${
    Object.keys(queryParams).length ? "?" + buildQueryString(queryParams) : ""
  }`;

  const renderQueryParamInput = (param: QueryParam) => {
    if (param.type === "select") {
      return (
        <Select
          value={queryParams[param.name] || param.defaultValue}
          onValueChange={(value) => updateQueryParam(param.name, value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {param.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (param.type === "number") {
      return (
        <Input
          type="number"
          min={param.min}
          max={param.max}
          value={queryParams[param.name] || ""}
          onChange={(e) => updateQueryParam(param.name, e.target.value)}
          placeholder={param.example.split("=")[1]}
        />
      );
    }

    return (
      <Input
        type="text"
        value={queryParams[param.name] || ""}
        onChange={(e) => updateQueryParam(param.name, e.target.value)}
        placeholder={param.placeholder}
      />
    );
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Explorer</CardTitle>
              <CardDescription>
                Test Knack API endpoints and explore responses
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
          {/* Common Endpoints */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Common Endpoints</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {COMMON_ENDPOINTS.map((ep) => (
                <TooltipProvider key={ep.path}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start font-mono text-sm"
                        onClick={() => handleEndpointSelect(ep.path)}
                      >
                        <Badge variant="outline" className="mr-2">
                          {ep.method}
                        </Badge>
                        {ep.path}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{ep.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          {/* Request Builder */}
          <div className="space-y-2">
            <div className="flex gap-4">
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as HttpMethod)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1">
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/objects"
                  className="font-mono"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={loading}
                className="min-w-[100px] gap-2"
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    Send
                    <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground font-mono flex items-center gap-2">
              {fullUrl}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>All API requests use v1 of the Knack API</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Query Parameters Help */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Query Parameters</label>
            <div className="grid grid-cols-1 gap-2">
              {QUERY_PARAMS.map((param) => (
                <div
                  key={param.name}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-md bg-muted"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-primary">
                        {param.name}
                      </code>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {param.description}
                              {param.name === "sort_order" &&
                                " (Only applied when sort_field is set)"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Example: ?{param.example}
                    </p>
                  </div>
                  <div className="w-full sm:w-[200px]">
                    {param.name === "sort_order" ? (
                      <Select
                        value={queryParams[param.name] || param.defaultValue}
                        onValueChange={(value) =>
                          updateQueryParam(param.name, value)
                        }
                        disabled={!queryParams.sort_field}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {param.type === "select" &&
                            param.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      renderQueryParamInput(param)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* URL Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Request URL</label>
            <div className="p-3 rounded-md bg-muted/50 font-mono text-sm break-all">
              {fullUrl}
            </div>
          </div>

          {/* Request Body (for POST/PUT) */}
          {method !== "GET" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Request Body</label>
              <Textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder="{}"
                className="font-mono min-h-[200px]"
              />
            </div>
          )}

          {/* Response Section */}
          <AnimatePresence mode="wait">
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        response.status < 400 ? "default" : "destructive"
                      }
                    >
                      Status: {response.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {response.duration}ms
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={copyResponse}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Response
                      </>
                    )}
                  </Button>
                </div>

                <Tabs defaultValue="response" className="w-full">
                  <TabsList>
                    <TabsTrigger value="response">Response</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="response">
                    <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </TabsContent>
                  <TabsContent value="headers">
                    <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
                      {JSON.stringify(response.headers, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
