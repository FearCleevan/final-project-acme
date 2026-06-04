/**
 * Shopify Customer Account API client.
 * Used after OAuth login — token comes from iron-session via /api/auth/me.
 * Runs server-side or client-side (token is passed in, not read from env).
 */

import type {
  CustomerProfile,
  CustomerAddress,
  CustomerOrder,
  CustomerUserError,
} from '@/lib/shopifyCustomer'

const SHOP_ID  = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_ID ?? '99152462129'
const API_VER  = '2024-10'
const ENDPOINT = `https://shopify.com/${SHOP_ID}/account/customer/api/${API_VER}/graphql`

async function caFetch<T>(token: string, query: string, variables?: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('[shopifyCustomerCA] HTTP', res.status, await res.text())
      return null
    }
    const { data, errors } = await res.json()
    if (errors?.length) {
      console.error('[shopifyCustomerCA] GraphQL errors:', errors)
      return null
    }
    return data as T
  } catch (err) {
    console.error('[shopifyCustomerCA]', err)
    return null
  }
}

// ─── CA API raw types ─────────────────────────────────────────────────────────

interface CAAddress {
  id: string
  firstName: string | null
  lastName:  string | null
  address1:  string | null
  address2:  string | null
  city:      string | null
  zoneCode:  string | null
  zip:       string | null
  countryCode: string | null
  phoneNumber: string | null
}

interface CAOrder {
  id:                string
  name:              string
  processedAt:       string
  fulfillmentStatus: string
  financialStatus:   string
  totalPrice:        { amount: string; currencyCode: string }
  lineItems: {
    edges: {
      node: {
        title:    string
        quantity: number
        image:    { url: string } | null
        price:    { amount: string; currencyCode: string } | null
      }
    }[]
  }
  fulfillments: {
    trackingInformation: { number: string | null; url: string | null }[]
  }[]
  shippingAddress: CAAddress | null
}

