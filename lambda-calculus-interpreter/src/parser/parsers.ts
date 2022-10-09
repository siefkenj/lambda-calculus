// This file needs to be here because typescript does not know how to use babel's transpiler
// to directly load Pegjs grammars.
// @ts-nocheck
import _LambdaCalcPegParser from "./grammars/lambda-calc.pegjs";

type PegParser = {
    parse: (input: string | unknown[], options?: unknown) => any;
    SyntaxError: (
        message: string,
        expected: string,
        found: unknown,
        location: unknown
    ) => unknown;
};

const LambdaCalcPegParser = _LambdaCalcPegParser as PegParser;

export { LambdaCalcPegParser };
