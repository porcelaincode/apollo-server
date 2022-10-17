export interface ContactProps {
  ISD: string | null;
  number: string | null;
}

export interface PriceProps {
  mrp: string;
  discount?: string;
}

export interface PointProps {
  hash: string;
  coordinates: [string, string];
}

export interface UserProps {
  id: string;
  name: string;
  contact: ContactProps;
  business: boolean;
}

export interface RegisterProps {
  name: string;
  contact: ContactProps;
  coordinates: [string, string];
  business: boolean;
}

export interface UpdateAddressProps {
  name: string;
  line: string;
  location: {
    coordinates: [string, string];
  };
}

export interface EditProfileProps {
  name: string;
  contact: ContactProps;
}

// inventory Props

export interface CreateInventoryProps {
  products?: any;
  storeId: string;
}

export interface InventoryProductProps {
  id: string;
  name: string;
  price: {
    mrp: string;
    sale: string;
  };
  vendor: {
    name: string | null;
    contact: ContactProps;
  } | null;
  itemQuantity: string;
}

// order Props

export interface OrderProps {
  meta: {
    storeId: string;
    userId: string;
  };
  products: [OrderProductProps];
  linkedAccount: string;
  state: OrderStateProps;
}

interface OrderStateProps {
  created: OrderCreatedProps;
  cancelled: OrderCancelProps;
  delivery: OrderDeliveryProps;
  payment: OrderPaymentProps;
}

interface OrderCreatedProps {
  date: string;
}
interface OrderCancelProps {
  bool: boolean;
  date: string;
}

interface OrderDeliveryProps {
  toDeliver: boolean;
  address: OrderDeliveryAddressProps;
  deliverBy: string;
  delivered: boolean;
  deliveredAt: string;
}

interface OrderDeliveryAddressProps {
  line: string;
  location: PointProps;
}

interface OrderPaymentProps {
  paid?: boolean;
  grandAmount: string;
  paidAt?: string;
}

interface OrderProductProps {
  brand: string;
  name: string;
  url: string;
  price: PriceProps;
  quantity: number;
  totalAmount: string;
}

export interface OrderProductInputProps {
  id: string;
  quantity: number;
  inStore: boolean;
}

export interface CreateOrderProps {
  products: Array<OrderProductInputProps>;
  grandTotal?: string;
  addressId: string;
  storeId: string;
  delivery: boolean;
  deliverBy: string;
  accountId?: string;
}

// twillio props

export interface TwilioMessageProps {
  sid: string;
}

// product props

export interface ProductProps {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  ratings: Array<number>;
  quantity: {
    count: String;
    type: String;
  };
  price: {
    mrp: string;
    sale: string;
  };
  itemQuantity?: string;
}

export interface SearchProductProps {
  name: string;
  storeId?: string;
  category?: string;
  limit: number;
  offset: number;
}

export interface CreateProductProps {
  productId: string;
  brand: string;
  name: string;
  imageUrl: string;
  mrp: string;
  sale: string;
  isDivisible: boolean;
  inInventory: boolean;
  isEdible: boolean;
  isSale: boolean;
  isVeg: boolean;
  isVegan: boolean;
  count: string;
  type: string;
  barcode: string;
}

// stores props

export interface StoreLocationProps {
  line1: string;
  location: {
    hash: string;
    coordinates: [string, string];
  };
}

export interface StoreAccountProps {
  id: string;
  name: string;
  lastUpdated: string;
  closed: boolean;
  orders: Array<{
    orderId: string;
    paid: boolean;
    date: string;
    amount: string;
  }>;
  pending: {
    status: boolean;
    amount: string;
  };
}

export interface StoreInfoProps {
  name: string;
  contact: ContactProps;
  address: StoreLocationProps;
  accounts: Array<StoreAccountProps>;
}

export interface AddToAccountsProps {
  name: string;
  private: boolean;
  line1: string;
  line2: string;
  contact: ContactProps;
  orderId: string;
}

export interface CloseAccountProps {
  id: string;
  transactionType: string;
  transactionId: string;
}
