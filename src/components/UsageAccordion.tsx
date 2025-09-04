"use client";
import { useMemo, useReducer, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  Database,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGraphStore } from "@/lib/store/graphStore";
import { toNodeId } from "@/lib/deps/types";
import { clearGraph } from "@/lib/knack/graph";
import { Slider } from "@/components/ui/slider";

type SortOption = "name" | "fieldCount" | "viewCount";
type FilterOption =
  | "all"
  | "withFields"
  | "withoutFields"
  | "withViews"
  | "withoutViews";

interface State {
  appId: string;
  searchTerm: string;
  objectSort: SortOption;
  sceneSort: SortOption;
  objectFilter: FilterOption;
  sceneFilter: FilterOption;
  isLoading: boolean;
  expandedObjects: Set<string>;
  expandedScenes: Set<string>;
}

type Action =
  | { type: "SET_APP_ID"; payload: string }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_OBJECT_SORT"; payload: SortOption }
  | { type: "SET_SCENE_SORT"; payload: SortOption }
  | { type: "SET_OBJECT_FILTER"; payload: FilterOption }
  | { type: "SET_SCENE_FILTER"; payload: FilterOption }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "TOGGLE_OBJECT_EXPANSION"; payload: string }
  | { type: "TOGGLE_SCENE_EXPANSION"; payload: string }
  | { type: "CLEAR_SEARCH" }
  | { type: "RESET_EXPANSIONS" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_APP_ID":
      return { ...state, appId: action.payload };
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_OBJECT_SORT":
      return { ...state, objectSort: action.payload };
    case "SET_SCENE_SORT":
      return { ...state, sceneSort: action.payload };
    case "SET_OBJECT_FILTER":
      return { ...state, objectFilter: action.payload };
    case "SET_SCENE_FILTER":
      return { ...state, sceneFilter: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "TOGGLE_OBJECT_EXPANSION": {
      const newExpanded = new Set(state.expandedObjects);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedObjects: newExpanded };
    }
    case "TOGGLE_SCENE_EXPANSION": {
      const newExpanded = new Set(state.expandedScenes);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedScenes: newExpanded };
    }
    case "CLEAR_SEARCH":
      return { ...state, searchTerm: "" };
    case "RESET_EXPANSIONS":
      return {
        ...state,
        expandedObjects: new Set(),
        expandedScenes: new Set(),
      };
    default:
      return state;
  }
}

function getDisplayName(node: {
  name?: string;
  key: string | undefined;
}): string {
  return node.name || node.key || "";
}

function sortByName<T extends { name?: string; key: string | undefined }>(
  a: T,
  b: T
): number {
  return getDisplayName(a).localeCompare(getDisplayName(b));
}

