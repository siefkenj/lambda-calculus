import fs from "node:fs/promises";
import path from "node:path";
import { buildParserFile } from "@lezer/generator";

const convertMessage = ({ message, location, code, filename }) => {
    location = {
        file: filename,
        line: location.start.line - 1,
        column: location.start.column,
        length: location.end.offset - location.start.offset,
        lineText: code,
    };
    return { text: message, location };
};

/**
 * `esbuild` plugin to load .grammar files.
 * Code modified from
 * https://github.com/nota-lang/nota/blob/640d46599623a5ff093f088f934803e32260d302/packages/esbuild-lezer/lib/index.ts
 */
export const lezerLoader = (options = {}) => ({
    name: "lezer-loader",
    setup(build) {
        let cache = new Map();
        build.onLoad({ filter: /.\.(grammar)$/ }, async (args) => {
            const source = await fs.readFile(args.path, "utf-8");
            const filename = path.relative(process.cwd(), args.path);

            let key = args.path;
            let value = cache.get(key);
            // If the file is not cached, process it.
            if (!value || value.input !== source) {
                console.debug("Generating Lezer grammar:", filename);
                let { parser, terms } = buildParserFile(source, {
                    fileName: args.path,
                    includeNames: true,
                });
                let contents = parser + terms;
                value = { input: source, contents };
                cache.set(key, value);
            }

            return {
                contents: value.contents,
                loader: "js",
                resolveDir: path.dirname(args.path),
            };
            //try {
            //    const contents = peg.generate(source, defaultOptions);
            //    return {
            //        contents: `export default ${contents}`,
            //    };
            //} catch (e) {
            //    const code = source
            //        .split("\n")
            //        .slice(e.location.start.line - 2, e.location.start.line - 1)
            //        .join("\n");
            //    return {
            //        errors: [
            //            convertMessage({
            //                message: e.message,
            //                location: e.location,
            //                code,
            //                filename,
            //            }),
            //        ],
            //    };
            //}
        });
    },
});
