import util from "util";
import { basicProgramToProgram, parse, parseBasic } from "../src/parser";

/* eslint-env jest */

// Make console.log pretty-print by default
const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

describe("parse", () => {
    it("Basic parsing", () => {
        expect(parseBasic("x y")).toEqual(["x", "y"]);
        expect(parseBasic("x y z w")).toEqual(["x", "y", "z", "w"]);
        expect(parseBasic("x (y (z w))")).toEqual(["x", ["y", ["z", "w"]]]);
        expect(parseBasic("(x y) z w")).toEqual([["x", "y"], "z", "w"]);
        expect(parseBasic("x (y z) w")).toEqual(["x", ["y", "z"], "w"]);

        expect(parseBasic("lambda x.x y")).toEqual({
            type: "lambda",
            var: "x",
            body: ["x", "y"],
        });
        expect(parseBasic("(\\x.x) \\x.x")).toEqual([
            {
                type: "lambda",
                var: "x",
                body: "x",
            },
            {
                type: "lambda",
                var: "x",
                body: "x",
            },
        ]);
    });

    it("Parse comments", () => {
        expect(parseBasic("//abc\nx y")).toEqual(["x", "y"]);
        expect(parseBasic("//abc\n//abc\nx y//abc")).toEqual(["x", "y"]);
        expect(parseBasic("//abc\n//abc\nx y\n\n//abc")).toEqual(["x", "y"]);

        expect(parseBasic("lambda x.\n//abc\nx y")).toEqual({
            type: "lambda",
            var: "x",
            body: ["x", "y"],
        });
    });
    it.skip("Parse comments in weird places", () => {
        expect(parseBasic("(\\x.x//abc\n) \\x\n\n//fun\n//times\n.x")).toEqual([
            {
                type: "lambda",
                var: "x",
                body: "x",
            },
            {
                type: "lambda",
                var: "x",
                body: "x",
            },
        ]);
    });

    it("Program parsing", () => {
        expect(basicProgramToProgram(parseBasic("x y"))).toEqual({
            type: "application",
            body: [
                { type: "name", val: "x" },
                { type: "name", val: "y" },
            ],
        });
        expect(basicProgramToProgram(parseBasic("\\x.x y"))).toEqual({
            type: "lambda",
            body: {
                type: "application",
                body: [
                    { type: "name", val: "x" },
                    { type: "name", val: "y" },
                ],
            },
            var: { type: "name", val: "x" },
        });
        expect(basicProgramToProgram(parseBasic("(\\x.x y) x"))).toEqual({
            type: "application",
            body: [
                {
                    type: "lambda",
                    body: {
                        type: "application",
                        body: [
                            { type: "name", val: "x" },
                            { type: "name", val: "y" },
                        ],
                    },
                    var: { type: "name", val: "x" },
                },
                { type: "name", val: "x" },
            ],
        });
    });

    it("Variable binding", () => {
        expect(parse("x y")).toEqual({
            type: "application",
            body: [
                { type: "name", val: "x" },
                { type: "name", val: "y" },
            ],
        });
        expect(parse("\\x.x y")).toEqual({
            type: "lambda",
            body: {
                type: "application",
                body: [
                    { type: "name", val: "x", boundName: 1 },
                    { type: "name", val: "y" },
                ],
            },
            var: { type: "name", val: "x", boundName: 1 },
        });
        expect(parse("(\\x.x y) x")).toEqual({
            type: "application",
            body: [
                {
                    type: "lambda",
                    body: {
                        type: "application",
                        body: [
                            { type: "name", val: "x", boundName: 1 },
                            { type: "name", val: "y" },
                        ],
                    },
                    var: { type: "name", val: "x", boundName: 1 },
                },
                { type: "name", val: "x" },
            ],
        });
        expect(parse("\\x.(\\x.x y) x (\\x.x) x")).toEqual({
            type: "lambda",
            body: {
                type: "application",
                body: [
                    {
                        type: "lambda",
                        body: {
                            type: "application",
                            body: [
                                { boundName: 2, type: "name", val: "x" },
                                { type: "name", val: "y" },
                            ],
                        },
                        var: { boundName: 2, type: "name", val: "x" },
                    },
                    { boundName: 1, type: "name", val: "x" },
                    {
                        type: "lambda",
                        body: { boundName: 3, type: "name", val: "x" },
                        var: { boundName: 3, type: "name", val: "x" },
                    },
                    { boundName: 1, type: "name", val: "x" },
                ],
            },
            var: { boundName: 1, type: "name", val: "x" },
        });
    });
});