export function UsageAccordion() {
  const { graph, setRoot, applicationId, setConfig, selected, root } =
    useGraphStore();

  const [state, dispatch] = useReducer(reducer, {
    appId: applicationId ?? "",
    searchTerm: "",
    objectSort: "name" as SortOption,
    sceneSort: "name" as SortOption,
    objectFilter: "all" as FilterOption,
    sceneFilter: "all" as FilterOption,
    isLoading: false,
    expandedObjects: new Set<string>(),
    expandedScenes: new Set<string>(),
  });

  const qc = useQueryClient();

  const objects = useMemo(
    () => (graph ? graph.getAllNodes().filter((n) => n.type === "object") : []),
    [graph]
  );

  const scenes = useMemo(
    () => (graph ? graph.getAllNodes().filter((n) => n.type === "scene") : []),
    [graph]
  );

  const activeId = useMemo(() => {
    if (selected) return toNodeId(selected);
    if (root) return toNodeId(root);
    return undefined;
  }, [selected, root]);

  const filteredAndSortedObjects = useMemo(() => {
    const filtered = objects.filter((obj) => {
      const displayName = getDisplayName(obj);
      const matchesSearch =
        !state.searchTerm ||
        displayName.toLowerCase().includes(state.searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const fields = graph
        ? graph
            .getOutgoing(obj)
            .filter((e) => e.type === "contains" && e.to.type === "field")
        : [];

      switch (state.objectFilter) {
        case "withFields":
          return fields.length > 0;
        case "withoutFields":
          return fields.length === 0;
        default:
          return true;
      }
    });

    return filtered.sort((a, b) => {
      switch (state.objectSort) {
        case "fieldCount": {
          const aFields = graph
            ? graph
                .getOutgoing(a)
                .filter((e) => e.type === "contains" && e.to.type === "field")
            : [];
          const bFields = graph
            ? graph
                .getOutgoing(b)
                .filter((e) => e.type === "contains" && e.to.type === "field")
            : [];
          return bFields.length - aFields.length;
        }
        case "name":
        default:
          return sortByName(a, b);
      }
    });
  }, [objects, state.searchTerm, state.objectSort, state.objectFilter, graph]);

  const filteredAndSortedScenes = useMemo(() => {
    const filtered = scenes.filter((scene) => {
      const displayName = getDisplayName(scene);
      const matchesSearch =
        !state.searchTerm ||
        displayName.toLowerCase().includes(state.searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const views = graph
        ? graph
            .getOutgoing(scene)
            .filter((e) => e.type === "contains" && e.to.type === "view")
        : [];

      switch (state.sceneFilter) {
        case "withViews":
          return views.length > 0;
        case "withoutViews":
          return views.length === 0;
        default:
          return true;
      }
    });

    return filtered.sort((a, b) => {
      switch (state.sceneSort) {
        case "viewCount": {
          const aViews = graph
            ? graph
                .getOutgoing(a)
                .filter((e) => e.type === "contains" && e.to.type === "view")
            : [];
          const bViews = graph
            ? graph
                .getOutgoing(b)
                .filter((e) => e.type === "contains" && e.to.type === "view")
            : [];
          return bViews.length - aViews.length;
        }
        case "name":
        default:
          return sortByName(a, b);
      }
    });
  }, [scenes, state.searchTerm, state.sceneSort, state.sceneFilter, graph]);

  const handleLoad = useCallback(async () => {
    if (!state.appId.trim()) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await setConfig(state.appId);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.appId, setConfig]);

  const handleRefresh = useCallback(() => {
    if (!state.appId.trim()) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      clearGraph(state.appId);
      qc.invalidateQueries({ queryKey: ["knack-graph", state.appId] });
      qc.invalidateQueries({ queryKey: ["knack-app", state.appId] });
    } catch {
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.appId, qc]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "k":
            e.preventDefault();
            document
              .querySelector<HTMLInputElement>('[placeholder*="Search"]')
              ?.focus();
            break;
          case "r":
            e.preventDefault();
            handleRefresh();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRefresh]);

  return (
    <TooltipProvider>
      <Card className="w-full max-w-md">
        <CardHeader className="border-b p-0">
          {/* App ID and controls */}
          <div className="flex items-center gap-2 p-3">
            <Input
              className="flex-1 text-sm"
              placeholder="Application ID"
              value={state.appId}
              onChange={(e) =>
                dispatch({ type: "SET_APP_ID", payload: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLoad}
                  disabled={state.isLoading || !state.appId.trim()}
                >
                  {state.isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Load"
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Load application data</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={state.isLoading || !state.appId.trim()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data (Ctrl+R)</TooltipContent>
            </Tooltip>
          </div>

          {/* Search and filters */}
          <div className="p-3 border-t space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10 pr-8 text-sm"
                placeholder="Search objects and scenes... (Ctrl+K)"
                value={state.searchTerm}
                onChange={(e) =>
                  dispatch({ type: "SET_SEARCH_TERM", payload: e.target.value })
                }
              />
              {state.searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => dispatch({ type: "CLEAR_SEARCH" })}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {state.searchTerm && (
              <div className="text-xs text-gray-500">
                Found {filteredAndSortedObjects.length} objects,{" "}
                {filteredAndSortedScenes.length} scenes
              </div>
            )}

            {/* Min complexity threshold */}
            <MinComplexitySlider />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={["objects", "scenes"]}>
            {/* Objects Section */}
            <AccordionItem value="objects">
              <AccordionTrigger className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Objects</span>
                  <Badge variant="secondary" className="text-xs">
                    {filteredAndSortedObjects.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-2">
                {/* Object controls */}
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <Filter className="h-3 w-3" />
                  <Select
                    value={state.objectSort}
                    onValueChange={(v: SortOption) =>
                      dispatch({ type: "SET_OBJECT_SORT", payload: v })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Sort by name</SelectItem>
                      <SelectItem value="fieldCount">
                        Sort by field count
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={state.objectFilter}
                    onValueChange={(v: FilterOption) =>
                      dispatch({ type: "SET_OBJECT_FILTER", payload: v })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All objects</SelectItem>
                      <SelectItem value="withFields">With fields</SelectItem>
                      <SelectItem value="withoutFields">
                        Without fields
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="max-h-72 overflow-auto space-y-1">
                  {filteredAndSortedObjects.map((obj) => {
                    const fields = graph
                      ? graph
                          .getOutgoing(obj)
                          .filter(
                            (e) =>
                              e.type === "contains" && e.to.type === "field"
                          )
                          .map((e) => e.to)
                      : [];
                    const isObjectActive = activeId === toNodeId(obj);
                    const objectId = toNodeId(obj);
                    const isExpanded = state.expandedObjects.has(objectId);
                    const displayName = getDisplayName(obj);

                    return (
                      <Card
                        key={objectId}
                        className="border rounded overflow-hidden"
                      >
                        <CardHeader className="flex flex-row items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {fields.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() =>
                                  dispatch({
                                    type: "TOGGLE_OBJECT_EXPANSION",
                                    payload: objectId,
                                  })
                                }
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="link"
                              className={`p-0 text-left h-auto text-sm font-medium truncate ${
                                isObjectActive
                                  ? "text-primary underline"
                                  : "text-gray-900 hover:text-primary"
                              }`}
                              onClick={() =>
                                setRoot({ type: "object", key: obj.key })
                              }
                            >
                              {displayName}
                            </Button>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {fields.length}
                          </Badge>
                        </CardHeader>

                        {fields.length > 0 && isExpanded && (
                          <CardContent className="p-0 border-t">
                            <div className="max-h-32 overflow-auto">
                              {fields.map((field) => {
                                const isFieldActive =
                                  activeId === toNodeId(field);
                                const fieldDisplayName = getDisplayName(field);
                                return (
                                  <Button
                                    key={toNodeId(field)}
                                    variant="ghost"
                                    className={`w-full text-left px-4 py-1.5 text-xs rounded-none justify-start h-auto font-normal ${
                                      isFieldActive
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-gray-50"
                                    }`}
                                    onClick={() =>
                                      setRoot({ type: "field", key: field.key })
                                    }
                                  >
                                    {fieldDisplayName}
                                  </Button>
                                );
                              })}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}

                  {filteredAndSortedObjects.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {state.searchTerm
                        ? "No objects match your search"
                        : "No objects found"}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function MinComplexitySlider() {
  const { minScore, setMinScore } = useGraphStore();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span>Min complexity</span>
        <span className="font-mono">{minScore.toFixed(1)}</span>
      </div>
      <Slider
        value={minScore}
        min={0}
        max={50}
        step={0.5}
        onChange={setMinScore}
      />
    </div>
  );
}
