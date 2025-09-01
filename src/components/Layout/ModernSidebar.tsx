import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import {
  IconLayoutDashboard,
  IconShoppingBag,
  IconTrendingUp,
  IconPackage,
  IconWallet,
  IconFileText,
  IconCalendar,
  IconCalculator,
  IconUsers,
  IconShield,
  IconSettings,
  IconLogout,
  IconBrandTabler,
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import { useSupabase } from "../../providers/SupabaseProvider";

interface ModernSidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export function ModernSidebar({ currentPage, setCurrentPage }: ModernSidebarProps) {
  const { signOut, isAdmin, isMaster } = useSupabase();
  const [open, setOpen] = useState(false);

  const links = [
    {
      label: "Dashboard",
      href: "dashboard",
      icon: (
        <IconLayoutDashboard className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Compras",
      href: "purchases",
      icon: (
        <IconShoppingBag className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Vendas",
      href: "sales",
      icon: (
        <IconTrendingUp className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Lotes",
      href: "lots",
      icon: (
        <IconPackage className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Financeiro",
      href: "financial",
      icon: (
        <IconWallet className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "DRE",
      href: "dre",
      icon: (
        <IconFileText className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Calendário",
      href: "calendar",
      icon: (
        <IconCalendar className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Conciliação",
      href: "financial-reconciliation",
      icon: (
        <IconCalculator className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Cadastros",
      href: "registrations",
      icon: (
        <IconUsers className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const bottomLinks = [
    ...(isAdmin || isMaster
      ? [
          {
            label: "Usuários",
            href: "users",
            icon: (
              <IconShield className="text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
          },
        ]
      : []),
    {
      label: "Configurações",
      href: "settings",
      icon: (
        <IconSettings className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const handleLinkClick = (href: string) => {
    if (href === "logout") {
      signOut();
    } else {
      setCurrentPage(href);
    }
  };

  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-neutral-900 dark:bg-neutral-900 w-full flex-1 mx-auto border border-neutral-800 overflow-hidden",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <Logo />
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => handleLinkClick(link.href)}
                  className={cn(
                    "flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md transition-all duration-150 cursor-pointer",
                    currentPage === link.href
                      ? "bg-neutral-800 text-white"
                      : "hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200"
                  )}
                >
                  {link.icon}
                  <motion.span
                    animate={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                    }}
                    className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                  >
                    {link.label}
                  </motion.span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex flex-col gap-2">
              {bottomLinks.map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => handleLinkClick(link.href)}
                  className={cn(
                    "flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md transition-all duration-150 cursor-pointer",
                    currentPage === link.href
                      ? "bg-neutral-800 text-white"
                      : "hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200"
                  )}
                >
                  {link.icon}
                  <motion.span
                    animate={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                    }}
                    className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                  >
                    {link.label}
                  </motion.span>
                </div>
              ))}
              <div
                onClick={() => handleLinkClick("logout")}
                className="flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md transition-all duration-150 cursor-pointer hover:bg-red-900/20 text-red-400 hover:text-red-300"
              >
                <IconLogout className="h-5 w-5 flex-shrink-0" />
                <motion.span
                  animate={{
                    display: open ? "inline-block" : "none",
                    opacity: open ? 1 : 0,
                  }}
                  className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                >
                  Sair
                </motion.span>
              </div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

const Logo = () => {
  return (
    <div className="flex items-center justify-start gap-2 py-2 px-2">
      <div className="h-5 w-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-sm flex-shrink-0" />
      <motion.span
        animate={{
          display: "inline-block",
          opacity: 1,
        }}
        className="font-bold text-neutral-200 text-sm whitespace-pre"
      >
        CEAC
      </motion.span>
    </div>
  );
};

// Export useSidebar hook
export { useSidebar } from "../ui/sidebar";