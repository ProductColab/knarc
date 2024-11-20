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

interface AppLink {
  label: string;
  href: string;
}

const AppLinks: AppLink[] = [
  {
    label: "Objects",
    href: "/objects",
  },
  {
    label: "Scenes",
    href: "/scenes",
  },
  {
    label: "Fields",
    href: "/fields",
  },
  {
    label: "Views",
    href: "/views",
  },
  {
    label: "Config",
    href: "/config",
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
                    <SidebarMenuButton>{link.label}</SidebarMenuButton>
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
