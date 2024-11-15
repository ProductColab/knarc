/* eslint-disable @next/next/no-img-element */
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
import { cn } from "@/lib/utils";
import { useCallback } from "react";

function ConfigurationSelector() {
  const { configs, activeConfig, setActiveConfig, isSettingActive } =
    useConfig();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  // Memoize the configs to prevent unnecessary re-renders
  const memoizedConfigs = React.useMemo(() => configs, [configs]);

  const handleConfigSelect = useCallback(
    async (configId: string) => {
      try {
        setIsOpen(false); // Close dropdown before state change
        await setActiveConfig(configId);
        router.refresh();
      } catch (error) {
        console.error("Failed to set active config:", error);
      }
    },
    [setActiveConfig, router]
  );

  // Early return with a non-interactive button if configs is empty
  if (memoizedConfigs.length === 0) {
    return (
      <SidebarMenuButton
        className={cn(
          "w-full justify-between",
          "glass-card border border-white/10",
          "transition-all duration-300"
        )}
        disabled={true}
      >
        <span className="flex items-center gap-2">
          <Database className="h-4 w-4 text-glow-blue" />
          <span className="group-data-[collapsible=icon]:hidden">
            No configurations
          </span>
        </span>
      </SidebarMenuButton>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={isSettingActive}>
        <SidebarMenuButton
          className={cn(
            "w-full justify-between",
            "glass-card border border-white/10",
            "hover:border-glow-purple/30 hover:shadow-none",
            "transition-all duration-300",
            isOpen && "border-glow-purple/30" // Highlight when open
          )}
        >
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4 text-glow-blue" />
            <span className="group-data-[collapsible=icon]:hidden">
              {activeConfig?.name ?? "Select configuration..."}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 opacity-50 group-data-[collapsible=icon]:hidden",
              "transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(
          "w-[--radix-popper-anchor-width]",
          "glass-card border border-white/10",
          "shadow-glow"
        )}
        onCloseAutoFocus={(e) => e.preventDefault()} // Prevent focus issues
      >
        {memoizedConfigs.map((config) => (
          <DropdownMenuItem
            key={config.id}
            onSelect={() => handleConfigSelect(config.id)}
            className={cn(
              "hover:bg-white/5",
              "hover:text-glow-purple hover:text-glow-sm",
              "transition-all duration-300"
            )}
          >
            <span>{config.name}</span>
            {activeConfig?.id === config.id && (
              <Check className="ml-auto h-4 w-4 text-glow-blue" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onSelect={() => {
            setIsOpen(false); // Close dropdown before navigation
            router.push("/config/new");
          }}
          className={cn(
            "hover:bg-white/5",
            "hover:text-glow-amber hover:text-glow-sm",
            "transition-all duration-300"
          )}
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
          title: "API",
          icon: Code,
          href: getNavHref("/api"),
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
        <SidebarHeader className="border-b border-white/10 p-4 glass-card">
          <div className="flex flex-col gap-4">
            {appLogo ? (
              <div className="flex justify-center items-center h-12 overflow-hidden">
                <img
                  src={appLogo}
                  alt="Application Logo"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            ) : (
              <div className="h-12 flex items-center justify-center text-lg font-semibold text-glow-purple text-glow-lg">
                Knack Explorer
              </div>
            )}
            <ConfigurationSelector />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {navigationItems.map((section) => (
            <SidebarGroup key={section.section}>
              <SidebarGroupLabel className="text-glow-blue/70">
                {section.section}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      {item.external ? (
                        <SidebarMenuButton
                          asChild
                          tooltip={`Open ${item.title} in new tab`}
                          className={cn(
                            "glass-border",
                            "hover:bg-white/5",
                            "hover:text-glow-amber hover:text-glow-sm",
                            "hover:border-glow-amber/30",
                            "transition-all duration-300"
                          )}
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
                          className={cn(
                            "transition-all duration-300 relative",
                            isActiveLink(item.href) && [
                              "glass-card",
                              "border-glow-active",
                              "text-glow-purple text-glow-sm",
                              "before:absolute before:inset-0",
                              "before:bg-glow-gradient before:opacity-5",
                              "after:absolute after:inset-[-1px]",
                              "after:rounded-[inherit] after:p-[1px]",
                              "after:bg-gradient-to-r",
                              "after:from-glow-purple/20 after:via-transparent after:to-glow-blue/20",
                              "after:-z-10",
                            ],
                            !isActiveLink(item.href) && [
                              "hover:bg-white/5",
                              "hover:text-glow-purple hover:text-glow-sm",
                              "hover:border-glow-purple/20",
                            ]
                          )}
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
