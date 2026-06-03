export type OrderStatus = 'unfulfilled' | 'fulfilled' | 'cancelled' | 'refunded'
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'partially_paid'
export type ProductStatus = 'active' | 'draft'

export type FulfillmentEventStatus =
  | 'confirmed'
  | 'label_printed'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'attempted_delivery'
  | 'failure'

export interface FulfillmentEvent {
  id: string
  status: FulfillmentEventStatus
  message: string
  happenedAt: string
  trackingNumber?: string
  carrier?: string
}

export interface AdminCustomer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  country: string
  orders: number
  totalSpent: number
  joined: string
}

export interface AdminOrderItem {
  id: string
  title: string
  sku: string
  quantity: number
  unitPrice: number
  image: string
}

export interface AdminOrder {
  id: string
  customer: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    province: string
    country: string
  }
  date: string
  items: AdminOrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  paymentStatus: PaymentStatus
  fulfillmentStatus: OrderStatus
  notes: string
  trackingRef: string
  estimatedDelivery?: string
  fulfillmentEvents: FulfillmentEvent[]
  shopifyFulfillmentId?: string
  shopifyFulfillmentOrderId?: string
}

export interface AdminProduct {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  price: number
  compareAtPrice: number | null
  sku: string
  patent: string
  stock: number
  status: ProductStatus
  collections: string[]
  tags: string[]
  vendor: string
  images: string[]
  sellWhenOutOfStock: boolean
  netWeight: string
  material: string
  colour: string
  style: string
  brand: string
  vintage: string
  burnerSize: string
  fits: string
  era: string
  powerSource: string
  productType: string
  condition: string
  edition: string
  workshop: string
  benchTester: string
  benchTestDate: string
  category: { id: string; name: string } | null
}

export interface AdminCollection {
  id: string
  title: string
  handle: string
  description: string
  productCount: number
  products: { id: string; title: string; status: string; image?: string }[]
}

export interface ChartDataPoint {
  date: string
  revenue: number
  orders: number
}

export interface RevenueStats {
  today: number
  week: number
  month: number
  todayChange: number
  weekChange: number
  monthChange: number
}

export interface TopProduct {
  id: string
  title: string
  sku: string
  unitsSold: number
  revenue: number
  collection: string
}

export interface AbandonedCheckout {
  id: string
  customer: string
  email: string
  items: number
  value: number
  abandonedAt: string
}

export type NotificationType = 'new_order' | 'low_stock' | 'new_customer'

export interface AdminNotification {
  id:        string
  type:      NotificationType
  title:     string
  subtitle:  string
  href:      string
  amount?:   number
  timestamp: string
}
