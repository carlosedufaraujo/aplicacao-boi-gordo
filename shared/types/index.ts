// Tipos compartilhados entre Frontend e Backend

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isMaster: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MASTER = 'MASTER'
}

export interface Session {
  access_token: string;
  user: User;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role?: UserRole;
}

// Tipos de negócio
export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum PartnerType {
  VENDOR = 'VENDOR',
  BROKER = 'BROKER',
  BUYER = 'BUYER',
  INVESTOR = 'INVESTOR'
}

export interface CattleLot {
  id: string;
  lotNumber: string;
  vendorId: string;
  brokerId?: string;
  quantity: number;
  averageWeight: number;
  pricePerKg: number;
  totalValue: number;
  purchaseDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: LotStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum LotStatus {
  NEGOTIATION = 'NEGOTIATION',
  CONFIRMED = 'CONFIRMED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface Expense {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  payerAccountId?: string;
  status: PaymentStatus;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export interface Revenue {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  payerAccountId?: string;
  status: PaymentStatus;
  dueDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}