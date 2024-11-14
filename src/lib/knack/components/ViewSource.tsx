import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { KnackViewSource } from "../types";
import { ArrowUpDown, Link as LinkIcon, Shield, Database } from "lucide-react";

interface ViewSourceProps {
  source: KnackViewSource;
}

export function ViewSource({ source }: ViewSourceProps) {
  if (!source?.object) return null;

  const isTableSource = "limit" in source;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-muted-foreground" />
            <div>
              <CardTitle>Data Source</CardTitle>
              <CardDescription>Object: {source.object}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {source.authenticated_user && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                User Authenticated
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTableSource && source.parent_source && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LinkIcon className="w-4 h-4" />
            <span>
              Connected to {source.parent_source.object} via{" "}
              {source.parent_source.connection}
            </span>
          </div>
        )}

        {source.sort && source.sort.length > 0 && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <ArrowUpDown className="w-4 h-4" />
              <span>Sort Order</span>
            </div>
            <div className="space-y-1">
              {source.sort.map((sort, index) => (
                <div key={index} className="text-sm flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {sort.order}
                  </Badge>
                  <span>{sort.field}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Match Type:</span>
            <Badge variant="outline" className="capitalize">
              {source.criteria?.match}
            </Badge>
          </div>
          {isTableSource && source.limit && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Record Limit:</span>
              <span>{source.limit}</span>
            </div>
          )}
          {source.connection_key && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connection Field:</span>
              <span>{source.connection_key}</span>
            </div>
          )}
          {source.relationship_type && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Relationship Type:</span>
              <Badge variant="outline" className="capitalize">
                {source.relationship_type}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
