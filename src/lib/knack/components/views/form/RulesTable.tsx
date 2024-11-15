import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type {
  KnackFormRule,
  KnackFormRecordRule,
  KnackFormEmailRule,
  KnackFormSubmitRule,
  KnackFormRuleCriteria,
  KnackFormRuleAction,
} from "../../../types/form";

type RuleType =
  | KnackFormRule
  | KnackFormRecordRule
  | KnackFormEmailRule
  | KnackFormSubmitRule;

interface RulesTableProps {
  rules: RuleType[];
  columns?: string[];
  fieldLabels?: Record<string, string>;
}

export function RulesTable({
  rules,
  columns = ["key", "criteria", "actions"],
  fieldLabels = {},
}: RulesTableProps) {
  if (!rules?.length) {
    return <div className="text-muted-foreground">No rules defined</div>;
  }

  const sortedRules = [...rules].sort((a, b) => {
    const keyA = parseInt(a.key) || 0;
    const keyB = parseInt(b.key) || 0;
    return keyA - keyB;
  });

  return (
    <div className="glass-border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/5 border-b border-white/10">
            {columns.map((column) => (
              <TableHead key={column} className="text-glow-white">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRules.map((rule, index) => (
            <TableRow
              key={rule.key || index}
              className="hover:bg-muted/5 border-b border-white/10"
            >
              {columns.map((column) => (
                <TableCell key={column}>
                  {formatCellContent(rule, column.toLowerCase(), fieldLabels)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatCellContent(
  rule: RuleType,
  column: string,
  fieldLabels: Record<string, string>
) {
  switch (column) {
    case "criteria":
      if ("criteria" in rule) {
        const criteria = rule.criteria as KnackFormRuleCriteria[];
        return criteria?.map((c, i) => (
          <Badge key={i} variant="outline" className="mr-1">
            {fieldLabels[c.field] || c.field} {c.operator}{" "}
            {c.value || "(blank)"}
          </Badge>
        ));
      }
      return null;
    case "actions":
      if ("actions" in rule) {
        const actions = rule.actions as KnackFormRuleAction[];
        return actions?.map((a, i) => (
          <Badge key={i} variant="secondary" className="mr-1">
            {a.action}: {fieldLabels[a.field] || a.field}
          </Badge>
        ));
      }
      return null;
    case "values":
      if ("values" in rule) {
        return rule.values?.length || 0;
      }
      return null;
    case "recipients":
      if ("email" in rule) {
        return rule.email?.recipients?.length || 0;
      }
      return null;
    case "subject":
      if ("email" in rule) {
        return rule.email?.subject;
      }
      return null;
    case "message":
      if ("message" in rule) {
        return <div className="max-w-md truncate">{rule.message}</div>;
      }
      return null;
    case "key":
      return rule.key || "-";
    default:
      return "-";
  }
}
