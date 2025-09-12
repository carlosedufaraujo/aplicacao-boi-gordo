import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Package,
  Truck,
  Heart,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  List,
  Grid3x3,
  CalendarDays,
  Bell,
  Repeat,
  Tag,
  FileText,
  User,
  Building2,
  Stethoscope,
  ShoppingCart,
  TrendingUp,
  Beef
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  eachDayOfInterval,
  getDay,
  setMonth,
  setYear
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'purchase' | 'sale' | 'health' | 'transport' | 'finance' | 'general';
  date: Date;
  time?: string;
  location?: string;
  participants?: string[];
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  recurring?: boolean;
  tags?: string[];
  color?: string;
}

const eventTypes = [
  { id: 'purchase', label: 'Compra', icon: ShoppingCart, color: 'bg-blue-500' },
  { id: 'sale', label: 'Venda', icon: TrendingUp, color: 'bg-green-500' },
  { id: 'health', label: 'Veterinária', icon: Stethoscope, color: 'bg-red-500' },
  { id: 'transport', label: 'Transporte', icon: Truck, color: 'bg-orange-500' },
  { id: 'finance', label: 'Financeiro', icon: DollarSign, color: 'bg-purple-500' },
  { id: 'general', label: 'Geral', icon: CalendarIcon, color: 'bg-gray-500' }
];

