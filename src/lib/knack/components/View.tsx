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
  console.log(view);
  return (
    <ErrorBoundary>
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
    <Card>
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
    <Card>
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
    <Card className="bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">Error</CardTitle>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ViewHeader({ view, scene }: { view: KnackView; scene: KnackScene }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>{view.name}</CardTitle>
        <CardDescription>
          Scene: {scene.name} ({scene.key})
        </CardDescription>
      </div>
      <Badge variant="outline">{view.type}</Badge>
    </div>
  );
}

function ViewBody({ view }: { view: KnackView }) {
  const showSource =
    (view.type === "table" || view.type === "form") &&
    "source" in view &&
    view.source;

  return (
    <>
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
    </>
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
    <div className="rounded-md bg-muted p-4">
      <pre className="text-sm whitespace-pre-wrap">
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
      <Badge variant="secondary">
        {view.columns?.length || 0} Column
        {!view.columns?.length || view.columns.length === 1 ? "" : "s"}
      </Badge>
      {view.keyword_search && (
        <Badge variant="outline">Keyword Search Enabled</Badge>
      )}
      {view.allow_exporting && <Badge variant="outline">Export Enabled</Badge>}
      {view.rows_per_page && (
        <Badge variant="outline">{view.rows_per_page} Rows Per Page</Badge>
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
    <div className="rounded-md bg-muted p-4">
      <h4 className="text-sm font-medium mb-4">Columns</h4>
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
    <div className="border rounded-lg p-4 bg-background">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h5 className="font-medium">{column.header || "(No Header)"}</h5>
          {column.type === "field" && (
            <code className="text-sm text-muted-foreground">
              {column.field.key}
            </code>
          )}
        </div>
        <Badge>{column.type}</Badge>
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
      <dd>
        {column.width?.type === "custom"
          ? `${column.width?.amount}${column.width?.units}`
          : "Default"}
      </dd>

      <dt className="text-muted-foreground">Alignment</dt>
      <dd className="capitalize">{column.align}</dd>

      {column.grouping && (
        <>
          <dt className="text-muted-foreground">Grouping</dt>
          <dd>Enabled ({column.group_sort?.toUpperCase() || "Default"})</dd>
        </>
      )}

      {column.connection && (
        <>
          <dt className="text-muted-foreground">Connection</dt>
          <dd>{column.connection.key}</dd>
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
      <dd className="capitalize">{column.link_type}</dd>

      {column.link_text && (
        <>
          <dt className="text-muted-foreground">Link Text</dt>
          <dd>{column.link_text}</dd>
        </>
      )}

      {column.scene && (
        <>
          <dt className="text-muted-foreground">Target Scene</dt>
          <dd>{column.scene}</dd>
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
          <Badge variant="outline" className="capitalize">
            {design.format}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {design.size}
          </Badge>
          {design.rounded && <Badge variant="outline">Rounded</Badge>}
          {design.raised && <Badge variant="outline">Raised</Badge>}
          {design.colors?.button?.custom && (
            <div
              className="inline-block w-4 h-4 rounded border"
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
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: view.content }}
    />
  );
}
