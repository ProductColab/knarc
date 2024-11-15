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
  Layout,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
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
import { useConfig } from "@/hooks/useConfig";
import { useKnack } from "@/lib/knack/context";

function ConfigurationSelector() {
  const { configs, activeConfig, setActiveConfig, isSettingActive } =
    useConfig();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isSettingActive}>
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
            key={config.id}
            onSelect={() => {
              setActiveConfig(config.id);
              router.refresh();
            }}
          >
            <span>{config.name}</span>
            {activeConfig?.id === config.id && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onSelect={() => {
            router.push("/config/new");
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Add Configuration</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

export function AppSidebar() {
  const pathname = usePathname();
  const { activeConfig } = useConfig();
  const { client } = useKnack();
  const [appLogo, setAppLogo] = React.useState<string | null>(null);

  // Fetch application logo when client changes
  React.useEffect(() => {
    async function fetchAppLogo() {
      if (client) {
        try {
          const schema = await client.getApplication();
          if (schema.logo_url) {
            setAppLogo(schema.logo_url);
          }
        } catch (error) {
          console.error("Failed to fetch app logo:", error);
        }
      }
    }

    fetchAppLogo();
  }, [client]);

  const getNavHref = (path: string) => {
    if (!activeConfig) return path;
    return `/${activeConfig.id}${path}`;
  };

  const isActiveLink = (href: string) => {
    // For external links, always return false
    if (href.startsWith("http")) return false;

    // For internal links, check if the current pathname starts with the href
    // But make sure we don't match partial segments (e.g. /scenes shouldn't match /scene)
    return (
      pathname.startsWith(href) &&
      (pathname === href || pathname.charAt(href.length) === "/")
    );
  };

  const navigationItems: NavSection[] = [
    {
      section: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: getNavHref("/"),
        },
      ],
    },
    {
      section: "Explorer",
      items: [
        {
          title: "Scenes",
          icon: Layers,
          href: getNavHref("/scenes"),
        },
        {
          title: "Objects",
          icon: Database,
          href: getNavHref("/objects"),
        },
        {
          title: "Fields",
          icon: Code,
          href: getNavHref("/fields"),
        },
        {
          title: "Views",
          icon: Layout,
          href: getNavHref("/views"),
        },
        {
          title: "API Explorer",
          icon: Code,
          href: getNavHref("/api-explorer"),
        },
      ],
    },
    {
      section: "Documentation",
      items: [
        {
          title: "Getting Started",
          icon: BookOpen,
          href: getNavHref("/docs"),
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
          href: getNavHref("/config"),
        },
      ],
    },
  ];

  return (
    <>
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader className="border-b border-border p-4">
          <div className="flex flex-col gap-4">
            {appLogo ? (
              <div className="flex justify-center items-center h-12 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={appLogo}
                  alt="Application Logo"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            ) : (
              <div className="h-12 flex items-center justify-center text-lg font-semibold">
                Knack Explorer
              </div>
            )}
            <ConfigurationSelector />
          </div>
        </SidebarHeader>
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
                          className="
                            hover:bg-transparent hover:border hover:border-[hsl(280_100%_70%)] 
                            hover:shadow-[inset_0_0_10px_rgba(147,51,234,0.2)] 
                            transition-all duration-300"
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
                          isActive={isActiveLink(item.href)}
                          className={`
                            ${
                              isActiveLink(item.href)
                                ? "bg-[hsl(260_30%_15%)] relative before:absolute before:inset-[-1px] before:rounded-[inherit] before:p-[1px] before:bg-gradient-to-r before:from-[hsl(32_100%_50%)] before:via-[hsl(260_30%_15%)] before:to-[hsl(32_100%_50%)] before:-z-10 before:opacity-80 sidebar-item-active"
                                : ""
                            }
                            hover:bg-[hsl(260_30%_12%)]
                            transition-all duration-300 relative
                          `}
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
      </Sidebar>
    </>
  );
}
