/**
 * Utility functions for formatting prices to handle BigInt and floating-point precision issues
 */

/**
 * Safely converts a price value (BigInt or number) to a clean integer
 */
export function safePriceToNumber(price: number | bigint | string): number {
  if (typeof price === "bigint") {
    return Number(price);
  }
  if (typeof price === "string") {
    return parseInt(price, 10);
  }
  // For numbers, round to remove floating-point precision issues
  return Math.round(price);
}

/**
 * Formats a price value for display with proper locale formatting
 */
export function formatPrice(
  price: number | bigint | string,
  currency: string = "KES"
): string {
  const cleanPrice = safePriceToNumber(price);
  return `${currency} ${cleanPrice.toLocaleString()}`;
}

/**
 * Formats a price value for display without currency symbol
 */
export function formatPriceNumber(price: number | bigint | string): string {
  const cleanPrice = safePriceToNumber(price);
  return cleanPrice.toLocaleString();
}

/**
 * Gets the minimum price from an array of prices
 */
export function getMinPrice(prices: (number | bigint)[]): number {
  return Math.min(...prices.map(safePriceToNumber));
}

/**
 * Gets the maximum price from an array of prices
 */
export function getMaxPrice(prices: (number | bigint)[]): number {
  return Math.max(...prices.map(safePriceToNumber));
}
