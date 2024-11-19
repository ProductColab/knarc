import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Database, Table2, Layout, Eye, Settings } from "lucide-react";
import Link from "next/link";

export const runtime = "edge";

const features = [
  {
    title: "Objects",
    description: "Manage your application's data structure and relationships",
    icon: <Database className="w-6 h-6" />,
    href: "/objects",
  },
  {
    title: "Fields",
    description: "Configure and customize your object fields",
    icon: <Table2 className="w-6 h-6" />,
    href: "/fields",
  },
  {
    title: "Scenes",
    description: "Design and organize your application's pages",
    icon: <Layout className="w-6 h-6" />,
    href: "/scenes",
  },
  {
    title: "Views",
    description: "Create and modify how your data is displayed",
    icon: <Eye className="w-6 h-6" />,
    href: "/views",
  },
  {
    title: "Settings",
    description: "Configure your application settings and preferences",
    icon: <Settings className="w-6 h-6" />,
    href: "/settings",
  },
];

export default function ApplicationPage({
  params,
}: {
  params: { applicationId: string };
}) {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={`/${params.applicationId}${feature.href}`}
          >
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
