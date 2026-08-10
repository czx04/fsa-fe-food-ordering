export const SERVER_STATIC_ASSET_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : "http://localhost:3000";

const S3_SEED_DISH_BASE_URL =
  "https://s3.ap-southeast-2.amazonaws.com/mudhub.nox/products/food-ordering-seed/v1/dishes";

export const DEFAULT_DISH_IMAGE_URL = `${S3_SEED_DISH_BASE_URL}/pho-bo.webp`;
export const DEFAULT_RESTAURANT_IMAGE_URL = `${S3_SEED_DISH_BASE_URL}/mam-com.webp`;
export const HOME_PROMOTION_IMAGE_URL = `${S3_SEED_DISH_BASE_URL}/com-rang.webp`;

export const resolveAssetUrl = (
  url: string | null | undefined,
  fallback: string,
): string => {
  const value = url || fallback;
  if (/^(?:https?:)?\/\//i.test(value) || /^(?:data|blob):/i.test(value)) {
    return value;
  }

  return `${SERVER_STATIC_ASSET_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};
