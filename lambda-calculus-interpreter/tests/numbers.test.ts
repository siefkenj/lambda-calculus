import util from "util";
import { a } from "../src/builder";
import { structEq } from "../src/comparison";
import { evaluate } from "../src/evaluator";
import { basicProgramToProgram, parse, parseBasic } from "../src/parser";
import { Program } from "../src/parser/types";
import {
    canonicalPrint,
    canonicalRename,
    getVars,
    print,
    printDirect,
} from "../src/printer";

/* eslint-env jest */

// Make console.log pretty-print by default
const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

describe.only("numbers", () => {
    it("Can compare numbers", () => {
        let p1: Program, p2: Program;
        p1 = parse("\\x.x");
        p2 = parse("\\y.y");

        expect(print(p1) === print(p2)).toBeFalsy();
        expect(structEq(p1, p2)).toBeTruthy();
    });
});
