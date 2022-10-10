import { Expression, Name, Program } from "./parser/types";

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
    switch (prog.type) {
        case "empty_program":
            return [];
        case "name":
            if (prog.boundName == null) {
                // In this case, we have a free variable, which is always returned
                return [prog];
            }
            return [];
        case "lambda":
            return [prog.var].concat(getVars(prog.body));
        case "application":
            return prog.body
                .filter((p) => p.type !== "name" || p.boundName == null)
                .flatMap((p) => getVars(p));
    }
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
    return n.boundName != null ? n.val + printSubscript(n.boundName) : n.val;
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
    const freeVars = getVars(prog).filter((v) => v.boundName == null);

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

/**
 * Rename all bound variables to be called `t` with a `boundName` given in canonical order.
 */
export function canonicalRename(prog: Program): Program {
    if (prog.type === "empty_program") {
        return prog;
    }

    const vars = getVars(prog);

    // All bound variables need to be reindexed in canonical order,
    // so we build up a renaming map.
    const varRenameMap: number[] = [];
    vars.filter((p) => p.boundName != null).forEach((v, i) => {
        varRenameMap[v.boundName || 0] = i;
    });
    function renameVar(name: Name): Name {
        if (name.boundName == null) {
            return name;
        }
        return {
            type: "name",
            val: "t",
            boundName: varRenameMap[name.boundName || 0] + 1,
        };
    }

    function doRename(prog: Expression): Expression {
        switch (prog.type) {
            case "name":
                return renameVar(prog);
            case "lambda":
                return {
                    type: "lambda",
                    var: renameVar(prog.var),
                    body: doRename(prog.body),
                };
            case "application":
                return {
                    type: "application",
                    body: prog.body.map((p) => doRename(p)),
                };
        }
    }

    return doRename(prog);
}
