import React from "react";
import { Card } from "react-bootstrap";
import { useStoreState } from "../store/hooks";

export function ResultsDisplay() {
    const parsed = useStoreState((state) => state.parsed);

    return (
        <Card>
            <Card.Header>Parsed Expression</Card.Header>
            <Card.Body>
                <Card.Title>As Parsed</Card.Title>
                <Card.Text>{parsed.direct}</Card.Text>
                <Card.Title>Canonical Form</Card.Title>
                <Card.Text>{parsed.canonical}</Card.Text>
            </Card.Body>
        </Card>
    );
}
