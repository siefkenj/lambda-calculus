import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col } from "react-bootstrap";
import { useStoreActions, useStoreState } from "./store/hooks";
import { ProgramEditor } from "./components/program-editor";
import { ResultsDisplay } from "./components/results-display";
import { NotesDisplay } from "./components/info-display";
import { Evaluator } from "./components/evaluator";

function App() {
    const editorText = useStoreState((state) => state.editorText);
    const editorChange = useStoreActions((actions) => actions.editorChange);

    return (
        <div className="App">
            <Container className="my-3">
                <Row>
                    <Col>
                        <ProgramEditor />
                        <NotesDisplay />
                    </Col>
                    <Col>
                        <ResultsDisplay />
                        <Evaluator />
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default App;