export const ModernCalendar: React.FC = () => {
  console.log('📅 ModernCalendar component loaded - ESTE É O CALENDÁRIO MODERNO!');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Eventos mockados
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Recepção Lote Nelore',
      description: 'Recepção de 50 cabeças de gado Nelore',
      type: 'purchase',
      date: new Date(2024, 0, 15),
      time: '08:00',
      location: 'Fazenda Principal',
      participants: ['João Silva', 'Maria Santos'],
      status: 'scheduled',
      priority: 'high',
      tags: ['nelore', 'compra']
    },
    {
      id: '2',
      title: 'Vacinação - Lote 234',
      description: 'Aplicação de vacina contra febre aftosa',
      type: 'health',
      date: new Date(2024, 0, 18),
      time: '14:00',
      location: 'Curral 2',
      participants: ['Dr. Carlos Veterinário'],
      status: 'scheduled',
      priority: 'high',
      tags: ['vacinação', 'saúde']
    },
    {
      id: '3',
      title: 'Embarque para Frigorífico',
      description: 'Embarque de 30 cabeças para JBS',
      type: 'sale',
      date: new Date(2024, 0, 20),
      time: '06:00',
      location: 'Portaria Principal',
      participants: ['Pedro Transportes'],
      status: 'scheduled',
      priority: 'medium',
      tags: ['venda', 'transporte']
    },
    {
      id: '4',
      title: 'Pagamento Fornecedores',
      description: 'Pagamento mensal de ração e suplementos',
      type: 'finance',
      date: new Date(2024, 0, 25),
      time: '10:00',
      status: 'scheduled',
      priority: 'medium',
      tags: ['financeiro', 'pagamento']
    },
    {
      id: '5',
      title: 'Inspeção Sanitária',
      description: 'Visita do fiscal sanitário estadual',
      type: 'health',
      date: new Date(2024, 0, 28),
      time: '09:00',
      location: 'Escritório',
      participants: ['Fiscal MAPA'],
      status: 'scheduled',
      priority: 'high',
      tags: ['inspeção', 'compliance']
    }
  ]);

  // Calendário base
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { locale: ptBR });
    const end = endOfWeek(endOfMonth(currentDate), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Eventos filtrados
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesType = filterType === 'all' || event.type === filterType;
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [events, filterType, searchTerm]);

  // Eventos por dia
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach(event => {
      const key = format(event.date, 'yyyy-MM-dd');
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  // Navegação
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Criar/Editar evento
  const handleSaveEvent = () => {
    // Implementar salvamento
    setShowEventDialog(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  // Renderizar dia no calendário
  const renderCalendarDay = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDay[dayKey] || [];
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isTodayDate = isToday(day);

    return (
      <div
        key={dayKey}
        className={cn(
          "min-h-[100px] p-2 border cursor-pointer transition-colors",
          !isCurrentMonth && "bg-muted/50 text-muted-foreground",
          isSelected && "bg-primary/10 border-primary",
          isTodayDate && "bg-blue-50 dark:bg-blue-950/20"
        )}
        onClick={() => setSelectedDate(day)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "text-sm font-medium",
            isTodayDate && "text-blue-600 dark:text-blue-400"
          )}>
            {format(day, 'd')}
          </span>
          {dayEvents.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {dayEvents.length}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          {dayEvents.slice(0, 3).map(event => {
            const eventType = eventTypes.find(t => t.id === event.type);
            return (
              <div
                key={event.id}
                className={cn(
                  "text-xs p-1 rounded truncate",
                  eventType?.color,
                  "text-white"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setShowEventDialog(true);
                }}
              >
                {event.time && <span className="font-medium">{event.time} </span>}
                {event.title}
              </div>
            );
          })}
          {dayEvents.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{dayEvents.length - 3} mais
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Calendário</h1>
          <p className="text-muted-foreground">Gerencie eventos e atividades da fazenda</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>Hoje</Button>
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
                <DialogDescription>Preencha as informações do evento</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input placeholder="Título do evento" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select defaultValue="general">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Selecione'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        {/* Calendar component would go here */}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input type="time" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input placeholder="Local do evento" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea placeholder="Descrição do evento" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Participantes</Label>
                  <Input placeholder="Separados por vírgula" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEvent}>
                  {selectedEvent ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Controles e Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-heading-lg min-w-[150px] text-center">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Separator orientation="vertical" className="h-8" />
              
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="list">Lista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
                <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {eventTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Views */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Calendário Principal */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              {viewMode === 'month' && (
                <div>
                  {/* Dias da semana */}
                  <div className="grid grid-cols-7 gap-px mb-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-sm font-medium py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Dias do mês */}
                  <div className="grid grid-cols-7 gap-px">
                    {calendarDays.map(day => renderCalendarDay(day))}
                  </div>
                </div>
              )}
              
              {viewMode === 'week' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Visualização semanal em desenvolvimento
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {viewMode === 'day' && (
                <div className="space-y-4">
                  <h3 className="card-title">
                    {format(selectedDate || currentDate, 'dd MMMM yyyy', { locale: ptBR })}
                  </h3>
                  <Separator />
                  <div className="space-y-2">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div key={hour} className="flex items-start gap-4 py-2">
                        <span className="text-sm text-muted-foreground w-12">
                          {String(hour).padStart(2, '0')}:00
                        </span>
                        <div className="flex-1 min-h-[40px] border-t" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {filteredEvents.map(event => {
                    const eventType = eventTypes.find(t => t.id === event.type);
                    const Icon = eventType?.icon || CalendarIcon;
                    
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventDialog(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", eventType?.color, "text-white")}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              {format(event.date, 'dd/MM/yyyy')}
                              {event.time && (
                                <>
                                  <Clock className="h-3 w-3" />
                                  {event.time}
                                </>
                              )}
                              {event.location && (
                                <>
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.priority === 'high' && (
                            <Badge variant="destructive">Alta</Badge>
                          )}
                          <Badge variant="outline">
                            {event.status === 'scheduled' ? 'Agendado' :
                             event.status === 'in_progress' ? 'Em Andamento' :
                             event.status === 'completed' ? 'Concluído' : 'Cancelado'}
                          </Badge>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Mini calendário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Navegação Rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((month, index) => (
                  <Button
                    key={month}
                    variant={currentDate.getMonth() === index ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setCurrentDate(setMonth(currentDate, index))}
                  >
                    {month}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Próximos eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {filteredEvents
                    .filter(e => e.date >= new Date())
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 5)
                    .map(event => {
                      const eventType = eventTypes.find(t => t.id === event.type);
                      const Icon = eventType?.icon || CalendarIcon;
                      
                      return (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 pb-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 p-2 -m-2 rounded"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventDialog(true);
                          }}
                        >
                          <div className={cn("p-1.5 rounded", eventType?.color, "text-white")}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-tight">{event.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(event.date, 'dd/MM')} {event.time && `às ${event.time}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumo do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventTypes.map(type => {
                  const count = events.filter(e => 
                    e.type === type.id && 
                    isSameMonth(e.date, currentDate)
                  ).length;
                  
                  return (
                    <div key={type.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", type.color)} />
                        <span className="text-sm">{type.label}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span className="text-sm">Total</span>
                  <Badge>{events.filter(e => isSameMonth(e.date, currentDate)).length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};