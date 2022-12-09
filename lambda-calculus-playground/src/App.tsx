import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col } from "react-bootstrap";
import { ProgramEditor } from "./components/program-editor";
import { ResultsDisplay } from "./components/results-display";
import { NotesDisplay } from "./components/info-display";
import { Evaluator } from "./components/evaluator";

function App() {
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
