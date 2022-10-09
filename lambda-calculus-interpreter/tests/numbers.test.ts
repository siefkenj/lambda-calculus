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

        //console.log(print(a([p1,p1,p1])))

        //let x = parse("(λa₆.b a₆) (λf₄.λx₅.x₅ z) x")
        //x = parse("λa.((λf.λx.x) z)")
        //console.log(print(x), print(evaluate(x)))

        //return
        let zero = parse("\\f.\\x.x");
        console.log("zero", print(zero));
        let one = parse("\\f.\\x.f x");
        console.log("one", print(one));

        let succ = parse("\\h.\\f.\\x.f (h f x)");
        console.log("succ", print(succ));
        console.log(
            "succ zero",
            print(evaluate(parse("(\\h.\\f.\\x.f (h f x)) (\\f.\\x.x)")))
        );
        console.log("succ zero", canonicalPrint(evaluate(a([succ, a([succ, one])]))));
    });
});
