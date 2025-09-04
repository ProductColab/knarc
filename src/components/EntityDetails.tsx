import { NodeRef } from "@/lib/deps/types";
import { resolveKnackEntity } from "@/lib/knack/entity-resolver";
import { KnackApplication } from "@/lib/knack/types/application";
import { UseQueryResult } from "@tanstack/react-query";
import { useGraphStore } from "@/lib/store/graphStore";
import { computeComplexity } from "@/lib/services/complexity";
import {
  getFeatureEdgeContributions,
  describeEdgeShort,
} from "@/lib/services/complexityContrib";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { JsonTreeViewer } from "@/components/ui/json-tree/json-tree";

export function EntityDetails({
  selected,
  appQuery,
}: {
  selected: NodeRef;
  appQuery: UseQueryResult<KnackApplication>;
}) {
  const { graph } = useGraphStore();
  const complexity = graph ? computeComplexity(graph, selected) : null;
  const contrib = graph ? getFeatureEdgeContributions(graph, selected) : [];

  return (
    <div className="w-[320px]">
      <div className="font-semibold mb-1.5">Node Details</div>
      <div className="text-xs mb-1">
        <div>
          <span className="font-bold">Type:</span> {selected.type}
        </div>
        <div>
          <span className="font-bold">Key:</span> {selected.key}
        </div>
        {selected.name ? (
          <div>
            <span className="font-bold">Name:</span> {selected.name}
          </div>
        ) : null}
      </div>
      {complexity ? (
        <Card className="mb-3">
          <CardHeader>
            <CardTitle className="text-sm">Complexity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm mb-2">
              <span className="text-muted-foreground">Score:</span>{" "}
              <span className="font-bold">
                {Math.round(complexity.score * 10) / 10}
              </span>{" "}
              <span className="text-muted-foreground text-xs">
                (exact {complexity.score.toFixed(2)})
              </span>
            </div>
            <Accordion type="single" collapsible>
              <AccordionItem value="breakdown">
                <AccordionTrigger>Score breakdown</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {complexity.breakdown
                      .filter((b) => b.weighted > 0)
                      .map((b) => (
                        <div
                          key={b.featureId}
                          className="border rounded-md p-2"
                        >
                          <div className="flex items-center justify-between text-sm font-medium">
                            <div>{b.label}</div>
                            <div>
                              +{b.weighted.toFixed(2)}
                              <span className="text-muted-foreground text-xs ml-1">
                                ({b.raw} × {b.weight})
                              </span>
                            </div>
                          </div>
                          {/* contributing edges */}
                          <div className="mt-2 space-y-1">
                            {contrib
                              .find((c) => c.featureId === b.featureId)
                              ?.edges.map((e, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-muted-foreground"
                                >
                                  {describeEdgeShort(e)}
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    {complexity.breakdown.filter((b) => b.weighted > 0)
                      .length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        No contributing features found.
                      </div>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      ) : null}
      <JsonTreeViewer
        title={`${selected.name}`}
        data={resolveKnackEntity(
          appQuery.data!,
          selected.type,
          String(selected.key)
        )}
        maxDepth={8}
        maxItems={50}
        theme="light"
        expandable
        copyable
        searchable
      />
    </div>
  );
}
