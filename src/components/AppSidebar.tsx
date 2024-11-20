"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ConfigSwitcher } from "@/features/config/components/ConfigSwitcher";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Database, Layout, Box, Table, Settings } from "lucide-react";

interface AppLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const AppLinks: AppLink[] = [
  {
    label: "Objects",
    href: "/objects",
    icon: <Database className="w-4 h-4" />,
  },
  {
    label: "Scenes",
    href: "/scenes",
    icon: <Layout className="w-4 h-4" />,
  },
  {
    label: "Fields",
    href: "/fields",
    icon: <Box className="w-4 h-4" />,
  },
  {
    label: "Views",
    href: "/views",
    icon: <Table className="w-4 h-4" />,
  },
  {
    label: "Config",
    href: "/config",
    icon: <Settings className="w-4 h-4" />,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const configId = pathname.slice(1);
  const parsedConfigId = isNaN(parseInt(configId))
    ? undefined
    : parseInt(configId);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>knarc</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {AppLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <Link
                    href={
                      parsedConfigId
                        ? `/${parsedConfigId}${link.href}`
                        : link.href
                    }
                  >
                    <SidebarMenuButton>
                      <span className="flex items-center gap-2">
                        {link.icon}
                        {link.label}
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ConfigSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
