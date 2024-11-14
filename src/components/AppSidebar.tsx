"use client";

import * as React from "react";
import {
  Code,
  Settings,
  LayoutDashboard,
  Layers,
  Database,
  BookOpen,
  ExternalLink,
  Check,
  PlusCircle,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfig } from "@/lib/hooks/use-config";

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  external?: boolean;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

function ConfigurationSelector() {
  const { configs, activeConfig, setActive } = useConfig();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="w-full justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">
              {activeConfig?.name ?? "Select configuration..."}
            </span>
          </span>
          <ChevronDown className="ml-auto h-4 w-4 opacity-50 group-data-[collapsible=icon]:hidden" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
        {configs.map((config) => (
          <DropdownMenuItem
            key={config.name}
            onSelect={() => {
              setActive(config.name);
              router.refresh();
            }}
          >
            <span>{config.name}</span>
            {activeConfig?.name === config.name && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onSelect={() => {
            router.push("/config");
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Add Configuration</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  const navigationItems: NavSection[] = [
    {
      section: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/",
        },
      ],
    },
    {
      section: "Explorer",
      items: [
        {
          title: "Scenes",
          icon: Layers,
          href: "/scenes",
        },
        {
          title: "Objects",
          icon: Database,
          href: "/objects",
        },
        {
          title: "API Explorer",
          icon: Code,
          href: "/api-explorer",
        },
      ],
    },
    {
      section: "Documentation",
      items: [
        {
          title: "Getting Started",
          icon: BookOpen,
          href: "/docs",
        },
        {
          title: "Knack API Docs",
          icon: ExternalLink,
          href: "https://docs.knack.com/docs/api-introduction",
          external: true,
        },
      ],
    },
    {
      section: "Settings",
      items: [
        {
          title: "Configuration",
          icon: Settings,
          href: "/config",
        },
      ],
    },
  ];

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarContent>
        {navigationItems.map((section) => (
          <SidebarGroup key={section.section}>
            <SidebarGroupLabel>{section.section}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    {item.external ? (
                      <SidebarMenuButton
                        asChild
                        tooltip={`Open ${item.title} in new tab`}
                      >
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <ConfigurationSelector />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
