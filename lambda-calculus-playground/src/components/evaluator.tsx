import React from "react";
import { Card, Button, Container, Row, Col } from "react-bootstrap";
import { useStoreActions, useStoreState } from "../store/hooks";

export function Evaluator() {
    const evaluatedData = useStoreState((state) => state.evaluatedData);
    const evaluate = useStoreActions((actions) => actions.evaluate);

    return (
        <Card className="mt-3">
            <Card.Header>Evaluated Expression</Card.Header>
            <Card.Body>
                <Container className="mb-2">
                    <Row>
                        <Button className="ms-auto" onClick={() => evaluate()}>
                            Evaluate
                        </Button>
                    </Row>
                </Container>
                <Card.Title>Computed</Card.Title>
                <Card.Text>{evaluatedData.direct}</Card.Text>
                <Card.Title>Canonical Form</Card.Title>
                <Card.Text>{evaluatedData.canonical}</Card.Text>
            </Card.Body>
        </Card>
    );
}
