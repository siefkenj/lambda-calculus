import { Application, Expression, Lambda, Name, Program } from "./parser/types";

export function mangleName(n: Name): string {
    return `${n.val}|${n.boundName}`;
}

/**
 * Get the next available name for a variable that is distinct from all (mangled) names in `existingMangledNames`
 */
function getNextUnusedName(n: Name, existingMangledNames: Set<string>): Name {
    if (!existingMangledNames.has(mangleName(n))) {
        return n;
    }
    const ret: Name = { ...n, boundName: n.boundName ?? 1 };
    while (existingMangledNames.has(mangleName(ret))) {
        ret.boundName! += 1;
    }

    return ret;
}

/**
 * Rename all variables so that they have unique names. Free variables are not renamed and name collisions
 * with free variables are avoided.
 */
export function deShadowNames<T extends Program>(prog: T): T {
    if (prog.type === "empty_program") {
        return prog;
    }

    const currentlyBound: string[] = [];
    const currentRenameMap: Record<string, Name[]> = {};
    const freeVars = getFreeVariables(prog);
    const usedNames: Set<string> = new Set(freeVars.map((v) => mangleName(v)));

    function walk<S extends Expression>(expr: S): S {
        switch (expr.type) {
            case "name": {
                const mangled = mangleName(expr);
                // A name that is currently bound gets renamed as per the existing mapping.
                // If a variable is currently bound, it should have a valid renaming.
                if (currentlyBound.includes(mangled)) {
                    const renameList = currentRenameMap[mangled] ?? [];
                    const name = renameList[renameList.length - 1];
                    if (name == null) {
                        throw new Error(
                            `The var with mangled name ${mangled} is listed as a bound variable, by entry in the rename map for it was found.`
                        );
                    }
                    return { ...name } as S;
                }
                return expr;
            }
            case "lambda": {
                const mangled = mangleName(expr.var);
                currentlyBound.push(mangled);
                // We set up a rename map so that any sub-occurrences of this name get renamed appropriately.
                const newName = getNextUnusedName(expr.var, usedNames);
                usedNames.add(mangleName(newName));
                currentRenameMap[mangled] = currentRenameMap[mangled] || [];
                currentRenameMap[mangled].push(newName);

                const ret: Lambda = {
                    type: "lambda",
                    var: newName,
                    body: walk(expr.body),
                };

                currentRenameMap[mangled].pop();
                currentlyBound.pop();
                return ret as S;
            }
            case "application": {
                const ret: Application = {
                    type: "application",
                    body: expr.body.map((p) => walk(p)),
                };
                return ret as S;
            }
        }
    }

    return walk(prog) as T;
}

export function getFreeVariables(prog: Program): Name[] {
    if (prog.type === "empty_program") {
        return [];
    }

    const ret: Name[] = [];
    const retMangled: Set<string> = new Set();
    const currentlyBound: string[] = [];

    function walk(expr: Expression) {
        switch (expr.type) {
            case "name": {
                const mangled = mangleName(expr);
                // A name that is not bound and is not already in the free-vars list gets added to the list.
                if (
                    !currentlyBound.includes(mangled) &&
                    !retMangled.has(mangled)
                ) {
                    ret.push(expr);
                    retMangled.add(mangled);
                }
                return;
            }
            case "lambda":
                currentlyBound.push(mangleName(expr.var));
                walk(expr.body);
                currentlyBound.pop();
                return;
            case "application":
                expr.body.forEach((p) => walk(p));
                return;
        }
    }

    walk(prog);

    return ret;
}

/**
 * Rename all variables so that they have unique names starting from the provided index.
 * By default, all variables are renamed `t`.
 * Free variables are not renamed and name collisions with free variables are avoided.
 */
export function canonicalRename<T extends Program>(
    prog: T,
    settings: { replaceNameWithT?: boolean; startIndex?: number } = {}
): T {
    if (prog.type === "empty_program") {
        return prog;
    }
    const { replaceNameWithT = true, startIndex = 1 } = settings;

    const currentlyBound: string[] = [];
    const currentRenameMap: Record<string, Name[]> = {};
    const freeVars = getFreeVariables(prog);
    const usedNames: Set<string> = new Set(freeVars.map((v) => mangleName(v)));

    let currentVarIndex = startIndex;

    function walk<S extends Expression>(expr: S): S {
        switch (expr.type) {
            case "name": {
                const mangled = mangleName(expr);
                // A name that is currently bound gets renamed as per the existing mapping.
                // If a variable is currently bound, it should have a valid renaming.
                if (currentlyBound.includes(mangled)) {
                    const renameList = currentRenameMap[mangled] ?? [];
                    const name = renameList[renameList.length - 1];
                    if (name == null) {
                        throw new Error(
                            `The var with mangled name ${mangled} is listed as a bound variable, by entry in the rename map for it was found.`
                        );
                    }
                    return { ...name } as S;
                }
                return expr;
            }
            case "lambda": {
                const mangled = mangleName(expr.var);
                currentlyBound.push(mangled);
                // We set up a rename map so that any sub-occurrences of this name get renamed appropriately.
                const newName = getNextUnusedName(
                    {
                        type: "name",
                        val: replaceNameWithT ? "t" : expr.var.val,
                        boundName: currentVarIndex,
                    },
                    usedNames
                );
                usedNames.add(mangleName(newName));
                currentRenameMap[mangled] = currentRenameMap[mangled] || [];
                currentRenameMap[mangled].push(newName);
                currentVarIndex++;

                const ret: Lambda = {
                    type: "lambda",
                    var: newName,
                    body: walk(expr.body),
                };

                currentRenameMap[mangled].pop();
                currentlyBound.pop();
                return ret as S;
            }
            case "application": {
                const ret: Application = {
                    type: "application",
                    body: expr.body.map((p) => walk(p)),
                };
                return ret as S;
            }
        }
    }

    return walk(prog) as T;
}
