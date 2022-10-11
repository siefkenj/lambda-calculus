import { Action, Computed, Thunk } from "easy-peasy";
import { Program } from "lambda-calculus-interpreter";
import { ParseError } from "../worker/errors";

type ParsedBundle = { canonical: string; direct: string; raw: string };
export interface StoreModel {
    editorText: string;
    setEditorText: Action<StoreModel, string>;
    editorChange: Thunk<StoreModel, string>;
    parseError: ParseError | string | null;
    setParseError: Action<StoreModel, ParseError | string | null>;
    currentProgram: Program;
    setCurrentProgram: Action<StoreModel, Program>;
    parsed: ParsedBundle;
    setParsed: Action<StoreModel, Partial<ParsedBundle>>;
    evaluated: Program;
    evaluatedData:  Computed<StoreModel, ParsedBundle>;
    setEvaluated: Action<StoreModel, Program>;
    evaluate: Thunk<StoreModel, void>;
    evaluateError: string | null;
    setEvaluateError: Action<StoreModel, string | null>;
}
