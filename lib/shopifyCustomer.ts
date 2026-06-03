/**
 * Shopify Storefront API — Customer auth, orders, and addresses.
 * Runs client-side (browser) using NEXT_PUBLIC_ credentials.
 */

const DOMAIN   = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!
const TOKEN    = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!
const ENDPOINT = `https://${DOMAIN}/api/2025-01/graphql.json`

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomerUserError {
  field: string[] | null
  message: string
}

export interface CustomerAccessToken {
  accessToken: string
  expiresAt: string
}

export interface CustomerAddress {
  id: string
  firstName: string | null
  lastName: string | null
  address1: string | null
  address2: string | null
  city: string | null
  province: string | null
  country: string | null
  zip: string | null
  phone: string | null
}

export interface CustomerOrderLineItem {
  title: string
  quantity: number
  variant: {
    image: { url: string } | null
    priceV2: { amount: string; currencyCode: string }
  } | null
}

export interface CustomerFulfillment {
  trackingInfo: { number: string | null; url: string | null }[]
  fulfillmentLineItems: {
    edges: { node: { lineItem: { title: string } } }[]
  }
}

export interface CustomerOrder {
  id: string
  name: string
  processedAt: string
  fulfillmentStatus: string
  financialStatus: string
  totalPriceV2: { amount: string; currencyCode: string }
  subtotalPriceV2: { amount: string; currencyCode: string } | null
  totalShippingPriceV2: { amount: string; currencyCode: string }
  lineItems: { edges: { node: CustomerOrderLineItem }[] }
  successfulFulfillments: CustomerFulfillment[]
  shippingAddress: CustomerAddress | null
}

export interface CustomerProfile {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  defaultAddress: CustomerAddress | null
  addresses: { edges: { node: CustomerAddress }[] }
  orders: { edges: { node: CustomerOrder }[] }
}

// ─── Internal fetch ───────────────────────────────────────────────────────────

async function customerFetch<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const { data, errors } = await res.json()
    if (errors?.length) {
      console.error('[shopifyCustomer] GraphQL errors:', errors)
      return null
    }
    return data as T
  } catch (err) {
    console.error('[shopifyCustomer]', err)
    return null
  }
}

// ─── Auth mutations ───────────────────────────────────────────────────────────

/** Register a new customer account. */
export async function customerCreate(input: {
  firstName: string
  lastName: string
  email: string
  password: string
}): Promise<{ token: CustomerAccessToken | null; errors: CustomerUserError[] }> {
  const data = await customerFetch<{
    customerCreate: {
      customer: { id: string } | null
      customerUserErrors: CustomerUserError[]
    }
  }>(
    `mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id }
        customerUserErrors { field message }
      }
    }`,
    { input }
  )

  const errors = data?.customerCreate?.customerUserErrors ?? []
  if (errors.length || !data?.customerCreate?.customer) {
    return { token: null, errors }
  }

  // Auto-login after registration
  return customerLogin({ email: input.email, password: input.password })
}

/** Login with email + password. Returns access token. */
export async function customerLogin(input: {
  email: string
  password: string
}): Promise<{ token: CustomerAccessToken | null; errors: CustomerUserError[] }> {
  const data = await customerFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: CustomerAccessToken | null
      customerUserErrors: CustomerUserError[]
    }
  }>(
    `mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { field message }
      }
    }`,
    { input }
  )

  const errors = data?.customerAccessTokenCreate?.customerUserErrors ?? []
  const token  = data?.customerAccessTokenCreate?.customerAccessToken ?? null
  return { token, errors }
}

/** Logout — invalidate the access token. */
export async function customerLogout(accessToken: string): Promise<void> {
  await customerFetch(
    `mutation customerAccessTokenDelete($customerAccessToken: String!) {
      customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
        deletedAccessToken
      }
    }`,
    { customerAccessToken: accessToken }
  )
}

/** Send password reset email. */
export async function customerRecover(email: string): Promise<CustomerUserError[]> {
  const data = await customerFetch<{
    customerRecover: { customerUserErrors: CustomerUserError[] }
  }>(
    `mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { field message }
      }
    }`,
    { email }
  )
  return data?.customerRecover?.customerUserErrors ?? []
}

/** Renew an expiring token. */
export async function customerTokenRenew(
  accessToken: string
): Promise<CustomerAccessToken | null> {
  const data = await customerFetch<{
    customerAccessTokenRenew: {
      customerAccessToken: CustomerAccessToken | null
    }
  }>(
    `mutation customerAccessTokenRenew($customerAccessToken: String!) {
      customerAccessTokenRenew(customerAccessToken: $customerAccessToken) {
        customerAccessToken { accessToken expiresAt }
      }
    }`,
    { customerAccessToken: accessToken }
  )
  return data?.customerAccessTokenRenew?.customerAccessToken ?? null
}

