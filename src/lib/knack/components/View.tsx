import type {
  KnackTableView,
  KnackFormView,
  KnackRichTextView,
  KnackScene,
  KnackView,
} from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "./ErrorBoundary";
import { ViewSource } from "./ViewSource";
import type { KnackTableViewSource, KnackFormViewSource } from "../types";
import { FormView } from "./views/form/FormView";

interface ViewProps {
  view: KnackView;
  scene: KnackScene;
  loading?: boolean;
  error?: Error;
}

export function View({ view, scene, loading, error }: ViewProps) {
  return (
    <ErrorBoundary
      fallback={<ErrorState error={new Error("Component Error")} />}
    >
      <ViewContent view={view} scene={scene} loading={loading} error={error} />
    </ErrorBoundary>
  );
}

function ViewContent({ view, scene, loading, error }: ViewProps) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <Card className="glass-card border-glow">
      <CardHeader>
        <ViewHeader view={view} scene={scene} />
      </CardHeader>
      <CardContent>
        <ViewBody view={view} />
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card className="glass-card border-glow">
      <CardHeader>
        <div className="h-8 w-[200px] bg-muted animate-pulse rounded" />
        <div className="h-4 w-[300px] bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <Card className="glass-card error-glow">
      <CardHeader>
        <CardTitle className="text-glow-sm text-destructive">Error</CardTitle>
        <CardDescription className="text-destructive/80">
          {error.message}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function ViewHeader({ view, scene }: { view: KnackView; scene: KnackScene }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-glow-white text-glow-sm">
          {view.name}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Scene: {scene.name} ({scene.key})
        </CardDescription>
      </div>
      <Badge variant="outline" className="glass-border">
        {view.type}
      </Badge>
    </div>
  );
}

function ViewBody({ view }: { view: KnackView }) {
  const showSource =
    (view.type === "table" || view.type === "form") &&
    "source" in view &&
    view.source;

  return (
    <div className="space-y-4">
      {showSource && (
        <ViewSource
          source={
            view.type === "table"
              ? (view.source as KnackTableViewSource)
              : (view.source as KnackFormViewSource)
          }
        />
      )}
      <ViewRenderer
        view={view as KnackTableView | KnackFormView | KnackRichTextView}
      />
    </div>
  );
}

interface ViewRendererProps {
  view: KnackTableView | KnackFormView | KnackRichTextView;
}

function ViewRenderer({ view }: ViewRendererProps) {
  switch (view.type) {
    case "table":
      return <TableViewRenderer view={view} />;
    case "form":
      return <FormView view={view} />;
    case "rich_text":
      return <RichTextViewRenderer view={view} />;
    default:
      return <DefaultViewRenderer view={view} />;
  }
}

function DefaultViewRenderer({ view }: { view: KnackView }) {
  return (
    <div className="glass-border bg-muted/5 p-4 rounded-md">
      <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
        {JSON.stringify(view, null, 2)}
      </pre>
    </div>
  );
}

function TableViewRenderer({ view }: { view: KnackTableView }) {
  return (
    <div className="space-y-6">
      <TableViewHeader view={view} />
      <TableViewColumns columns={view.columns} />
    </div>
  );
}

function TableViewHeader({ view }: { view: KnackTableView }) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Badge variant="secondary" className="glass-border">
        {view.columns?.length || 0} Column
        {!view.columns?.length || view.columns.length === 1 ? "" : "s"}
      </Badge>
      {view.keyword_search && (
        <Badge variant="outline" className="glass-border">
          Keyword Search Enabled
        </Badge>
      )}
      {view.allow_exporting && (
        <Badge variant="outline" className="glass-border">
          Export Enabled
        </Badge>
      )}
      {view.rows_per_page && (
        <Badge variant="outline" className="glass-border">
          {view.rows_per_page} Rows Per Page
        </Badge>
      )}
    </div>
  );
}

