import React from "react";
import { Card, Alert } from "react-bootstrap";
import { useStoreState } from "../store/hooks";
import { isParseError } from "../worker/errors";

export function NotesDisplay() {
    const parseError = useStoreState((state) => state.parseError);

    let notes = <Card.Text>No warnings</Card.Text>;

    if (parseError) {
        notes = (
            <Alert variant="warning">
                {isParseError(parseError) ? parseError.desc : parseError}
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