// ─── Profile & orders ─────────────────────────────────────────────────────────

const ADDRESS_FIELDS = `
  id firstName lastName
  address1 address2
  city province country zip phone
`

const ORDER_LINE_ITEM_FIELDS = `
  title quantity
  variant {
    image { url }
    priceV2 { amount currencyCode }
  }
`

/** Fetch the full customer profile: orders + addresses. */
export async function getCustomerProfile(
  accessToken: string
): Promise<CustomerProfile | null> {
  const data = await customerFetch<{ customer: CustomerProfile | null }>(
    `query GetCustomer($token: String!) {
      customer(customerAccessToken: $token) {
        id firstName lastName email phone
        defaultAddress { ${ADDRESS_FIELDS} }
        addresses(first: 5) {
          edges { node { ${ADDRESS_FIELDS} } }
        }
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id name processedAt
              fulfillmentStatus financialStatus
              totalPriceV2 { amount currencyCode }
              subtotalPriceV2 { amount currencyCode }
              totalShippingPriceV2 { amount currencyCode }
              shippingAddress { ${ADDRESS_FIELDS} }
              lineItems(first: 10) {
                edges { node { ${ORDER_LINE_ITEM_FIELDS} } }
              }
              successfulFulfillments(first: 1) {
                trackingInfo { number url }
                fulfillmentLineItems(first: 5) {
                  edges { node { lineItem { title } } }
                }
              }
            }
          }
        }
      }
    }`,
    { token: accessToken }
  )
  return data?.customer ?? null
}

// ─── Address mutations ────────────────────────────────────────────────────────

export async function customerAddressCreate(
  accessToken: string,
  address: Omit<CustomerAddress, 'id'>
): Promise<{ id: string | null; errors: CustomerUserError[] }> {
  const data = await customerFetch<{
    customerAddressCreate: {
      customerAddress: { id: string } | null
      customerUserErrors: CustomerUserError[]
    }
  }>(
    `mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
      customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
        customerAddress { id }
        customerUserErrors { field message }
      }
    }`,
    { customerAccessToken: accessToken, address }
  )
  return {
    id:     data?.customerAddressCreate?.customerAddress?.id ?? null,
    errors: data?.customerAddressCreate?.customerUserErrors ?? [],
  }
}

export async function customerAddressUpdate(
  accessToken: string,
  addressId: string,
  address: Omit<CustomerAddress, 'id'>
): Promise<CustomerUserError[]> {
  const data = await customerFetch<{
    customerAddressUpdate: { customerUserErrors: CustomerUserError[] }
  }>(
    `mutation customerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
      customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
        customerUserErrors { field message }
      }
    }`,
    { customerAccessToken: accessToken, id: addressId, address }
  )
  return data?.customerAddressUpdate?.customerUserErrors ?? []
}

export async function customerAddressDelete(
  accessToken: string,
  addressId: string
): Promise<CustomerUserError[]> {
  const data = await customerFetch<{
    customerAddressDelete: { customerUserErrors: CustomerUserError[] }
  }>(
    `mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
      customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
        customerUserErrors { field message }
      }
    }`,
    { customerAccessToken: accessToken, id: addressId }
  )
  return data?.customerAddressDelete?.customerUserErrors ?? []
}

export async function customerDefaultAddressUpdate(
  accessToken: string,
  addressId: string
): Promise<CustomerUserError[]> {
  const data = await customerFetch<{
    customerDefaultAddressUpdate: { customerUserErrors: CustomerUserError[] }
  }>(
    `mutation customerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
      customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
        customerUserErrors { field message }
      }
    }`,
    { customerAccessToken: accessToken, addressId }
  )
  return data?.customerDefaultAddressUpdate?.customerUserErrors ?? []
}

// ─── Profile update ───────────────────────────────────────────────────────────

export async function customerUpdate(
  accessToken: string,
  input: { firstName?: string; lastName?: string; email?: string; phone?: string }
): Promise<CustomerUserError[]> {
  const data = await customerFetch<{
    customerUpdate: { customerUserErrors: CustomerUserError[] }
  }>(
    `mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customerUserErrors { field message }
      }
    }`,
    { customerAccessToken: accessToken, customer: input }
  )
  return data?.customerUpdate?.customerUserErrors ?? []
}
