import React, { useState, useEffect, useRef } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
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
  Building2,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  children: React.ReactNode;
}

// Componente interno para controlar o sidebar
function SidebarLayout({ currentPage, setCurrentPage, children }: { currentPage: string; setCurrentPage: (page: string) => void; children: React.ReactNode }) {
  const { signOut, isAdmin, isMaster, user } = useSupabase();
  const { theme, toggleTheme } = useTheme();
  const { state, open, setOpen } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-expandir sidebar quando o mouse se aproxima (apenas se estiver collapsed)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const threshold = 80; // Distância em pixels para ativar (reduzida)
      const sidebarWidth = state === 'collapsed' ? 64 : 280; // Largura do sidebar
      
      // Se o mouse está próximo da borda esquerda e o sidebar está collapsed
      if (e.clientX < threshold && state === 'collapsed' && !open) {
        setOpen(true);
      }
      // Se o mouse está longe e o sidebar está expandido por hover
      else if (e.clientX > sidebarWidth + 30 && open && !isHovering && state === 'collapsed') {
        setOpen(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [state, open, setOpen, isHovering]);



  const mainNavItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      page: "dashboard",
    },
  ];

  const navigationGroups = [
    {
      id: 'operations',
      label: 'Operações',
      items: [
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
      ]
    },
    {
      id: 'financial',
      label: 'Financeiro',
      items: [
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
      ]
    },
    {
      id: 'management',
      label: 'Gestão',
      items: [
        {
          title: "Cadastros",
          icon: Users,
          page: "registrations",
        },
      ]
    },
    {
      id: 'system',
      label: 'Sistema',
      items: [
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
        {
          title: "🧪 Teste API",
          icon: Settings,
          page: "api-test",
        },
      ]
    }
  ];

  return (
    <>
      <Sidebar 
        ref={sidebarRef}
        collapsible="icon"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="transition-all duration-300 ease-in-out"
      >
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className={cn(
                "flex flex-col transition-all duration-300",
                state === 'collapsed' && !open && "opacity-0 w-0 overflow-hidden"
              )}>
                <span className="text-sm font-semibold">BoviControl</span>
                <span className="text-xs text-muted-foreground">Gestão Pecuária</span>
              </div>
            </div>
            

          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Main Navigation - Always visible */}
          <SidebarGroup>
            <SidebarGroupLabel>Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.page}>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage(item.page)}
                      isActive={currentPage === item.page}
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className={cn(
                        "transition-all duration-300",
                        state === 'collapsed' && !open && "opacity-0 w-0 overflow-hidden"
                      )}>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Navigation Groups - Sempre expandidos */}
          {navigationGroups.map((group) => (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel>
                <span className={cn(
                  "transition-all duration-300",
                  state === 'collapsed' && !open && "opacity-0 w-0 overflow-hidden"
                )}>{group.label}</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.page}>
                      <SidebarMenuButton
                        onClick={() => setCurrentPage(item.page)}
                        isActive={currentPage === item.page}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className={cn(
                          "transition-all duration-300",
                          state === 'collapsed' && !open && "opacity-0 w-0 overflow-hidden"
                        )}>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="w-full">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarFallback>
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "flex flex-col flex-1 text-left transition-all duration-300",
                      state === 'collapsed' && !open && "opacity-0 w-0 overflow-hidden"
                    )}>
                      <span className="text-sm font-medium truncate">
                        {user?.name || "Usuário"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user?.email || "email@exemplo.com"}
                      </span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-all duration-300",
                      state === 'collapsed' && !open && "opacity-0 w-0"
                    )} />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCurrentPage('profile')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage('settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === 'dark' ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Modo Claro</span>
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Modo Escuro</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="flex flex-col h-screen">
        <header className="flex items-center justify-between gap-2 border-b px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div className="text-sm font-medium text-muted-foreground">
              BoviControl - Sistema de Gestão Pecuária
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0"
              title={theme === 'dark' ? "Alternar para modo claro" : "Alternar para modo escuro"}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </SidebarInset>
    </>
  );
}



export function AppLayout({ currentPage, setCurrentPage, children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <SidebarLayout currentPage={currentPage} setCurrentPage={setCurrentPage} children={children} />
      </div>
    </SidebarProvider>
  );
}