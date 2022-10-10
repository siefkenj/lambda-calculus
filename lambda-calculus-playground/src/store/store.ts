import { action, createStore, thunk } from "easy-peasy";
import { canonicalPrint, printMinimal } from "lambda-calculus-interpreter";
import { isParseError } from "../worker/errors";
import { parsingWorker } from "../worker/worker-wrapper";
import { StoreModel } from "./model";

export const store = createStore<StoreModel>({
    currentProgram: { type: "empty_program" },
    editorText: "",
    parseError: null,
    setEditorText: action((state, payload) => {
        state.editorText = payload;
    }),
    editorChange: thunk(async (actions, payload) => {
        actions.setEditorText(payload);
        try {
            const parsed = await parsingWorker.parse(payload);
            actions.setParseError(null);
            actions.setCurrentProgram(parsed);
            actions.setParsed({
                canonical: canonicalPrint(parsed),
                direct: printMinimal(parsed),
            });
        } catch (e) {
            if (isParseError(e)) {
                actions.setParseError(e);
            } else {
                console.log(e);
                actions.setParseError(String(e));
            }
        }
    }),
    setCurrentProgram: action((state, payload) => {
        state.currentProgram = payload;
    }),
    setParseError: action((state, payload) => {
        state.parseError = payload;
    }),
    parsed: { canonical: "", direct: "", raw: "" },
    setParsed: action((state, payload) => {
        Object.assign(state.parsed, payload);
    }),
    evaluated: { type: "empty_program" },
    evaluatedString: "",
    setEvaluatedString: action((state, payload) => {
        state.evaluatedString = payload;
    }),
    setEvaluated: action((state, payload) => {
        state.evaluated = payload;
    }),
    evaluate: thunk(async (actions, _, { getState }) => {
        const state = getState();
        try {
            const evaluated = await parsingWorker.evaluate(
                state.currentProgram
            );
            actions.setEvaluateError(null);
            actions.setEvaluated(evaluated);
            actions.setEvaluatedString(printMinimal(evaluated));
        } catch (e) {
            actions.setEvaluateError(String(e));
        }
    }),
    evaluateError: null,
    setEvaluateError: action((state, payload) => {
        state.evaluateError = payload;
    }),
});
