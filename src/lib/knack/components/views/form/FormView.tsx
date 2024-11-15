import type { KnackFormView } from "../../../types";
import { Badge } from "@/components/ui/badge";
import { FormGroups } from "./FormGroups";
import { RulesTable } from "./RulesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  FileText,
  Database,
  Send,
  Activity,
  ClipboardList,
} from "lucide-react";
import { RulesSequence } from "./RulesSequence";
import { useMemo } from "react";
import { generateFormStories } from "../../../utils/generateFormStories";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FormViewProps {
  view: KnackFormView;
}

function getFieldLabels(view: KnackFormView): Record<string, string> {
  const labels: Record<string, string> = {};
  view.groups.forEach((group) => {
    group.columns.forEach((column) => {
      column.inputs.forEach((input) => {
        if (input.field?.key) {
          labels[input.field.key] = input.label;
        }
      });
    });
  });
  return labels;
}

function StoryHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold text-glow-white text-glow-sm mt-4 mb-2",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function FormView({ view }: FormViewProps) {
  const fieldLabels = useMemo(() => getFieldLabels(view), [view]);
  const stories = useMemo(() => generateFormStories(view), [view]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-glow-white text-glow-sm">
        {view.title}
      </h1>
      <FormHeader view={view} />
      <FormGroups groups={view.groups} />

      {view.rules && (
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="glass-card grid w-full grid-cols-6">
            <TabsTrigger
              value="stories"
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                "data-[state=active]:text-glow-white data-[state=active]:text-glow-sm",
                "data-[state=active]:bg-glow-purple/10",
                "data-[state=active]:border-glow-active",
                "hover:text-glow-white hover:bg-glow-purple/5"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              Stories
            </TabsTrigger>
            <TabsTrigger
              value="sequence"
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                "data-[state=active]:text-glow-white data-[state=active]:text-glow-sm",
                "data-[state=active]:bg-glow-blue/10",
                "data-[state=active]:border-glow-active",
                "hover:text-glow-white hover:bg-glow-blue/5"
              )}
            >
              <Activity className="h-4 w-4" />
              Sequence
            </TabsTrigger>
            <TabsTrigger
              value="fields"
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                "data-[state=active]:text-glow-white data-[state=active]:text-glow-sm",
                "data-[state=active]:bg-glow-amber/10",
                "data-[state=active]:border-glow-active",
                "hover:text-glow-white hover:bg-glow-amber/5"
              )}
            >
              <FileText className="h-4 w-4" />
              Fields ({view.rules.fields?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="submits"
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                "data-[state=active]:text-glow-white data-[state=active]:text-glow-sm",
                "data-[state=active]:bg-success-glow/10",
                "data-[state=active]:border-glow-active",
                "hover:text-glow-white hover:bg-success-glow/5"
              )}
            >
              <Send className="h-4 w-4" />
              Submits ({view.rules.submits?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="records"
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                "data-[state=active]:text-glow-white data-[state=active]:text-glow-sm",
                "data-[state=active]:bg-glow-pink/10",
                "data-[state=active]:border-glow-active",
                "hover:text-glow-white hover:bg-glow-pink/5"
              )}
            >
              <Database className="h-4 w-4" />
              Records ({view.rules.records?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="emails"
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                "data-[state=active]:text-glow-white data-[state=active]:text-glow-sm",
                "data-[state=active]:bg-info-glow/10",
                "data-[state=active]:border-glow-active",
                "hover:text-glow-white hover:bg-info-glow/5"
              )}
            >
              <Mail className="h-4 w-4" />
              Emails ({view.rules.emails?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stories" className="mt-4 space-y-6">
            {stories.map((story, index) => (
              <Card key={index} className="glass-card border-glow p-6">
                <StoryHeading>{story.title}</StoryHeading>
                <div className="space-y-2 mb-4 text-muted-foreground">
                  <p>
                    <strong className="text-glow-white">As a</strong>{" "}
                    {story.asA}
                  </p>
                  <p>
                    <strong className="text-glow-white">I want</strong>{" "}
                    {story.iWant}
                  </p>
                  <p>
                    <strong className="text-glow-white">So that</strong>{" "}
                    {story.soThat}
                  </p>
                </div>
                <div className="space-y-2">
                  <StoryHeading>Acceptance Criteria:</StoryHeading>
                  <div className="space-y-4 prose prose-sm prose-invert max-w-none">
                    {story.acceptanceCriteria.map((criteria, criteriaIndex) => (
                      <ReactMarkdown
                        key={criteriaIndex}
                        className="space-y-2"
                        components={{
                          h3: ({ children }) => (
                            <StoryHeading>{children}</StoryHeading>
                          ),
                          h4: ({ children }) => (
                            <span className="font-semibold text-muted-foreground block mt-4 mb-2">
                              {children}
                            </span>
                          ),
                          ul: ({ children }) => (
                            <ul className="space-y-2">{children}</ul>
                          ),
                          li: ({ children }) => {
                            const content = children?.toString() || "";

                            if (content.startsWith("[ ]")) {
                              const checkboxContent = content
                                .substring(3)
                                .trim();
                              return (
                                <li className="flex items-start space-x-2 list-none">
                                  <Checkbox
                                    id={`criteria-${criteriaIndex}-${checkboxContent}`}
                                  />
                                  <label
                                    htmlFor={`criteria-${criteriaIndex}-${checkboxContent}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex flex-wrap items-center gap-1"
                                  >
                                    {renderBadgedContent(checkboxContent)}
                                  </label>
                                </li>
                              );
                            }

                            return (
                              <li className="flex items-start space-x-2">
                                <span className="text-muted-foreground">•</span>
                                <span className="flex-1 flex flex-wrap items-center gap-1">
                                  {renderBadgedContent(content)}
                                </span>
                              </li>
                            );
                          },
                          p: ({ children }) => {
                            const content = children?.toString() || "";
                            return (
                              <div className="my-2 flex flex-wrap items-center gap-1">
                                {renderBadgedContent(content)}
                              </div>
                            );
                          },
                        }}
                      >
                        {criteria}
                      </ReactMarkdown>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="sequence" className="mt-4">
            <RulesSequence
              rules={view.rules.fields}
              fieldLabels={fieldLabels}
            />
          </TabsContent>

          <TabsContent value="fields" className="mt-4">
            <RulesTable
              rules={view.rules.fields}
              columns={["Criteria", "Actions", "Key"]}
            />
          </TabsContent>

          <TabsContent value="submits" className="mt-4">
            <RulesTable
              rules={view.rules.submits}
              columns={["Action", "Message", "Key"]}
            />
          </TabsContent>

          <TabsContent value="records" className="mt-4">
            <RulesTable
              rules={view.rules.records}
              columns={["Connection", "Criteria", "Values", "Key"]}
            />
          </TabsContent>

          <TabsContent value="emails" className="mt-4">
            <RulesTable
              rules={view.rules.emails}
              columns={["Connection", "Recipients", "Subject", "Key"]}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function FormHeader({ view }: FormViewProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Badge variant="secondary" className="glass-border">
        {view.groups.reduce(
          (total, group) =>
            total +
            group.columns.reduce(
              (colTotal, col) => colTotal + col.inputs.length,
              0
            ),
          0
        )}{" "}
        Fields
      </Badge>
      <Badge variant="outline" className="capitalize glass-border">
        {view.action} Form
      </Badge>
      {view.submit_button_text && (
        <Badge variant="outline" className="glass-border">
          Submit: {view.submit_button_text}
        </Badge>
      )}
    </div>
  );
}

function renderBadgedContent(content: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  // Handle field tags
  content.replace(/\[field\](.*?)\[\/field\]/g, (match, field, index) => {
    elements.push(
      <span key={`text-${index}`}>{content.slice(lastIndex, index)}</span>
    );
    elements.push(
      <Badge
        key={`field-${index}`}
        variant="outline"
        className="font-mono mx-1"
      >
        {field}
      </Badge>
    );
    lastIndex = index + match.length;
    return match;
  });

  // Handle value tags
  content.replace(/\[value\](.*?)\[\/value\]/g, (match, value, index) => {
    elements.push(
      <span key={`text-value-${index}`}>{content.slice(lastIndex, index)}</span>
    );
    elements.push(
      <Badge
        key={`value-${index}`}
        variant="secondary"
        className="font-mono mx-1"
      >
        {value}
      </Badge>
    );
    lastIndex = index + match.length;
    return match;
  });

  // Add remaining text
  if (lastIndex < content.length) {
    elements.push(<span key="text-end">{content.slice(lastIndex)}</span>);
  }

  return elements;
}
