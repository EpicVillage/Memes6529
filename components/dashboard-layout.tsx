"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Home,
  MessageSquare,
  Globe,
  Settings,
  Users,
  Activity,
  Terminal,
  FileText,
  ChevronDown,
  ChevronRight,
  Server,
  Wrench,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModuleStatusFooter } from "@/components/module-status-footer";

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    divider: true,
  },
  {
    sectionTitle: "DOMAINS",
  },
  {
    title: "Telegram",
    icon: MessageSquare,
    href: "/lists",
    noAutoExpand: true,  // Prevent auto-expand when clicked
    submenu: [
      {
        title: "Scanner",
        href: "/telegram",
      },
      {
        title: "Database",
        href: "/telegram/database",
      },
      {
        title: "Accounts",
        href: "/accounts",
      },
    ],
  },
  {
    title: "ENS",
    icon: Globe,
    href: "/ens/username-list",
    noAutoExpand: true,  // Prevent auto-expand when clicked
    submenu: [
      {
        title: "Domain List",
        href: "/ens/username-list",
      },
      {
        title: "Wallet Scanner",
        href: "/ens",
      },
    ],
  },
  {
    title: "SuiNS",
    icon: Globe,
    href: "/suins/username-list",
    noAutoExpand: true,  // Prevent auto-expand when clicked
    submenu: [
      {
        title: "Domain Search",
        href: "/suins",
      },
    ],
  },
  {
    title: "SNS",
    icon: Globe,
    href: "/sns/username-list",
    noAutoExpand: true,  // Prevent auto-expand when clicked
    submenu: [
      {
        title: "Domain Search",
        href: "/sns",
      },
    ],
  },
  {
    title: "Template",
    icon: Globe,
    href: "/template/username-list",
    noAutoExpand: true,  // Prevent auto-expand when clicked
    submenu: [
      {
        title: "Domain Search",
        href: "/template",
      },
    ],
  },
  {
    title: "Dictionary Builder",
    icon: BookOpen,
    href: "/dictionary-builder",
  },
  {
    divider: true,
  },
  {
    title: "Node Runner",
    icon: Server,
    href: "/node-runner",
    submenu: [
      {
        title: "Auto-Healing",
        href: "/node-runner/auto-healing",
      },
      {
        title: "Alerts",
        href: "/node-runner/alerts",
      },
      {
        title: "CLI Tools",
        href: "/node-runner/cli",
      },
      {
        title: "Management",
        href: "/node-runner/management",
      },
    ],
  },
  {
    title: "6529",
    icon: Activity,
    href: "/6529",
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Determine which items should be expanded based on current path
  const getExpandedItems = () => {
    // Don't auto-expand Telegram menu
    // if (pathname === '/telegram' || pathname === '/accounts' || pathname === '/lists') {
    //   return ['Telegram'];
    // }
    // Check if we're on node runner or any of its submenu pages
    if (pathname.startsWith('/node-runner')) {
      return ['Node Runner'];
    }
    // Don't auto-expand SuiNS menu
    // if (pathname.startsWith('/suins')) {
    //   return ['SuiNS'];
    // }
    return [];
  };

  const [expandedItems, setExpandedItems] = useState<string[]>(getExpandedItems());

  // Update expanded items when pathname changes
  React.useEffect(() => {
    setExpandedItems(getExpandedItems());
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  // Check if any submenu item is active
  const isSubmenuActive = (item: any) => {
    if (!item.submenu) return false;
    return item.submenu.some((subItem: any) => isActive(subItem.href)) || isActive(item.href);
  };

  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-col h-screen w-full bg-gray-950">
          <div className="flex flex-1 overflow-hidden">
            <Sidebar className="border-r border-gray-800 flex flex-col h-full">
              <SidebarHeader className="border-b border-gray-800 px-6 py-4 flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                  <Terminal className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">Modulus</span>
              </Link>
            </SidebarHeader>
            
            <SidebarContent className="px-3 py-4">
              <SidebarMenu>
                {menuItems.map((item, index) => (
                  <div key={item.title || item.sectionTitle || `divider-${index}`}>
                    {item.sectionTitle ? (
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {item.sectionTitle}
                      </div>
                    ) : item.divider ? (
                      <div className="my-2 border-t border-gray-800"></div>
                    ) : item.submenu ? (
                      <Collapsible
                        open={expandedItems.includes(item.title)}
                        onOpenChange={() => toggleExpanded(item.title)}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <div className="flex items-center">
                            <Link href={item.href} className="flex-1">
                              <SidebarMenuButton
                                className={cn(
                                  "w-full justify-start text-gray-400 hover:bg-gray-800 hover:text-white",
                                  isSubmenuActive(item) && "bg-gray-800 text-white"
                                )}
                                onClick={(e) => {
                                  // Prevent expansion for items with noAutoExpand flag
                                  if (item.noAutoExpand) {
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                <item.icon className="mr-3 h-4 w-4" />
                                {item.title}
                              </SidebarMenuButton>
                            </Link>
                            <CollapsibleTrigger asChild>
                              <button
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleExpanded(item.title);
                                }}
                              >
                                {expandedItems.includes(item.title) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            </CollapsibleTrigger>
                          </div>
                        </SidebarMenuItem>
                        
                        <CollapsibleContent className="ml-7 mt-1 space-y-1">
                          {item.submenu.map((subItem) => (
                            <SidebarMenuItem key={subItem.href}>
                              <SidebarMenuButton
                                asChild
                                className={cn(
                                  "text-gray-400 hover:bg-gray-800 hover:text-white",
                                  isActive(subItem.href) && "bg-gray-800 text-white"
                                )}
                              >
                                <Link href={subItem.href}>
                                  <span className="text-sm">{subItem.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            "text-gray-400 hover:bg-gray-800 hover:text-white",
                            isActive(item.href) && "bg-gray-800 text-white"
                          )}
                        >
                          <Link href={item.href}>
                            <item.icon className="mr-3 h-4 w-4" />
                            {item.title}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </div>
                ))}
              </SidebarMenu>
            </SidebarContent>
            </Sidebar>
            
            <main className="flex-1 overflow-auto">
              <div className="flex h-14 items-center border-b border-gray-800 px-6">
                <SidebarTrigger className="text-gray-400 hover:text-white" />
              </div>
              <div className="p-6">{children}</div>
            </main>
          </div>
          <ModuleStatusFooter />
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}