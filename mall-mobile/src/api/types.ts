export type User = {
  id: number;
  username: string;
  nickname: string;
  role: 'customer' | 'merchant' | 'company_admin';
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
};

export type CartItem = {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
  subtotal: number;
};

export type Cart = {
  items: CartItem[];
  total_amount: number;
};

export type Address = {
  id: number;
  receiver_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
  created_at: string;
};

export type AddressInput = Omit<Address, 'id' | 'created_at'>;

export type OrderItem = {

  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
};

export type Logistics = {
  company: string;
  tracking_number: string;
  note: string;
  shipped_at: string | null;
};

export type AfterSale = {
  id: number;
  order_id: number;
  reason: string;
  description: string;
  status: string;
  reply: string | null;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type Order = {
  id: number;
  total_amount: number;
  status: string;
  paid_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  logistics: Logistics | null;
  after_sale: AfterSale | null;
  reviews: Review[];
  address_id: number | null;
  address_snapshot: string | null;
  created_at: string;
  items: OrderItem[];
};


