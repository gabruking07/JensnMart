/** Small shared frontend utility functions used by components. */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combines conditional class names and merges conflicting Tailwind utilities. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}