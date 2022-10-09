import { bindProgramVars, parse } from "./parser";
import { Application, Expression, Name, Program } from "./parser/types";
import { print } from "./printer";

/**
 * Create an `Application` out of the array of args.
 */
export function a(args: Program[]): Application {
    if (args.length === 0) {
        throw new Error(`Cannot create an empty Application`);
    }
    if (args.some((p) => p.type === "empty_program")) {
        throw new Error(
            `Cannot create an application involving the empty program`
        );
    }
    //// This application is a new program, so we need to rebind all the program vars.
    //const boundVars: { vars: Record<string, number[]>; count: number } = {
    //    vars: {},
    //    count: 0,
    //}
    //const body = args.map(p => bindProgramVars(p, boundVars))

    return parse(
        print({ type: "application", body: args as Expression[] })
    ) as Application;
}
