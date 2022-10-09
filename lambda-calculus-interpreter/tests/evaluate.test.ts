import util from "util";
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

describe("evaluate", () => {
    it("Can evaluate", () => {
        let prog: Program;
        prog = parse("x");
        expect(print(evaluate(prog))).toEqual("x");

        prog = parse("(\\x.x) y");
        expect(print(evaluate(prog))).toEqual("y");

        prog = parse("(\\x.x) (\\x.x)");
        expect(print(evaluate(prog))).toEqual("λx₂.x₂");
        
        prog = parse("((\\y.\\x.x y) a) b");
        expect(print(evaluate(prog))).toEqual("b a");
        
        prog = parse("(\\t.\\r.r t) a b");
        expect(print(evaluate(prog))).toEqual("b a");
    });
    it("Avoids infinite loop when evaluating expressions with free variables", ()=>{
        let prog:Program;
        prog = parse("(a b) c")
        expect(print(evaluate(prog))).toEqual("(a b) c")
    })
});
