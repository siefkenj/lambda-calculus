import util from "util";
import { basicProgramToProgram, parse, parseBasic } from "../src/parser";
import { deShadowNames, getFreeVariables, mangleName } from "../src/deshadow";
import { evaluate } from "../src/evaluator";
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
    it("Can get free variables", () => {
        // x_4 and x_3 are free in this expression. Their name should never change.
        expect(
            getFreeVariables({
                type: "lambda",
                var: { type: "name", val: "x", boundName: 5 },
                body: {
                    type: "application",
                    body: [
                        { type: "name", val: "x", boundName: 5 },
                        { type: "name", val: "x", boundName: 4 },
                        { type: "name", val: "x", boundName: 3 },
                    ],
                },
            }).map((v) => mangleName(v))
        ).toEqual(["x|4", "x|3"]);
        expect(
            getFreeVariables({
                type: "lambda",
                var: { type: "name", val: "t", boundName: 1 },
                body: {
                    type: "application",
                    body: [
                        { type: "name", val: "t", boundName: 1 },
                        {
                            type: "lambda",
                            var: { type: "name", val: "t", boundName: 1 },
                            body: {
                                type: "application",
                                body: [
                                    { type: "name", val: "t", boundName: 1 },
                                ],
                            },
                        },
                    ],
                },
            })
        ).toEqual([]);
        expect(
            getFreeVariables({
                type: "lambda",
                var: { type: "name", val: "t", boundName: 1 },
                body: {
                    type: "application",
                    body: [
                        {
                            type: "lambda",
                            var: { type: "name", val: "t", boundName: 2 },
                            body: {
                                type: "application",
                                body: [
                                    { type: "name", val: "t", boundName: 2 },
                                ],
                            },
                        },
                        { type: "name", val: "t", boundName: 2 },
                    ],
                },
            }).map((v) => mangleName(v))
        ).toEqual(["t|2"]);
    });
    it("Can get deshadow variables", () => {
        // x_4 and x_3 are free in this expression. Their name should never change.
        expect(
            print(deShadowNames({
                type: "lambda",
                var: { type: "name", val: "x", boundName: 5 },
                body: {
                    type: "application",
                    body: [
                        { type: "name", val: "x", boundName: 5 },
                        { type: "name", val: "x", boundName: 4 },
                        { type: "name", val: "x", boundName: 3 },
                    ],
                },
            }))
        ).toEqual("λx₅.x₅ x₄ x₃");
        expect(
            print(deShadowNames({
                type: "lambda",
                var: { type: "name", val: "t", boundName: 1 },
                body: {
                    type: "application",
                    body: [
                        { type: "name", val: "t", boundName: 1 },
                        {
                            type: "lambda",
                            var: { type: "name", val: "t", boundName: 1 },
                            body: {
                                type: "application",
                                body: [
                                    { type: "name", val: "t", boundName: 1 },
                                ],
                            },
                        },
                    ],
                },
            })
        )).toEqual("λt₁.t₁ (λt₂.t₂)");
        expect(
            print(deShadowNames({
                type: "lambda",
                var: { type: "name", val: "t", boundName: 1 },
                body: {
                    type: "application",
                    body: [
                        {
                            type: "lambda",
                            var: { type: "name", val: "t", boundName: 2 },
                            body: {
                                type: "application",
                                body: [
                                    { type: "name", val: "t", boundName: 2 },
                                ],
                            },
                        },
                        { type: "name", val: "t", boundName: 2 },
                    ],
                },
            }))
        ).toEqual("λt₁.(λt₃.t₃) t₂");
    });
    it("Canonical print free vars", () => {
        // x_4 and x_3 are free in this expression. Their name should never change.
        expect(
            canonicalPrint({
                type: "lambda",
                var: { type: "name", val: "x", boundName: 5 },
                body: {
                    type: "application",
                    body: [
                        { type: "name", val: "x", boundName: 5 },
                        { type: "name", val: "x", boundName: 4 },
                        { type: "name", val: "x", boundName: 3 },
                    ],
                },
            })
        ).toEqual("λt₁.t₁ x₄ x₃");
        expect(
            canonicalPrint({
                type: "lambda",
                var: { type: "name", val: "t", boundName: 5 },
                body: {
                    type: "application",
                    body: [
                        { type: "name", val: "t", boundName: 5 },
                        { type: "name", val: "t", boundName: 2 },
                        { type: "name", val: "t", boundName: 1 },
                    ],
                },
            })
        ).toEqual("λt₃.t₃ t₂ t₁");
        expect(
            print(
                deShadowNames({
                    type: "lambda",
                    var: { type: "name", val: "t", boundName: 1 },
                    body: {
                        type: "application",
                        body: [
                            { type: "name", val: "t", boundName: 1 },
                            {
                                type: "lambda",
                                var: { type: "name", val: "t", boundName: 1 },
                                body: {
                                    type: "application",
                                    body: [
                                        {
                                            type: "name",
                                            val: "t",
                                            boundName: 1,
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                })
            )
        ).toEqual("λt₁.t₁ (λt₂.t₂)");
    });
    it("Minimal print", () => {
        let prog = parse("(\\x.(\\x.x y) x) x");
        expect(printMinimal(prog)).toEqual("(λx₁.(λx₂.x₂ y) x₁) x");
        prog = evaluate(parse("(\\x.(\\x.x y) x)"));
        expect(printMinimal(prog)).toEqual("λx.x y");
    });
});
