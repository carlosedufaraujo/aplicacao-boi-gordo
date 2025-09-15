import React from "react";
import { motion } from "framer-motion";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconPackage,
  IconCurrencyDollar,
  IconChartBar,
  IconArrowRight,
} from "@tabler/icons-react";
import { cn } from "../../lib/utils";
import { BackgroundGradient } from "../ui/background-gradient";
import { CardContainer, CardBody, CardItem } from "../ui/3d-card";

export function ModernDashboard() {
  const stats = [
    {
      title: "Total de Vendas",
      value: "R$ 2,456,789",
      change: "+12.5%",
      trend: "up",
      icon: IconCurrencyDollar,
      color: "from-emerald-400 to-green-600",
    },
    {
      title: "Animais em Estoque",
      value: "1,234",
      change: "+8.2%",
      trend: "up",
      icon: IconPackage,
      color: "from-blue-400 to-indigo-600",
    },
    {
      title: "Taxa de Crescimento",
      value: "15.3%",
      change: "+2.1%",
      trend: "up",
      icon: IconChartBar,
      color: "from-purple-400 to-pink-600",
    },
    {
      title: "Parceiros Ativos",
      value: "42",
      change: "-1.2%",
      trend: "down",
      icon: IconUsers,
      color: "from-orange-400 to-red-600",
    },
  ];

  const recentActivity = [
    { id: 1, type: "purchase", description: "Compra de 50 animais - Lote #1234", time: "2 horas atrás" },
    { id: 2, type: "sale", description: "Venda de 30 animais - Cliente ABC", time: "5 horas atrás" },
    { id: 3, type: "transfer", description: "Transferência entre currais", time: "1 dia atrás" },
    { id: 4, type: "payment", description: "Pagamento recebido - R$ 150,000", time: "2 dias atrás" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Dashboard
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Visão geral do sistema e métricas principais
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <BackgroundGradient className="rounded-xl bg-white dark:bg-zinc-900 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.trend === "up" ? (
                      <IconTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <IconTrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        stat.trend === "up" ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "p-3 rounded-lg bg-gradient-to-br",
                    stat.color
                  )}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </BackgroundGradient>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Análise de Vendas
              </h2>
              <select className="text-sm px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <option>Últimos 7 dias</option>
                <option>Últimos 30 dias</option>
                <option>Últimos 3 meses</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <IconChartBar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Gráfico de vendas</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Atividade Recente
            </h2>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">
                    {activity.description}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center justify-center">
              Ver todas
              <IconArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* 3D Card Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <CardContainer className="inter-var">
          <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
            <CardItem
              translateZ="50"
              className="text-xl font-bold text-neutral-600 dark:text-white"
            >
              Próximas Ações
            </CardItem>
            <CardItem
              as="p"
              translateZ="60"
              className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
            >
              Acompanhe as tarefas pendentes e compromissos agendados
            </CardItem>
            <CardItem translateZ="100" className="w-full mt-4">
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    Reunião com fornecedor
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Hoje às 14:00
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Revisão de contratos
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Amanhã às 10:00
                  </p>
                </div>
              </div>
            </CardItem>
            <div className="flex justify-between items-center mt-6">
              <CardItem
                translateZ={20}
                as="button"
                className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
              >
                Ver calendário →
              </CardItem>
              <CardItem
                translateZ={20}
                as="button"
                className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold"
              >
                Adicionar tarefa
              </CardItem>
            </div>
          </CardBody>
        </CardContainer>

        <CardContainer className="inter-var">
          <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
            <CardItem
              translateZ="50"
              className="text-xl font-bold text-neutral-600 dark:text-white"
            >
              Performance Mensal
            </CardItem>
            <CardItem
              as="p"
              translateZ="60"
              className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
            >
              Análise comparativa do desempenho atual
            </CardItem>
            <CardItem translateZ="100" className="w-full mt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Meta de vendas
                  </span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    85%
                  </span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-400 to-green-600 h-2 rounded-full" style={{ width: "85%" }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Ocupação de currais
                  </span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    72%
                  </span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-indigo-600 h-2 rounded-full" style={{ width: "72%" }} />
                </div>
              </div>
            </CardItem>
            <div className="flex justify-between items-center mt-6">
              <CardItem
                translateZ={20}
                as="button"
                className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
              >
                Detalhes →
              </CardItem>
              <CardItem
                translateZ={20}
                as="button"
                className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold"
              >
                Gerar relatório
              </CardItem>
            </div>
          </CardBody>
        </CardContainer>
      </motion.div>
    </div>
  );
}
