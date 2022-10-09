import React from "react";
import { useCodeMirror } from "@uiw/react-codemirror";
import { linter, LintSource, Diagnostic } from "@codemirror/lint";
import {
    Container,
    Card,
    ButtonGroup,
    Button,
    Nav,
    Navbar,
} from "react-bootstrap";
import { useStoreActions, useStoreState } from "../store/hooks";
import { HelpModal } from "./help-modal";
import { isParseError, ParseError } from "../worker/errors";

const CHARS = "λ₀₁₂₃₄₅₆₇₈₉".split("");

/**
 * CodeMirror has its own state management system. However, we want to use React's state management
 * to control when/what lints are displayed. `lintFactory` creates functions to "break out" of CodeMirror's
 * system and allows us to set the lints by calling the `setLint` function of the return value.
 * 
 * The `linProcessor` function should be passed to CodeMirror's `linter(...)` function. CodeMirror
 * will call `lintProcessor` when it feels like.
 *
 * @returns
 */
function lintFactory() {
    const currentLints: Diagnostic[] = [];
    const setLint = (parseError: ParseError | string | null): void => {
        if (isParseError(parseError)) {
            currentLints.length = 0;
            currentLints.push({
                from: parseError.location.start.offset,
                to: parseError.location.end.offset,
                severity: "error",
                message: parseError.desc,
            });
            return;
        }
        currentLints.length = 0;
    };
    const lintProcessor: LintSource = () => {
        return currentLints;
    };
    return { setLint, lintProcessor };
}
const { setLint, lintProcessor } = lintFactory();

const lambdaLinter = linter(lintProcessor);

export function ProgramEditor() {
    const [helpShow, setHelpShow] = React.useState(false);
    const editorText = useStoreState((state) => state.editorText);
    const editorChange = useStoreActions((actions) => actions.editorChange);
    const editorRef = React.useRef<HTMLDivElement>(null);
    const editor = useCodeMirror({
        container: editorRef.current,
        value: editorText,
        onChange: (text) => editorChange(text),
        extensions: [lambdaLinter],
    });
    const parseError = useStoreState((state) => state.parseError);

    React.useEffect(() => {
        setLint(parseError);
    }, [parseError]);

    /**
     * Returns a button that when clicked will insert the specified character into the editor
     */
    function typeCharFactory(n: number) {
        const char = CHARS[n];
        return (
            <Button
                variant="secondary"
                onClick={() => {
                    if (!editor.view?.state) {
                        return;
                    }
                    const edit = editor.view.state.replaceSelection(char);
                    const transaction = editor.view.state.update(edit);
                    editor.view?.dispatch(transaction);
                }}
            >
                {char}
            </Button>
        );
    }

    return (
        <Card>
            <Card.Header>
                <Navbar>
                    <Container>
                        <Navbar.Brand>λ Calculus Expression</Navbar.Brand>
                        <Button
                            className="ms-auto"
                            variant="outline-secondary"
                            onClick={() => setHelpShow(true)}
                        >
                            Help
                        </Button>
                    </Container>
                </Navbar>
            </Card.Header>
            <Card.Body>
                <div className="program-editor">
                    <div ref={editorRef} />
                </div>
            </Card.Body>
            <Card.Footer>
                <ButtonGroup className="me-1">{typeCharFactory(0)}</ButtonGroup>
                Subscripts:
                <ButtonGroup className="ms-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                        <React.Fragment key={d}>
                            {typeCharFactory(d)}
                        </React.Fragment>
                    ))}
                </ButtonGroup>
            </Card.Footer>
            <HelpModal show={helpShow} setShow={setHelpShow} />
        </Card>
    );
}
