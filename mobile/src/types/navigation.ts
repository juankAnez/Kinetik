import type { Order } from "./models";

export type RootStackParamList = {
  Auth: undefined;
  Client: undefined;
  Courier: undefined;
  Commerce: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ClientStackParamList = {
  Home: undefined;
  StoreDetail: { storeId: number; storeName: string };
  ProductDetail: { storeId: number; productId: number };
  Cart: undefined;
  Checkout: undefined;
  AddressPicker: undefined;
  OrderDetail: { orderId: number };
  OrderTracking: { orderId: number };
  Chat: { conversationId: number; orderId: number };
  Profile: undefined;
};

export type CourierStackParamList = {
  CourierHome: undefined;
  AssignedOrder: { orderId: number };
  OrderDetail: { orderId: number };
  Chat: { conversationId: number; orderId: number };
  Wallet: undefined;
  Profile: undefined;
};

export type CommerceStackParamList = {
  CommerceHome: undefined;
  CommerceStoreSettings: undefined;
  CommerceProductList: undefined;
  CommerceProductForm: { productId?: number } | undefined;
  CommerceOrderList: { status?: string } | undefined;
  CommerceOrderDetail: { orderId: number };
};

export type TabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};
