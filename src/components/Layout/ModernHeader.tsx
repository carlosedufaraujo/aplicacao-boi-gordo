import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconBell,
  IconSearch,
  IconUser,
  IconMoon,
  IconSun,
  IconLogout,
  IconSettings,
  IconHelp,
} from "@tabler/icons-react";
import { cn } from "../../lib/utils";
import { useSupabase } from "../../providers/SupabaseProvider";
import { useClickOutside } from "../../hooks/useClickOutside";

interface ModernHeaderProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export function ModernHeader({ darkMode, setDarkMode }: ModernHeaderProps) {
  const { user, signOut, isAdmin, isMaster } = useSupabase();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(profileRef, () => setShowProfileMenu(false));
  useClickOutside(notificationRef, () => setShowNotifications(false));

  const notifications = [
    {
      id: 1,
      title: "Nova venda registrada",
      message: "Lote #1234 vendido com sucesso",
      time: "5 min atrás",
      unread: true,
    },
    {
      id: 2,
      title: "Atualização do sistema",
      message: "Sistema atualizado para versão 2.0",
      time: "1 hora atrás",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-lg",
                  "bg-neutral-100 dark:bg-neutral-800",
                  "border border-neutral-200 dark:border-neutral-700",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400",
                  "text-neutral-900 dark:text-neutral-100",
                  "placeholder-neutral-500 dark:placeholder-neutral-400",
                  "transition-all duration-200"
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-6">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                "p-2 rounded-lg",
                "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                "text-neutral-600 dark:text-neutral-400",
                "transition-colors duration-200"
              )}
            >
              {darkMode ? (
                <IconSun className="w-5 h-5" />
              ) : (
                <IconMoon className="w-5 h-5" />
              )}
            </motion.button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative p-2 rounded-lg",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  "text-neutral-600 dark:text-neutral-400",
                  "transition-colors duration-200"
                )}
              >
                <IconBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      "absolute right-0 mt-2 w-80",
                      "bg-white dark:bg-neutral-900",
                      "rounded-lg shadow-xl",
                      "border border-neutral-200 dark:border-neutral-800",
                      "overflow-hidden"
                    )}
                  >
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Notificações
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                            "border-b border-neutral-100 dark:border-neutral-800/50",
                            "transition-colors cursor-pointer",
                            notif.unread && "bg-emerald-50/50 dark:bg-emerald-900/10"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {notif.title}
                              </p>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                {notif.message}
                              </p>
                            </div>
                            {notif.unread && (
                              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                            {notif.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  "transition-colors duration-200"
                )}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center">
                  <IconUser className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {user?.name || "Usuário"}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isAdmin ? "Administrador" : "Usuário"}
                  </p>
                </div>
              </motion.button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      "absolute right-0 mt-2 w-56",
                      "bg-white dark:bg-neutral-900",
                      "rounded-lg shadow-xl",
                      "border border-neutral-200 dark:border-neutral-800",
                      "overflow-hidden"
                    )}
                  >
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {user?.name || "Usuário"}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {user?.email || "email@exemplo.com"}
                      </p>
                    </div>
                    <div className="p-2">
                      <button
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md",
                          "text-sm text-neutral-700 dark:text-neutral-300",
                          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                          "transition-colors duration-200"
                        )}
                      >
                        <IconUser className="w-4 h-4" />
                        <span>Perfil</span>
                      </button>
                      <button
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md",
                          "text-sm text-neutral-700 dark:text-neutral-300",
                          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                          "transition-colors duration-200"
                        )}
                      >
                        <IconSettings className="w-4 h-4" />
                        <span>Configurações</span>
                      </button>
                      <button
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md",
                          "text-sm text-neutral-700 dark:text-neutral-300",
                          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                          "transition-colors duration-200"
                        )}
                      >
                        <IconHelp className="w-4 h-4" />
                        <span>Ajuda</span>
                      </button>
                    </div>
                    <div className="p-2 border-t border-neutral-200 dark:border-neutral-800">
                      <button
                        onClick={signOut}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md",
                          "text-sm text-red-600 dark:text-red-400",
                          "hover:bg-red-50 dark:hover:bg-red-900/20",
                          "transition-colors duration-200"
                        )}
                      >
                        <IconLogout className="w-4 h-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
