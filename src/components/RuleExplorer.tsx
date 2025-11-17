"use client";
import { Fragment, useMemo, useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  X,
  Mail,
  Database,
  FileText,
  Calendar,
  Download,
} from "lucide-react";
import { useGraphStore } from "@/lib/store/graphStore";
import { useKnackApplication } from "@/lib/hooks/use-knack";
import { useDuckDB } from "@/lib/hooks/use-duckdb";
import { RuleQueries, exportRulesToCSV } from "@/lib/duckdb/queries";
import {
  buildRuleIndex,
  filterRules,
  sortRules,
  type RuleCategory,
  type RuleSource,
  type RuleDescriptor,
} from "@/lib/services/ruleIndex";
import { buildRuleBuilderUrl } from "@/lib/knack/builder-urls";
import { ExternalLink } from "lucide-react";

type SortOption = "field" | "origin" | "category" | "source";

export function RuleExplorer() {
  const { graph, setRoot, setSelected, applicationId, apiKey } =
    useGraphStore();
  const appQuery = useKnackApplication(applicationId, apiKey);
  const { client, loaded: duckdbLoaded } = useDuckDB(
    appQuery.data ?? null,
    graph ?? null,
    { enableFTS: true }
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<RuleCategory | "all">(
    "all"
  );
  const [sourceFilter, setSourceFilter] = useState<RuleSource | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("field");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [useFTS, setUseFTS] = useState(false);
  const [duckdbRules, setDuckdbRules] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [loadingDuckDB, setLoadingDuckDB] = useState(false);

  const ruleIndex = useMemo(() => {
    if (!graph || !appQuery.data) return null;
    return buildRuleIndex(graph, appQuery.data);
  }, [graph, appQuery.data]);

  // Query DuckDB when filters change and DuckDB is loaded
  useEffect(() => {
    if (!client || !duckdbLoaded) return;

    async function queryDuckDB() {
      setLoadingDuckDB(true);
      try {
        const queries = new RuleQueries(client);
        const rules = await queries.getRules({
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          source: sourceFilter !== "all" ? sourceFilter : undefined,
          searchTerm: searchTerm || undefined,
        });
        setDuckdbRules(rules);
      } catch (err) {
        console.error("DuckDB query error:", err);
      } finally {
        setLoadingDuckDB(false);
      }
    }

    queryDuckDB();
  }, [client, duckdbLoaded, categoryFilter, sourceFilter, searchTerm]);

  // Fallback to in-memory index if DuckDB not available
  const filteredRules = useMemo(() => {
    // If DuckDB is loaded and we have results, convert them to RuleDescriptor format
    if (duckdbLoaded && client && duckdbRules.length > 0 && ruleIndex) {
      // Map DuckDB results back to RuleDescriptors using the rule index
      return duckdbRules
        .map((dbRule) => {
          const id = dbRule.id as string;
          return ruleIndex.allRules.find((r) => r.id === id);
        })
        .filter((r): r is RuleDescriptor => r !== undefined);
    }

    // Fallback to in-memory filtering
    if (!ruleIndex) return [];

    let rules = filterRules(ruleIndex, {
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      source: sourceFilter !== "all" ? sourceFilter : undefined,
    });

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rules = rules.filter((r) => {
        const fieldName = (
          r.targetField.name ||
          r.targetField.key ||
          ""
        ).toLowerCase();
        const originName = (r.origin.name || r.origin.key || "").toLowerCase();
        const taskName = (r.taskName || "").toLowerCase();
        const viewName = (r.viewName || "").toLowerCase();
        const emailSubject = (r.emailSubject || "").toLowerCase();
        const emailMessage = (r.emailMessage || "").toLowerCase();
        return (
          fieldName.includes(term) ||
          originName.includes(term) ||
          taskName.includes(term) ||
          viewName.includes(term) ||
          emailSubject.includes(term) ||
          emailMessage.includes(term)
        );
      });
    }

    return sortRules(rules, sortBy);
  }, [
    ruleIndex,
    categoryFilter,
    sourceFilter,
    searchTerm,
    sortBy,
    duckdbLoaded,
    client,
    duckdbRules,
  ]);

  const handleRuleClick = (rule: RuleDescriptor) => {
    // Focus on the target field
    setRoot(rule.targetField);
    setSelected(rule.targetField);
  };

  const handleOriginClick = (rule: RuleDescriptor, e: React.MouseEvent) => {
    e.stopPropagation();
    setRoot(rule.origin);
    setSelected(rule.origin);
  };

  const getCategoryIcon = (category: RuleCategory) => {
    switch (category) {
      case "email":
        return <Mail className="h-3 w-3" />;
      case "record":
        return <Database className="h-3 w-3" />;
      case "display":
        return <FileText className="h-3 w-3" />;
    }
  };

  const getSourceBadge = (source: RuleSource) => {
    const variants: Record<RuleSource, "default" | "secondary" | "outline"> = {
      form: "default",
      table: "secondary",
      field: "outline",
      task: "default",
    };
    return variants[source] || "default";
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const exportToCSV = async () => {
    if (filteredRules.length === 0) return;

    // Use DuckDB export if available (but we need app data for URLs, so use manual export)
    // DuckDB export doesn't include builder URLs since it needs app schema
    // Always use manual export to ensure URLs are included

    // Fallback to manual CSV export
    // CSV header
    const headers = [
      "Category",
      "Source",
      "Target Field",
      "Target Field Key",
      "Origin",
      "Origin Key",
      "View Name",
      "Scene Name",
      "Task Name",
      "Email Subject",
      "Email Template",
      "From Name",
      "From Email",
      "Recipients",
      "Operator",
      "Schedule",
      "Record Values",
      "Record Criteria",
      "Builder URL",
    ];

    // Escape CSV values
    const escapeCSV = (value: unknown): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      // Replace newlines with spaces, escape quotes
      const cleaned = str.replace(/\n/g, " ").replace(/\r/g, "");
      if (
        cleaned.includes(",") ||
        cleaned.includes('"') ||
        cleaned.includes("\n")
      ) {
        return `"${cleaned.replace(/"/g, '""')}"`;
      }
      return cleaned;
    };

    // Build CSV rows
    const rows = filteredRules.map((rule) => {
      const emailRecipients = rule.emailRecipients
        ? rule.emailRecipients
            .map((r: any) => String(r.email || r.field || "Unknown"))
            .join("; ")
        : "";

      const recordValues = rule.recordValues
        ? JSON.stringify(rule.recordValues).replace(/\n/g, " ")
        : "";

      const recordCriteria = rule.recordCriteria
        ? JSON.stringify(rule.recordCriteria).replace(/\n/g, " ")
        : "";

      const schedule =
        rule.taskSchedule &&
        typeof rule.taskSchedule === "object" &&
        rule.taskSchedule !== null &&
        "repeat" in rule.taskSchedule
          ? String((rule.taskSchedule as { repeat: unknown }).repeat)
          : "";

      // Generate builder URL
      const builderUrl = appQuery.data
        ? buildRuleBuilderUrl(appQuery.data, rule)
        : null;

      return [
        rule.category,
        rule.source,
        rule.targetField.name || rule.targetField.key || "",
        rule.targetField.key || "",
        rule.origin.name || rule.origin.key || "",
        rule.origin.key || "",
        rule.viewName || "",
        rule.sceneName || "",
        rule.taskName || "",
        rule.emailSubject || "",
        rule.emailMessage ? stripHtml(rule.emailMessage) : "",
        rule.emailFromName || "",
        rule.emailFromEmail || "",
        emailRecipients,
        rule.operator || "",
        schedule,
        recordValues,
        recordCriteria,
        builderUrl || "",
      ].map(escapeCSV);
    });

    // Combine header and rows
    const csvContent = [headers.map(escapeCSV), ...rows]
      .map((row) => row.join(","))
      .join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `rules-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!ruleIndex) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-sm">Rule Explorer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Load an application to explore rules
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryCounts = {
    record: ruleIndex.byCategory.get("record")?.length ?? 0,
    email: ruleIndex.byCategory.get("email")?.length ?? 0,
    display: ruleIndex.byCategory.get("display")?.length ?? 0,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="w-full">
        <CardHeader className="border-b p-3">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm">Rule Explorer</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {filteredRules.length} rules
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredRules.length === 0}
                className="h-7 text-xs flex items-center gap-1.5"
              >
                <Download className="h-3 w-3" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              className="pl-7 pr-6 text-xs h-7"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select
              value={categoryFilter}
              onValueChange={(v) =>
                setCategoryFilter(v as RuleCategory | "all")
              }
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="record">
                  Record ({categoryCounts.record})
                </SelectItem>
                <SelectItem value="email">
                  Email ({categoryCounts.email})
                </SelectItem>
                <SelectItem value="display">
                  Display ({categoryCounts.display})
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sourceFilter}
              onValueChange={(v) => setSourceFilter(v as RuleSource | "all")}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="form">Form</SelectItem>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="field">Field</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="mt-2">
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="field">Sort by Field</SelectItem>
                <SelectItem value="origin">Sort by Origin</SelectItem>
                <SelectItem value="category">Sort by Category</SelectItem>
                <SelectItem value="source">Sort by Source</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredRules.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground text-center">
                No rules found matching your filters
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Category</TableHead>
                    <TableHead className="w-[150px]">Source</TableHead>
                    <TableHead className="w-[200px]">Target Field</TableHead>
                    <TableHead className="w-[200px]">Origin</TableHead>
                    <TableHead className="w-[300px]">Template</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => {
                    const isExpanded = expandedRow === rule.id;
                    return (
                      <Fragment key={rule.id}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => {
                            handleRuleClick(rule);
                            setExpandedRow(isExpanded ? null : rule.id);
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {getCategoryIcon(rule.category)}
                              <span className="text-xs font-medium">
                                {rule.category}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getSourceBadge(rule.source)}
                              className="text-xs px-1.5 py-0"
                            >
                              {rule.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-medium">
                              {rule.targetField.name || rule.targetField.key}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <button
                                className="text-xs text-left hover:underline"
                                onClick={(e) => handleOriginClick(rule, e)}
                              >
                                {rule.origin.name || rule.origin.key}
                              </button>
                              {appQuery.data && (() => {
                                const builderUrl = buildRuleBuilderUrl(
                                  appQuery.data,
                                  rule
                                );
                                return builderUrl ? (
                                  <a
                                    href={builderUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Open in Knack Builder"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : null;
                              })()}
                            </div>
                            {rule.viewName && (
                              <div className="text-xs text-muted-foreground">
                                {rule.viewName}
                                {rule.sceneName && ` (${rule.sceneName})`}
                              </div>
                            )}
                            {rule.taskName && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {rule.taskName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs max-w-[300px]">
                              {rule.emailMessage ? (
                                <div className="line-clamp-3 text-muted-foreground">
                                  {stripHtml(rule.emailMessage)}
                                </div>
                              ) : rule.recordValues &&
                                rule.recordValues.length > 0 ? (
                                <div className="text-muted-foreground">
                                  Record rule ({rule.recordValues.length}{" "}
                                  values)
                                </div>
                              ) : rule.recordCriteria &&
                                rule.recordCriteria.length > 0 ? (
                                <div className="text-muted-foreground">
                                  Record criteria ({rule.recordCriteria.length}{" "}
                                  criteria)
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              {rule.emailSubject && (
                                <div>
                                  <span className="font-medium">Subject:</span>{" "}
                                  {rule.emailSubject}
                                </div>
                              )}
                              {rule.operator && (
                                <div>
                                  <span className="font-medium">Operator:</span>{" "}
                                  {rule.operator}
                                </div>
                              )}
                              {rule.taskSchedule ? (
                                <div>
                                  <span className="font-medium">Schedule:</span>{" "}
                                  {typeof rule.taskSchedule === "object" &&
                                  rule.taskSchedule !== null &&
                                  "repeat" in rule.taskSchedule
                                    ? String(
                                        (
                                          rule.taskSchedule as {
                                            repeat: unknown;
                                          }
                                        ).repeat
                                      )
                                    : "Unknown"}
                                </div>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRow(isExpanded ? null : rule.id);
                              }}
                            >
                              {isExpanded ? "−" : "+"}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/30">
                              <div className="p-4 space-y-3">
                                {rule.emailMessage && (
                                  <div>
                                    <div className="text-xs font-semibold mb-2">
                                      Email Template:
                                    </div>
                                    <div className="text-xs bg-background p-3 rounded border max-h-48 overflow-y-auto">
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: rule.emailMessage,
                                        }}
                                      />
                                    </div>
                                    {rule.emailFromName && (
                                      <div className="text-xs text-muted-foreground mt-2">
                                        From: {rule.emailFromName}
                                        {rule.emailFromEmail &&
                                          ` <${rule.emailFromEmail}>`}
                                      </div>
                                    )}
                                    {rule.emailRecipients &&
                                      rule.emailRecipients.length > 0 && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Recipients:{" "}
                                          {rule.emailRecipients
                                            .map((r: any) =>
                                              String(
                                                r.email || r.field || "Unknown"
                                              )
                                            )
                                            .join(", ")}
                                        </div>
                                      )}
                                  </div>
                                )}
                                {rule.recordValues &&
                                  rule.recordValues.length > 0 && (
                                    <div>
                                      <div className="text-xs font-semibold mb-2">
                                        Record Values:
                                      </div>
                                      <pre className="text-xs bg-background p-3 rounded border max-h-48 overflow-y-auto">
                                        {JSON.stringify(
                                          rule.recordValues,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </div>
                                  )}
                                {rule.recordCriteria &&
                                  rule.recordCriteria.length > 0 && (
                                    <div>
                                      <div className="text-xs font-semibold mb-2">
                                        Record Criteria:
                                      </div>
                                      <pre className="text-xs bg-background p-3 rounded border max-h-48 overflow-y-auto">
                                        {JSON.stringify(
                                          rule.recordCriteria,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </div>
                                  )}
                                {!rule.emailMessage &&
                                  !rule.recordValues &&
                                  !rule.recordCriteria && (
                                    <div className="text-xs text-muted-foreground">
                                      No additional details available
                                    </div>
                                  )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
