export type PaymentMethod = "Cartão de Crédito" | "Cartão de Débito" | "Dinheiro" | "PIX";
export type SaleStatus = "Pendente" | "Concluída" | "Cancelada";
export type ValeStatus = "Pendente" | "Pago";

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  stock: number;
  price: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  discount: number;
  finalTotal: number;
  paymentMethod: PaymentMethod | "";
  amountPaid: number;
  change: number;
  status: SaleStatus;
}

export interface Vale {
  id: string;
  customerName: string;
  date: string;
  items: CartItem[];
  total: number;
  status: ValeStatus;
}

export interface InventoryLog {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: "Entrada" | "Saída" | "Ajuste";
  quantity: number;
  reason: string;
}
