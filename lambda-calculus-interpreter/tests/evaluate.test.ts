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
    printMinimal,
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
        expect(print(evaluate(prog))).toEqual("λx₁.x₁");

        prog = parse("((\\y.\\x.x y) a) b");
        expect(print(evaluate(prog))).toEqual("b a");

        prog = parse("(\\t.\\r.r t) a b");
        expect(print(evaluate(prog))).toEqual("b a");
    });
    it("Advanced evaluation", () => {
        let prog: Program;
        prog = parse(`(λAdd.λ2.λ3.
            Add 2 3
        )
        (λa.λb.a (λn.λf.λx.f (n f x)) b)
        (λf.λx.f (f x))
        (λf.λx.f (f (f x)))`);

        expect(printMinimal(evaluate(prog))).toEqual(
            "λf.λx.f (f (f (f (f x))))"
        );
    });
    it("Avoid pitfalls of shadowed variables", () => {
        let prog: Program;
        prog = parse("(λx.x x) (λa.λb.a) A");
        // When executing, this becomes `(λb.λa.λb.a) A`
        // This shouldn't cause a problem if both b's are differentiated.
        expect(canonicalPrint(evaluate(prog))).toEqual("λt₁.λt₂.t₁");
    });
    it("Avoids infinite loop when evaluating expressions with free variables", () => {
        let prog: Program;
        prog = parse("(a b) c");
        expect(print(evaluate(prog))).toEqual("(a b) c");

        prog = parse("λN.(λ succ.succ (succ N)) (λn.λf.λx.f (n f x))");
        expect(canonicalPrint(evaluate(prog))).toEqual(
            "λt₁.λt₂.λt₃.t₂ (t₂ (t₁ t₂ t₃))"
        );

        prog = parse(String.raw`((λf.λ tup.(
            (λTup.λT.λF.λIf.
            
            (Tup F (If (tup T) (tup F) (f (tup F))))
              
            )
            (λa.λb.λ bool.bool a b)
            (λa.λb.a)
            (λa.λb.b)
            (λ bool.λ a.λ b.bool a b)
          ))
          
          )
          f
          ((λa.λb.λ bool.bool a b) (λa.λb.a) A)`);
        expect(printMinimal(evaluate(prog))).toEqual("λbool.bool (λa.λb.b) A");
    });
});
