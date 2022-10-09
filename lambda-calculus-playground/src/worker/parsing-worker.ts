import * as Comlink from "comlink";
import { parse, evaluate } from "lambda-calculus-interpreter";

const exposed = {
    parse: (s: string) => {
        try {
            return parse(s);
        } catch (e: any) {
            if (e.format) {
                throw Object.assign(
                    { desc: String(e), terminalDesc: e.format([{ text: s }]) },
                    e
                );
            }
            throw e;
        }
    },
    evaluate,
};

export type Exposed = typeof exposed;

// We are exporting `void`, but we have to export _something_ to get the module to work correctly
export default Comlink.expose(exposed);
