export interface AddAddressPayload {
  label: string
  recipientName: string
  phone: string
  line1: string
  ward: string
  district: string
  city: string
  location?: {
    type: 'Point'
    coordinates: [number, number]
  }
  isDefault: boolean
}
