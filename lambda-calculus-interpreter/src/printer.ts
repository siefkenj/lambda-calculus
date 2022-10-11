import { canonicalRename, deShadowNames } from "./deshadow";
import { Expression, Lambda, Name, Program } from "./parser/types";

const UNICODE_SUBSCRIPT = "₀₁₂₃₄₅₆₇₈₉".split("");
/**
 * Prints a number as subscript unicode characters.
 */
function printSubscript(n: number): string {
    return String(n)
        .split("")
        .map((d) => {
            const di = Number(d);
            if (di >= 0) {
                return UNICODE_SUBSCRIPT[di];
            }
            throw new Error(
                `This function can only be used to print integers, not "${d}"`
            );
        })
        .join("");
}

/**
 * Print a program to a string making no effort to ensure it will parse again to the same program
 * (i.e., some variables will clash may.)
 */
export function printDirect(prog: Program): string {
    switch (prog.type) {
        case "empty_program":
            return "";
        case "name":
            return prog.val;
        case "application":
            return prog.body
                .map((p) => {
                    const body = printDirect(p);
                    if (p.type === "lambda" || p.type === "application") {
                        return `(${body})`;
                    }
                    return body;
                })
                .join(" ");
        case "lambda":
            return `λ${printDirect(prog.var)}.${printDirect(prog.body)}`;
    }
}

/**
 * Return the variables in a program in the order that they occur. Free variables
 * are always listed. Bound variables are only listed the first time they occur.
 */
export function getVars(prog: Program): Name[] {
    if (prog.type === "empty_program") {
        return [];
    }

    const boundVars: Set<number | undefined> = new Set();

    // First we get all the bound vars. Since we may be parsing a sub expression,
    // we cannot rely on `boundName` to determine if a var is free or not.
    function getBoundVars(expr: Expression) {
        switch (expr.type) {
            case "name":
                break;
            case "lambda":
                if (expr.var.boundName) {
                    boundVars.add(expr.var.boundName);
                }
                getBoundVars(expr.body);
                break;
            case "application":
                if (Array.isArray(expr.body)) {
                    expr.body.forEach((e) => getBoundVars(e));
                } else {
                    getBoundVars(expr);
                }
        }
    }
    getBoundVars(prog);

    function _getVars(expr: Expression): Name[] {
        switch (expr.type) {
            case "name":
                if (expr.boundName == null || !boundVars.has(expr.boundName)) {
                    // In this case, we have a free variable, which is always returned
                    return [{ ...expr, freeInScope: true }];
                }
                return [];
            case "lambda":
                return [expr.var].concat(_getVars(expr.body));
            case "application":
                return expr.body
                    .filter(
                        (p) => p.type !== "name" || !boundVars.has(p.boundName)
                    )
                    .flatMap((p) => _getVars(p));
        }
    }
    return _getVars(prog);
}

/**
 * Print the program. All bound variables are given unique subscripts.
 */
export function print(prog: Program): string {
    switch (prog.type) {
        case "empty_program":
            return "";
        case "name":
            return printNameWithSubscript(prog);
        case "lambda":
            return `λ${print(prog.var)}.${print(prog.body)}`;
        case "application":
            return prog.body
                .map((p) => {
                    const body = print(p);
                    if (p.type === "lambda" || p.type === "application") {
                        return `(${body})`;
                    }
                    return body;
                })
                .join(" ");
    }
}

function printNameWithSubscript(n: Name): string {
    return n.boundName != null
        ? n.val + printSubscript(Number(n.boundName))
        : n.val;
}

/**
 * Prints a `Name` object in a non-ambiguous way.
 */
function printMangledName(n: Name): string {
    return `${n.val}|${n.boundName}`;
}

/**
 * Find the next unused name by taking the base name an applying subscripts if needed.
 */
function getNextUnusedName(n: Name, usedNames: Set<string>): string {
    let i = 0;
    let newName: Name = {
        type: "name",
        val: n.val,
        boundName: undefined,
    };
    while (usedNames.has(printNameWithSubscript(newName))) {
        i++;
        newName.boundName = i;
    }
    return printNameWithSubscript(newName);
}

/**
 * Print a program with a minimal amount of variable renaming (only what is required to keep variable names from clashing).
 */
export function printMinimal(prog: Program): string {
    if (prog.type === "empty_program") {
        return "";
    }

    // Free variables should keep their names
    const freeVars = getVars(prog).filter((v) => v.freeInScope === true);

    function _printMinimal(
        expr: Expression,
        state: {
            usedInScope: Set<string>;
            renameMap: Map<string, string>;
        }
    ): string {
        switch (expr.type) {
            case "name": {
                const mangledName = printMangledName(expr);
                let desiredName = state.renameMap.get(mangledName);
                if (desiredName) {
                    return desiredName;
                }
                // If we have aren't in the rename map, we are a free variable.
                // In that case, we need to pick a unique name and also save that name in case we come up again in the future.
                desiredName = getNextUnusedName(expr, state.usedInScope);
                state.usedInScope.add(desiredName);
                state.renameMap.set(mangledName, desiredName);
                return desiredName;
            }
            case "lambda": {
                // The variable of a lambda expression should be made clearly different
                // in cases where it is strictly not necessary. For example `\x.\x.x` should
                // become `\x.\x1.x1` even thought it is not strictly necessary.
                const mangledName = printMangledName(expr.var);
                const targetName = getNextUnusedName(
                    expr.var,
                    state.usedInScope
                );
                state.usedInScope.add(targetName);
                state.renameMap.set(mangledName, targetName);
                const ret = `λ${_printMinimal(expr.var, state)}.${_printMinimal(
                    expr.body,
                    state
                )}`;
                state.usedInScope.delete(targetName);
                state.renameMap.delete(mangledName);
                return ret;
            }
            case "application":
                return expr.body
                    .map((p) => {
                        const body = _printMinimal(p, state);
                        if (p.type === "lambda" || p.type === "application") {
                            return `(${body})`;
                        }
                        return body;
                    })
                    .join(" ");
        }
    }

    return _printMinimal(prog, {
        usedInScope: new Set(freeVars.map((v) => v.val)),
        renameMap: new Map(freeVars.map((v) => [printMangledName(v), v.val])),
    });
}

/**
 * Print a program in a canonical form. If two programs are structurally equal, their
 * canonical prints will be the same.
 */
export function canonicalPrint(prog: Program): string {
    if (prog.type === "empty_program") {
        return "";
    }

    prog = canonicalRename(prog) as Expression;
    return print(prog);
}

export { canonicalRename };
