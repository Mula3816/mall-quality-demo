export type AdminRole = 'merchant' | 'company_admin';

export type LoginResult = {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    role: AdminRole | 'customer';
  };
};

export type AdminSummary = {
  total_products: number;
  total_users: number;
  total_orders: number;
  revenue: number;
  pending_orders: number;
  low_stock_products: number;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  created_at: string;
};

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
};

export type AdminUser = {
  id: number;
  username: string;
  nickname: string;
  role: 'customer' | AdminRole;
  created_at: string;
  order_count: number;
  cart_item_count: number;
  address_count: number;
};


export type AdminOrderItem = {
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

export type AdminOrder = {
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
  user: {
    id: number;
    username: string;
    nickname: string;
    created_at: string;
  };
  items: AdminOrderItem[];
};

