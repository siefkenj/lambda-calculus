import React from "react";
import { Card, Button, Container, Row, Col } from "react-bootstrap";
import { useStoreActions, useStoreState } from "../store/hooks";

export function Evaluator() {
    const evaluatedString = useStoreState((state) => state.evaluatedString);
    const evaluate = useStoreActions((actions) => actions.evaluate);

    return (
        <Card className="mt-3">
            <Card.Header>Evaluated Expression</Card.Header>
            <Card.Body>
                <Container>
                    <Row>
                        <Button className="ms-auto" onClick={() => evaluate()}>
                            Evaluate
                        </Button>
                    </Row>
                    <Row>{evaluatedString}</Row>
                </Container>
            </Card.Body>
        </Card>
    );
}
