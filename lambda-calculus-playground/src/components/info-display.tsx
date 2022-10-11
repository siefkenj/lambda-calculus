import React from "react";
import { Card, Alert } from "react-bootstrap";
import { useStoreState } from "../store/hooks";
import { isParseError } from "../worker/errors";

export function NotesDisplay() {
    const parseError = useStoreState((state) => state.parseError);
    const evaluateError = useStoreState((state) => state.evaluateError);

    let notes = [<Card.Text key="default">No warnings</Card.Text>];

    if (parseError || evaluateError) {
        notes.length = 0;
    }
    if (parseError) {
        notes.push(
            <Alert variant="warning" key="parse">
                {isParseError(parseError) ? parseError.desc : parseError}
            </Alert>
        );
    }
    if (evaluateError) {
        notes.push(
            <Alert variant="danger" key="evaluate">
                {evaluateError}
            </Alert>
        );
    }

    return (
        <Card className="mt-3">
            <Card.Header>Notifications</Card.Header>
            <Card.Body>{notes}</Card.Body>
        </Card>
    );
}
