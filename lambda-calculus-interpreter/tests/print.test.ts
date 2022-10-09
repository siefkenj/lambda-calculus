import util from "util";
import { basicProgramToProgram, parse, parseBasic } from "../src/parser";
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

describe("print", () => {
    it("Direct printing", () => {
        let prog = parse("\\x.(\\x.x y) x (\\x.x) x");
        expect(printDirect(prog)).toEqual("λx.(λx.x y) x (λx.x) x");
    });
    it("Canonical print", () => {
        let prog = parse("\\x.(\\x.x y) x (\\x.x) x");
        expect(canonicalPrint(prog)).toEqual("λt₁.(λt₂.t₂ y) t₁ (λt₃.t₃) t₁");
        prog = parse("\\a.(\\b.b y) a (\\c.c) a");
        expect(canonicalPrint(prog)).toEqual("λt₁.(λt₂.t₂ y) t₁ (λt₃.t₃) t₁");
    });
});
