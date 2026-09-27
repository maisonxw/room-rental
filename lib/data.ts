export interface Studio {
  id: string
  name: string
  type: string
  address: string
  city: string
  price: number
  pricePerDay: number
  pricePerHour: number
  rating: number
  reviewCount: number
  guests: number
  bedrooms: number
  beds: number
  baths: number
  images: string[]
  tags: string[]
  accent: string
  description: string
  host: {
    name: string
    avatar: string
    isSuperhost: boolean
    responseRate: string
    joinedYear: string
  }
  amenities: {
    category: string
    items: string[]
  }[]
  rules: string[]
}

export type BookingStatus =
  | 'chua_xac_nhan'
  | 'da_xac_nhan'
  | 'dang_thue'
  | 'da_hoan_thanh'
  | 'pending'
  | 'deposit_paid'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

export interface BookingData {
  id: string
  code: string
  studioId: string
  studioName: string
  studioImage: string
  studioAddress: string
  customerName: string
  customerPhone: string
  customerEmail: string
  idPassport?: string
  specialRequests?: string
  rentalType?: 'hourly' | 'daily'
  hoursCount?: number
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  totalPrice: number
  depositPrice: number
  status: BookingStatus
  createdAt: string
}

export interface PaymentSettings {
  bankName: string
  accountNumber: string
  accountHolder: string
  depositPercent: number
  noteSyntax: string
  qrImage?: string
}

export const defaultPaymentSettings: PaymentSettings = {
  bankName: 'MBBank (Ngân hàng Quân Đội)',
  accountNumber: '0369 399 740',
  accountHolder: 'CHUPCHOET ROOM STUDIO',
  depositPercent: 30,
  noteSyntax: 'CHUPCHOET',
}

export const DEFAULT_STUDIO_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'

export const studioFallbacks: Studio[] = []

export function getStudioFallbacks(): Studio[] {
  return studioFallbacks
}

export function getStudioFallbackById(id: string): Studio | undefined {
  return studioFallbacks.find((studio) => studio.id === id)
}

export function normalizeStudio(raw: Partial<Studio> & { id?: string }): Studio {
  const safeImages = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : [DEFAULT_STUDIO_IMAGE]

  return {
    id: raw.id ?? 'studio-default',
    name: raw.name ?? 'Studio chụp ảnh',
    type: raw.type ?? 'Photo Studio',
    address: raw.address ?? 'Địa chỉ studio',
    city: raw.city ?? 'Hà Nội',
    price: Number(raw.price ?? 0),
    pricePerDay: Number(raw.pricePerDay ?? raw.price ?? 0),
    pricePerHour: Number(raw.pricePerHour ?? raw.price ?? 0),
    rating: Number(raw.rating ?? 4.9),
    reviewCount: Number(raw.reviewCount ?? 0),
    guests: Number(raw.guests ?? 6),
    bedrooms: Number(raw.bedrooms ?? 0),
    beds: Number(raw.beds ?? 0),
    baths: Number(raw.baths ?? 0),
    images: safeImages,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    accent: raw.accent ?? '#f472b6',
    description: raw.description ?? 'Studio chụp ảnh chuyên nghiệp với ánh sáng và không gian hiện đại.',
    host: {
      name: raw.host?.name ?? 'ChupChoet Studio',
      avatar: raw.host?.avatar ?? DEFAULT_STUDIO_IMAGE,
      isSuperhost: raw.host?.isSuperhost ?? true,
      responseRate: raw.host?.responseRate ?? '98%',
      joinedYear: raw.host?.joinedYear ?? '2023',
    },
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    rules: Array.isArray(raw.rules) ? raw.rules : [],
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(amount)
    .replace('₫', 'đ')
}
