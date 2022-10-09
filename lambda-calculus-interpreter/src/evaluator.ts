import { Expression, Name, Program } from "./parser/types";
import { canonicalPrint } from "./printer";

/**
 * Run `prog` until termination.
 */
export function evaluate(prog: Program): Program {
    switch (prog.type) {
        case "name":
        case "empty_program":
            return prog;
        case "lambda":
            return {
                type: "lambda",
                var: prog.var,
                body: evaluate(prog.body) as Expression,
            };
        case "application":
            if (prog.body.length === 0) {
                throw new Error(`Cannot evaluate an empty body`);
            }
            if (prog.body.length === 1) {
                return evaluate(prog.body[0]);
            }
            // There are at least two things to evaluate. We work right-recursively
            // and stop as soon as we encounter a non-lambda expression.
            const func = prog.body[0];
            const arg = prog.body[1];
            switch (func.type) {
                case "name":
                    // We don't start with something that can be evaluated, so we go the "next level down"
                    // and see if any children can be further evaluated.
                    return {
                        type: "application",
                        body: prog.body.map((p) => evaluate(p) as Expression),
                    };
                case "lambda":
                    // Evaluate the right-most expression and recurse
                    return evaluate({
                        type: "application",
                        body: [
                            replaceVar(func.body, func.var, arg),
                            ...prog.body.slice(2),
                        ],
                    });
                case "application":
                    const before = canonicalPrint(func);
                    const evaluatedFunc = evaluate(func);
                    const after = canonicalPrint(evaluatedFunc);
                    // If the value of the application didn't change after
                    // evaluating it, we don't want to recursively call the evaluate function again.
                    // This can happen, for example, if there are free variables in `func` such that
                    // `func` doesn't change. E.g.: `(a b) c`. Upon evaluating `(a b)`, the result is still `(a b)`.
                    if (before === after) {
                        return {
                            type: "application",
                            body: [
                                evaluate(func) as Expression,
                                arg,
                                ...prog.body.slice(2),
                            ],
                        };
                    }
                    return evaluate({
                        type: "application",
                        body: [
                            evaluate(func) as Expression,
                            arg,
                            ...prog.body.slice(2),
                        ],
                    });
            }
    }
}

/**
 * Replace all instances of `oldVar` in `prog` with that of `newVal`.
 *
 * **Note**: It is assumed that `oldVar` does not appear as the variable in a lambda expression.
 */
function replaceVar(
    prog: Expression,
    oldVar: Name,
    newVal: Expression
): Expression {
    function nameMatches(name: Expression) {
        if (name.type !== "name") {
            return false;
        }
        return name.val === oldVar.val && name.boundName === oldVar.boundName;
    }
    switch (prog.type) {
        case "name":
            if (nameMatches(prog)) {
                return newVal;
            } else {
                return prog;
            }
        case "lambda":
            if (nameMatches(prog.var)) {
                throw new Error(
                    `Cannot replace variable ${oldVar} since it appears at the variable name in a lambda`
                );
            }
            return { ...prog, body: replaceVar(prog.body, oldVar, newVal) };
        case "application":
            return {
                type: "application",
                body: prog.body.map((p) => replaceVar(p, oldVar, newVal)),
            };
    }
}
