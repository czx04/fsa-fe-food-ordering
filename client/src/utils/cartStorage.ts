export interface CartOption {
  groupName: string
  optionName: string
  priceDelta: number
}

export interface StoredCartItem {
  key: string
  itemId: string
  name: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  note: string
  options: CartOption[]
}

export interface StoredCart {
  restaurantId: string
  restaurantName: string
  restaurantSlug: string
  items: StoredCartItem[]
}

export interface CartRestaurant {
  id: string
  name: string
  slug: string
}

export interface NewCartItem {
  itemId: string
  name: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  note?: string
  options?: CartOption[]
}

export const CART_STORAGE_KEY = 'mammamCart'

const createItemKey = (item: Pick<NewCartItem, 'itemId' | 'note' | 'options'>) => {
  const optionKey = (item.options ?? [])
    .map((option) => `${option.groupName}:${option.optionName}`)
    .sort()
    .join('|')
  return `${item.itemId}::${item.note?.trim() ?? ''}::${optionKey}`
}

export const readStoredCart = (): StoredCart | null => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredCart
    if (!parsed.restaurantId || !Array.isArray(parsed.items)) return null
    return {
      ...parsed,
      items: parsed.items.map((item) => ({
        ...item,
        key: item.key || createItemKey(item),
        note: item.note ?? '',
        options: item.options ?? [],
      })),
    }
  } catch {
    return null
  }
}

export const writeStoredCart = (cart: StoredCart) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  window.dispatchEvent(new CustomEvent('mammam-cart-updated', { detail: cart }))
}

export const isDifferentRestaurant = (cart: StoredCart | null, restaurantId: string) =>
  Boolean(cart && cart.items.length > 0 && cart.restaurantId !== restaurantId)

export const addStoredCartItem = (
  currentCart: StoredCart | null,
  restaurant: CartRestaurant,
  newItem: NewCartItem,
  replaceDifferentRestaurant = false
) => {
  if (isDifferentRestaurant(currentCart, restaurant.id) && !replaceDifferentRestaurant) {
    return currentCart as StoredCart
  }
  const shouldCreateCart =
    !currentCart ||
    currentCart.restaurantId !== restaurant.id
  const cart: StoredCart = shouldCreateCart
    ? {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantSlug: restaurant.slug,
        items: [],
      }
    : { ...currentCart, items: [...currentCart.items] }
  const normalizedItem: StoredCartItem = {
    ...newItem,
    key: createItemKey(newItem),
    note: newItem.note?.trim() ?? '',
    options: newItem.options ?? [],
  }
  const existing = cart.items.find((item) => item.key === normalizedItem.key)
  if (existing) existing.quantity += normalizedItem.quantity
  else cart.items.push(normalizedItem)
  writeStoredCart(cart)
  return cart
}

export const changeStoredCartQuantity = (cart: StoredCart, itemKey: string, delta: number) => {
  const nextItems = cart.items
    .map((item) =>
      item.key === itemKey ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    )
    .filter((item) => item.quantity > 0)
  const nextCart = { ...cart, items: nextItems }
  writeStoredCart(nextCart)
  return nextCart
}
