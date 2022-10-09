import { LambdaCalcPegParser } from "./parsers";
import { BasicProgram, Expression, Lambda, Program } from "./types";

/**
 * Parse a string into a basic program
 */
export function parseBasic(code: string) {
    return LambdaCalcPegParser.parse(code) as BasicProgram;
}

/**
 * Convert a `BasicProgram` into a `Program`.
 */
export function basicProgramToProgram(basicProg: BasicProgram): Program {
    if (basicProg == null) {
        return { type: "empty_program" };
    }
    if (Array.isArray(basicProg)) {
        if (basicProg.length === 0) {
            throw new Error(`Expected an application to have 1 or more items`);
        }
        if (basicProg.length === 1) {
            return basicProgramToProgram(basicProg[0]);
        }
        return {
            type: "application",
            body: basicProg.map((p) => basicProgramToProgram(p) as Expression),
        };
    }
    if (typeof basicProg === "string") {
        return { type: "name", val: basicProg };
    }
    if (basicProg.type === "lambda") {
        return {
            type: "lambda",
            var: { type: "name", val: basicProg.var },
            body: basicProgramToProgram(basicProg.body) as Expression,
        };
    }
    throw new Error(
        `Don't know how to convert program ${JSON.stringify(basicProg)}`
    );
}

/**
 * Ensure all bound variables have unique names so that evaluation will not cause
 * any name collisions.
 */
export function bindProgramVars(
    prog: Program,
    boundVars: { vars: Record<string, number[]>; count: number } = {
        vars: {},
        count: 0,
    }
): Program {
    switch (prog.type) {
        case "empty_program":
            return prog;
        case "name":
            if (prog.boundName != null) {
                return prog;
            } else {
                const bound = boundVars.vars[prog.val];
                if (bound && bound.length > 0) {
                    const id = bound[bound.length - 1];
                    return { ...prog, boundName: id };
                } else {
                    return prog;
                }
            }
        case "application":
            return {
                type: "application",
                body: prog.body.map(
                    (x) => bindProgramVars(x, boundVars) as Expression
                ),
            };
        case "lambda": {
            boundVars.count++;
            const varCount = boundVars.count;
            boundVars.vars[prog.var.val] = boundVars.vars[prog.var.val] || [];
            const boundStack = boundVars.vars[prog.var.val];
            boundStack.push(varCount);
            const ret: Lambda = {
                type: "lambda",
                var: { ...prog.var, boundName: varCount },
                body: bindProgramVars(prog.body, boundVars) as Expression,
            };
            // Bound variables go in and out of scope, so make sure to remove the binding when
            // we finish processing the lambda.
            boundStack.pop();
            return ret;
        }
    }
    throw new Error(`Unknown program type ${JSON.stringify(prog)}`);
}

/**
 * Parse a string into a lambda calculus `Program`.
 */
export function parse(code: string): Program {
    return bindProgramVars(basicProgramToProgram(parseBasic(code)));
}
