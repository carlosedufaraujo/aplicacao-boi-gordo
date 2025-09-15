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
  BarChart3,
  FileUp,
} from "lucide-react";
import { useBackend } from "@/providers/BackendProvider";
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
import TradingViewWidget from "@/components/TradingView/TradingViewWidget";

interface AppLayoutProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  children: React.ReactNode;
}

// Componente interno para controlar o sidebar
function SidebarLayout({ currentPage, setCurrentPage, children }: { currentPage: string; setCurrentPage: (page: string) => void; children: React.ReactNode }) {
  const { signOut, isAdmin, isMaster, user } = useBackend();
  const { theme, toggleTheme } = useTheme();
  const { state, open, setOpen } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [autoRetractEnabled, setAutoRetractEnabled] = useState(true); // Toggle para auto-retração
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-controlar sidebar baseado na posição do mouse
  useEffect(() => {
    // Só executar se auto-retração estiver habilitada
    if (!autoRetractEnabled) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const threshold = 100; // Distância em pixels para ativar
      const sidebarWidth = 280; // Largura expandida do sidebar
      const collapsedWidth = 64; // Largura retraída do sidebar
      
      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Se o mouse está próximo da borda esquerda, expandir
      if (e.clientX < threshold) {
        if (!open) {
          setOpen(true);
        }
      }
      // Se o mouse está longe do sidebar e não está sobre ele, retrair após delay
      else if (e.clientX > (open ? sidebarWidth : collapsedWidth) + 50) {
        if (open) {
          // Adicionar delay antes de retrair
          timeoutRef.current = setTimeout(() => {
            if (!isHovering) {
              setOpen(false);
            }
          }, 300); // 300ms de delay
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open, setOpen, isHovering, autoRetractEnabled]);

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
          page: "purchases",
        },
        {
          title: "Vendas",
          icon: TrendingUp,
          page: "sales",
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
          title: "Calendário",
          icon: Calendar,
          page: "calendar",
        },
      ]
    },
    {
      id: 'management',
      label: 'Gestão',
      items: [
        {
          title: "Relatórios",
          icon: BarChart3,
          page: "reports",
        },
      ]
    },
    {
      id: 'system',
      label: 'Sistema',
      items: [
        {
          title: "Configurações",
          icon: Settings,
          page: "settings",
        },
      ]
    }
  ];

  return (
    <>
      <Sidebar 
        ref={sidebarRef}
        collapsible="icon"
        onMouseEnter={() => {
          setIsHovering(true);
          // Limpar timeout de retração quando mouse entra
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          // Retrair após deixar o sidebar (com delay) apenas se auto-retração estiver habilitada
          if (open && autoRetractEnabled) {
            timeoutRef.current = setTimeout(() => {
              setOpen(false);
            }, 500); // 500ms de delay ao sair
          }
        }}
        className="transition-all duration-300 ease-in-out"
      >
        <SidebarHeader className="flex-shrink-0">
          <div className="flex items-center h-12 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className={cn(
              "flex flex-col ml-2 min-w-0 transition-all duration-300",
              state === 'collapsed' && !open ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
            )}>
              <span className="text-sm font-semibold whitespace-nowrap">BoviControl</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">Gestão Pecuária</span>
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
            
            {/* Botão de Auto-retração - Apenas Toggle */}
            <SidebarMenuItem>
              <div className="flex justify-center px-2 py-2">
                <div className={cn(
                  "relative w-8 h-4 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0",
                  autoRetractEnabled ? "bg-green-500" : "bg-gray-300"
                )}
                onClick={() => {
                  setAutoRetractEnabled(!autoRetractEnabled);
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                  }
                }}
                title={autoRetractEnabled ? "Auto-retração ativada (clique para desativar)" : "Auto-retração desativada (clique para ativar)"}
                >
                  {/* Toggle Switch */}
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300",
                    autoRetractEnabled ? "left-4" : "left-0.5"
                  )} />
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="flex flex-col h-screen">
        <header className="flex items-center border-b px-2 py-2 flex-shrink-0 bg-background">
          {/* TradingView Widget integrado no cabeçalho - ocupa toda a largura */}
          <div className="w-full">
            <TradingViewWidget />
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
