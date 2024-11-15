import {
  Table2,
  FormInput,
  LayoutGrid,
  FileText,
  Search,
  Calendar,
  Map,
  Menu,
  LucideIcon,
  Component,
} from "lucide-react";

const VIEW_TYPE_ICONS: Record<string, LucideIcon> = {
  table: Table2,
  form: FormInput,
  grid: LayoutGrid,
  details: FileText,
  search: Search,
  calendar: Calendar,
  map: Map,
  menu: Menu,
};

interface ViewTypeIconProps {
  type: string;
  className?: string;
}

export function ViewTypeIcon({ type, className }: ViewTypeIconProps) {
  const normalizedType = type?.toLowerCase() || "";
  const Icon = VIEW_TYPE_ICONS[normalizedType] || Component;

  return <Icon className={className} size={20} />;
}
