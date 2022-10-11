import React from "react";
import { useCodeMirror } from "@uiw/react-codemirror";
import { linter, LintSource, Diagnostic } from "@codemirror/lint";
import {
    Container,
    Row,
    Col,
    Card,
    ButtonGroup,
    Button,
    Navbar,
    Dropdown,
    DropdownButton,
} from "react-bootstrap";
import { useStoreActions, useStoreState } from "../store/hooks";
import { HelpModal } from "./help-modal";
import { isParseError, ParseError } from "../worker/errors";

const CHARS = "λ₀₁₂₃₄₅₆₇₈₉".split("");
const SAMPLES = [
    { title: "0", value: "(λf.λx.x)" },
    { title: "1", value: "(λf.λx.f x)" },
    { title: "2", value: "(λf.λx.f (f x))" },
    { title: "3", value: "(λf.λx.f (f (f x)))" },
    { title: "4", value: "(λf.λx.f (f (f (f x))))" },
    { title: "Succ", value: "(λn.λf.λx.f (n f x))" },
    { title: "Pred", value: "(λn.λf.λx.(n (λtup.λi.i (λa.λb.b) ((tup (λa.λb.a)) (tup (λa.λb.b)) (f (tup (λa.λb.b))))) (λi.i (λa.λb.a) x)) (λa.λb.b))" },
    { title: "Add", value: "(λa.λb.a (λn.λf.λx.f (n f x)) b)" },
    { title: "True", value: "(λa.λb.a)" },
    { title: "False", value: "(λa.λb.b)" },
    { title: "If", value: "(λ bool.λ a.λ b.bool a b)" },
    { title: "Tup", value: "(λa.λb.λ bool.bool a b)" },
];
const LONG_SAMPLES = [
    {
        title: "0+1+1",
        value: "(λ succ.λ 0.\n\tsucc (succ 0)\n) (λn.λf.λx.f (n f x)) (λf.λx.x)",
    },
    {
        title: "2 + 3",
        value: `(λAdd.λ2.λ3.
\tAdd 2 3
)
(λa.λb.a (λn.λf.λx.f (n f x)) b)
(λf.λx.f (f x))
(λf.λx.f (f (f x)))`,
    },
    {title: "Pred (annotated)",
    value:`// We pass in some helper functions. Since
// they're the first things passed in, they
// can be used like "global" declarations
((λTup.λT.λF.λIf.
  // Define a function K which takes in an f and
  // a tuple (b, x). If b = T, return
  // (F, x). If b = F, return (F, f x)
  //
  // This function is used to get rid of the
  // "first application of f".
  (λK.
    // Here is where the meat of "pred" is
    λn.λf.λx.
      (n (K f) (Tup T x)) F
  )
  // The definition of K
  (λf.λtup.
    (Tup F (If (tup T) (tup F) (f (tup F))))
  )
)
// Tuple creator
(λa.λb.λi.i a b)
// T
(λa.λb.a)
// F
(λa.λb.b)
// The "if" function
(λi.λ a.λ b.i a b))
`
}
];

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
    function typeSampleFactory(sample: typeof SAMPLES[number]) {
        return (
            <Dropdown.Item
                onClick={() => {
                    if (!editor.view?.state) {
                        return;
                    }
                    const edit = editor.view.state.replaceSelection(
                        sample.value
                    );
                    const transaction = editor.view.state.update(edit);
                    editor.view?.dispatch(transaction);
                }}
            >
                {sample.title}
            </Dropdown.Item>
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
                <Container>
                    <Row>
                        <Col>
                            <ButtonGroup className="m-1">
                                {typeCharFactory(0)}
                            </ButtonGroup>
                        </Col>
                        <Col>
                            <DropdownButton
                                className="m-1"
                                variant="secondary"
                                title={"Presets"}
                            >
                                {SAMPLES.map((s) => (
                                    <React.Fragment key={s.title}>
                                        {typeSampleFactory(s)}
                                    </React.Fragment>
                                ))}
                                <Dropdown.Divider />
                                <Dropdown.Header>Long Samples</Dropdown.Header>
                                {LONG_SAMPLES.map((s) => (
                                    <React.Fragment key={s.title}>
                                        {typeSampleFactory(s)}
                                    </React.Fragment>
                                ))}
                            </DropdownButton>
                        </Col>
                    </Row>
                </Container>
            </Card.Footer>
            <HelpModal show={helpShow} setShow={setHelpShow} />
        </Card>
    );
}