function TableViewColumns({
  columns = [],
}: {
  columns?: KnackTableView["columns"];
}) {
  if (!columns.length) return null;

  return (
    <div className="glass-border bg-muted/5 p-4 rounded-md">
      <h4 className="text-sm font-medium mb-4 text-glow-white text-glow-sm">
        Columns
      </h4>
      <div className="grid gap-4">
        {columns.map((column, index) => (
          <TableViewColumn
            key={column.type === "field" ? column.field.key : index}
            column={column}
          />
        ))}
      </div>
    </div>
  );
}

function TableViewColumn({ column }: { column: KnackTableView["columns"][0] }) {
  return (
    <div className="glass-border bg-muted/5 p-4 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h5 className="font-medium text-glow-white">
            {column.header || "(No Header)"}
          </h5>
          {column.type === "field" && (
            <code className="text-sm text-muted-foreground font-mono">
              {column.field.key}
            </code>
          )}
        </div>
        <Badge className="glass-border">{column.type}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
        <ColumnProperties column={column} />
      </dl>
    </div>
  );
}

function ColumnProperties({
  column,
}: {
  column: KnackTableView["columns"][0];
}) {
  return (
    <>
      <dt className="text-muted-foreground">Width</dt>
      <dd className="text-glow-white">
        {column.width?.type === "custom"
          ? `${column.width?.amount}${column.width?.units}`
          : "Default"}
      </dd>

      <dt className="text-muted-foreground">Alignment</dt>
      <dd className="capitalize text-glow-white">{column.align}</dd>

      {column.grouping && (
        <>
          <dt className="text-muted-foreground">Grouping</dt>
          <dd className="text-glow-white">
            Enabled ({column.group_sort?.toUpperCase() || "Default"})
          </dd>
        </>
      )}

      {column.connection && (
        <>
          <dt className="text-muted-foreground">Connection</dt>
          <dd className="text-glow-white">{column.connection.key}</dd>
        </>
      )}

      {column.type === "link" && <LinkColumnProperties column={column} />}
    </>
  );
}

function LinkColumnProperties({
  column,
}: {
  column: Extract<KnackTableView["columns"][0], { type: "link" }>;
}) {
  return (
    <>
      <dt className="text-muted-foreground">Link Type</dt>
      <dd className="capitalize text-glow-white">{column.link_type}</dd>

      {column.link_text && (
        <>
          <dt className="text-muted-foreground">Link Text</dt>
          <dd className="text-glow-white">{column.link_text}</dd>
        </>
      )}

      {column.scene && (
        <>
          <dt className="text-muted-foreground">Target Scene</dt>
          <dd className="text-glow-white">{column.scene}</dd>
        </>
      )}

      {column.link_design_active && column.link_design && (
        <LinkDesignProperties design={column.link_design} />
      )}
    </>
  );
}

function LinkDesignProperties({
  design,
}: {
  design: NonNullable<
    Extract<KnackTableView["columns"][0], { type: "link" }>["link_design"]
  >;
}) {
  return (
    <>
      <dt className="text-muted-foreground">Link Style</dt>
      <dd>
        <div className="space-x-2">
          <Badge variant="outline" className="capitalize glass-border">
            {design.format}
          </Badge>
          <Badge variant="outline" className="capitalize glass-border">
            {design.size}
          </Badge>
          {design.rounded && (
            <Badge variant="outline" className="glass-border">
              Rounded
            </Badge>
          )}
          {design.raised && (
            <Badge variant="outline" className="glass-border">
              Raised
            </Badge>
          )}
          {design.colors?.button?.custom && (
            <div
              className="inline-block w-4 h-4 rounded border glass-border"
              style={{
                backgroundColor: design.colors.button.color,
              }}
            />
          )}
        </div>
      </dd>
    </>
  );
}

function RichTextViewRenderer({ view }: { view: KnackRichTextView }) {
  return (
    <div
      className="prose prose-sm max-w-none prose-invert"
      dangerouslySetInnerHTML={{ __html: view.content }}
    />
  );
}
