export interface Carrier {
  name: string
  shopifyCode: string
  trackingUrl: string
}

export const CARRIERS: Carrier[] = [
  {
    name: 'Canada Post',
    shopifyCode: 'Canada Post',
    trackingUrl: 'https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=',
  },
  {
    name: 'UPS',
    shopifyCode: 'UPS',
    trackingUrl: 'https://www.ups.com/track?tracknum=',
  },
  {
    name: 'FedEx',
    shopifyCode: 'FedEx',
    trackingUrl: 'https://www.fedex.com/apps/fedextrack/?tracknumbers=',
  },
  {
    name: 'Purolator',
    shopifyCode: 'Purolator',
    trackingUrl: 'https://www.purolator.com/en/ship-track/tracking-details.page?pin=',
  },
  {
    name: 'DHL Express',
    shopifyCode: 'DHL Express',
    trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=',
  },
  {
    name: 'Canpar',
    shopifyCode: 'Canpar',
    trackingUrl: 'https://www.canpar.com/en/manage/tracking/trackingBarcodes.do?barcode=',
  },
  {
    name: 'USPS',
    shopifyCode: 'USPS',
    trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  },
  {
    name: 'Amazon Logistics',
    shopifyCode: 'Amazon Logistics',
    trackingUrl: 'https://track.amazon.ca/tracking/',
  },
  {
    name: 'Other',
    shopifyCode: 'Other',
    trackingUrl: '',
  },
]
