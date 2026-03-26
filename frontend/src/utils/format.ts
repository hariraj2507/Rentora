/**
 * Formats a number as an Indian Rupee (INR) currency string.
 * Example: 100000 -> ₹1,00,000
 */
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
