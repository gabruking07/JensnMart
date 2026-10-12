<<<<<<< HEAD
/** Small shared frontend utility functions used by components. */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combines conditional class names and merges conflicting Tailwind utilities. */
=======
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}