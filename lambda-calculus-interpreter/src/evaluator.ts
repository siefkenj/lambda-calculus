import { canonicalRename } from "./deshadow";
import { Expression, Lambda, Name, Program } from "./parser/types";
import { canonicalPrint,  print } from "./printer";

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
    let largestIndex = largestVarIndex(prog);
    //console.log(
    //    print(oldVar),
    //    print(prog),
    //    print(
    //        canonicalRename(prog, { replaceNameWithT: false, startIndex: 10 })
    //    )
    //);

    function _replaceVar(prog: Expression) {
        switch (prog.type) {
            case "name":
                if (nameMatches(prog)) {
                    const ret = canonicalRename(newVal, {
                        replaceNameWithT: false,
                        startIndex: largestIndex,
                    }) as Expression;
                    largestIndex = Math.max(largestIndex, largestVarIndex(ret));
                    return ret;
                } else {
                    return prog;
                }
            case "lambda": {
                if (nameMatches(prog.var)) {
                    throw new Error(
                        `Cannot replace variable ${print(
                            oldVar
                        )} since it appears as the variable name in the lambda ${print(
                            prog
                        )}`
                    );
                }
                const ret = canonicalRename(
                    { ...prog, body: _replaceVar(prog.body) },
                    {
                        replaceNameWithT: false,
                        startIndex: largestIndex,
                    }
                ) as Expression;
                largestIndex = Math.max(largestIndex, largestVarIndex(ret));
                return ret;
            }
            case "application": {
                const ret = canonicalRename(
                    {
                        type: "application",
                        body: prog.body.map((p) => _replaceVar(p)),
                    },
                    {
                        replaceNameWithT: false,
                        startIndex: largestIndex,
                    }
                ) as Expression;
                largestIndex = Math.max(largestIndex, largestVarIndex(ret));
                return ret;
            }
        }
    }

    return _replaceVar(prog);
}

/**
 * Get the largest index of a variable used inside of the program.
 */
function largestVarIndex(prog: Program): number {
    switch (prog.type) {
        case "empty_program":
            return 0;
        case "name":
            return prog.boundName || 0;
        case "lambda":
            return Math.max(
                largestVarIndex(prog.var),
                largestVarIndex(prog.body)
            );
        case "application":
            if (Array.isArray(prog.body)) {
                return Math.max(...prog.body.map((p) => largestVarIndex(p)));
            }
            return largestVarIndex(prog.body);
    }
}