interface CACustomer {
  id:           string
  firstName:    string | null
  lastName:     string | null
  emailAddress: { emailAddress: string } | null
  phoneNumber:  { phoneNumber: string } | null
  defaultAddress: CAAddress | null
  addresses: { edges: { node: CAAddress }[] }
  orders:    { edges: { node: CAOrder }[] }
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapAddress(a: CAAddress): CustomerAddress {
  return {
    id:        a.id,
    firstName: a.firstName,
    lastName:  a.lastName,
    address1:  a.address1,
    address2:  a.address2,
    city:      a.city,
    province:  a.zoneCode,
    country:   a.countryCode,
    zip:       a.zip,
    phone:     a.phoneNumber,
  }
}

function mapOrder(o: CAOrder): CustomerOrder {
  return {
    id:                    o.id,
    name:                  o.name,
    processedAt:           o.processedAt,
    fulfillmentStatus:     o.fulfillmentStatus,
    financialStatus:       o.financialStatus,
    totalPriceV2:          o.totalPrice,
    subtotalPriceV2:       null,
    totalShippingPriceV2:  { amount: '0', currencyCode: o.totalPrice.currencyCode },
    shippingAddress:       o.shippingAddress ? mapAddress(o.shippingAddress) : null,
    lineItems: {
      edges: o.lineItems.edges.map(({ node: item }) => ({
        node: {
          title:    item.title,
          quantity: item.quantity,
          variant:  (item.image || item.price) ? {
            image:    item.image,
            priceV2:  item.price ?? { amount: '0', currencyCode: o.totalPrice.currencyCode },
          } : null,
        },
      })),
    },
    successfulFulfillments: o.fulfillments.map(f => ({
      trackingInfo: f.trackingInformation,
      fulfillmentLineItems: { edges: [] },
    })),
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const ADDRESS_FIELDS = `
  id firstName lastName
  address1 address2
  city zoneCode zip countryCode phoneNumber
`

export async function getCustomerProfileCA(token: string): Promise<CustomerProfile | null> {
  const data = await caFetch<{ customer: CACustomer | null }>(token, `
    query GetCustomer {
      customer {
        id firstName lastName
        emailAddress { emailAddress }
        phoneNumber   { phoneNumber }
        defaultAddress { ${ADDRESS_FIELDS} }
        addresses(first: 5) {
          edges { node { ${ADDRESS_FIELDS} } }
        }
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id name processedAt
              fulfillmentStatus financialStatus
              totalPrice { amount currencyCode }
              shippingAddress { ${ADDRESS_FIELDS} }
              lineItems(first: 10) {
                edges {
                  node {
                    title quantity
                    image { url }
                    price { amount currencyCode }
                  }
                }
              }
              fulfillments(first: 1) {
                trackingInformation { number url }
              }
            }
          }
        }
      }
    }
  `)

  const c = data?.customer
  if (!c) return null

  return {
    id:             c.id,
    firstName:      c.firstName,
    lastName:       c.lastName,
    email:          c.emailAddress?.emailAddress ?? '',
    phone:          c.phoneNumber?.phoneNumber ?? null,
    defaultAddress: c.defaultAddress ? mapAddress(c.defaultAddress) : null,
    addresses:      { edges: c.addresses.edges.map(({ node }) => ({ node: mapAddress(node) })) },
    orders:         { edges: c.orders.edges.map(({ node }) => ({ node: mapOrder(node) })) },
  }
}

// ─── Address mutations ────────────────────────────────────────────────────────

type AddressInput = Omit<CustomerAddress, 'id'>

function toCAAddressInput(a: AddressInput) {
  return {
    firstName:   a.firstName,
    lastName:    a.lastName,
    address1:    a.address1,
    address2:    a.address2,
    city:        a.city,
    zoneCode:    a.province,
    zip:         a.zip,
    countryCode: a.country,
    phoneNumber: a.phone,
  }
}

export async function caAddressCreate(
  token: string,
  address: AddressInput
): Promise<{ id: string | null; errors: CustomerUserError[] }> {
  const data = await caFetch<{
    customerAddressCreate: {
      customerAddress: { id: string } | null
      userErrors: CustomerUserError[]
    }
  }>(token, `
    mutation CreateAddress($address: CustomerAddressInput!) {
      customerAddressCreate(address: $address) {
        customerAddress { id }
        userErrors { field message }
      }
    }
  `, { address: toCAAddressInput(address) })

  return {
    id:     data?.customerAddressCreate?.customerAddress?.id ?? null,
    errors: data?.customerAddressCreate?.userErrors ?? [],
  }
}

export async function caAddressUpdate(
  token: string,
  addressId: string,
  address: AddressInput
): Promise<CustomerUserError[]> {
  const data = await caFetch<{
    customerAddressUpdate: { userErrors: CustomerUserError[] }
  }>(token, `
    mutation UpdateAddress($addressId: ID!, $address: CustomerAddressUpdateInput!) {
      customerAddressUpdate(addressId: $addressId, address: $address) {
        userErrors { field message }
      }
    }
  `, { addressId, address: toCAAddressInput(address) })

  return data?.customerAddressUpdate?.userErrors ?? []
}

export async function caAddressDelete(
  token: string,
  addressId: string
): Promise<CustomerUserError[]> {
  const data = await caFetch<{
    customerAddressDelete: { userErrors: CustomerUserError[] }
  }>(token, `
    mutation DeleteAddress($addressId: ID!) {
      customerAddressDelete(addressId: $addressId) {
        deletedAddressId
        userErrors { field message }
      }
    }
  `, { addressId })

  return data?.customerAddressDelete?.userErrors ?? []
}

export async function caDefaultAddressUpdate(
  token: string,
  addressId: string
): Promise<CustomerUserError[]> {
  const data = await caFetch<{
    customerAddressUpdate: { userErrors: CustomerUserError[] }
  }>(token, `
    mutation SetDefaultAddress($addressId: ID!) {
      customerAddressUpdate(addressId: $addressId, defaultAddress: true, address: {}) {
        userErrors { field message }
      }
    }
  `, { addressId })

  return data?.customerAddressUpdate?.userErrors ?? []
}
