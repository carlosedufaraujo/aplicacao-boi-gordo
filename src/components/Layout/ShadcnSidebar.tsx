import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ShoppingBag,
  TrendingUp,
  Package,
  Wallet,
  FileText,
  Calendar,
  Calculator,
  Users,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShadcnSidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export function ShadcnSidebar({ currentPage, setCurrentPage }: ShadcnSidebarProps) {
  const { signOut, isAdmin, isMaster, user } = useSupabase();
  
  // Wrap the entire component in a wrapper div since SidebarProvider needs to wrap everything
  const mainNavItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      page: "dashboard",
    },
  ];

  const operationsItems = [
    {
      title: "Compras",
      icon: ShoppingBag,
      page: "pipeline",
    },
    {
      title: "Vendas",
      icon: TrendingUp,
      page: "sales-pipeline",
    },
    {
      title: "Lotes",
      icon: Package,
      page: "lots",
    },
  ];

  const financialItems = [
    {
      title: "Centro Financeiro",
      icon: Wallet,
      page: "financial",
    },
    {
      title: "DRE",
      icon: FileText,
      page: "dre",
    },
    {
      title: "Calendário",
      icon: Calendar,
      page: "calendar",
    },
    {
      title: "Conciliação",
      icon: Calculator,
      page: "financial-reconciliation",
    },
  ];

  const managementItems = [
    {
      title: "Cadastros",
      icon: Users,
      page: "registrations",
    },
  ];

  const systemItems = [
    ...(isAdmin || isMaster
      ? [
          {
            title: "Usuários",
            icon: Shield,
            page: "users",
          },
        ]
      : []),
    {
      title: "Configurações",
      icon: Settings,
      page: "settings",
    },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">BoviControl</span>
              <span className="text-xs text-muted-foreground">Gestão Pecuária</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.page}>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage(item.page)}
                      isActive={currentPage === item.page}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Operations */}
          <SidebarGroup>
            <SidebarGroupLabel>Operações</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {operationsItems.map((item) => (
                  <SidebarMenuItem key={item.page}>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage(item.page)}
                      isActive={currentPage === item.page}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Financial */}
          <SidebarGroup>
            <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {financialItems.map((item) => (
                  <SidebarMenuItem key={item.page}>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage(item.page)}
                      isActive={currentPage === item.page}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Management */}
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.page}>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage(item.page)}
                      isActive={currentPage === item.page}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* System */}
          <SidebarGroup>
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems.map((item) => (
                  <SidebarMenuItem key={item.page}>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage(item.page)}
                      isActive={currentPage === item.page}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 text-left">
                      <span className="text-sm font-medium">
                        {user?.name || "Usuário"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user?.email || "email@exemplo.com"}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}