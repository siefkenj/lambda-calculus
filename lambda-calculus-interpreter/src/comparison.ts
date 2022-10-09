import { Program } from "./parser/types";
import { canonicalPrint } from "./printer";

/**
 * Determines if two programs are structurally equal (i.e., they are equal up to a renaming of bound variables).
 */
export function structEq(p1: Program, p2: Program): boolean {
    return canonicalPrint(p1) === canonicalPrint(p2);
}
