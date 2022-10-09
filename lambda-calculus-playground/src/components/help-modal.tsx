import React from "react";
import { Card, Modal } from "react-bootstrap";

export function HelpModal({
    show,
    setShow,
}: {
    show: boolean;
    setShow: (state: boolean) => void;
}) {
    return (
        <Modal show={show} onHide={() => setShow(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Help</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    A lambda expression is a `<code>λ</code>` followed by a
                    variable name and a `<code>.</code>` and then the function
                    body. The function body may optionally be wrapped in
                    parenthesis. For example <code>λx.y x</code> and{" "}
                    <code>λx.(y x)</code>
                    are lambda expressions.
                </p>
                <p>
                    Lambda expressions are left associative and will include as
                    much as possible in their body. For example{" "}
                    <code>λx.x y</code> will have a body <code>x y</code>. If
                    you would rather apply the identity function to{" "}
                    <code>y</code>, you must write <code>(λx.x) y</code>
                </p>
                <h4>Tips</h4>
                <ul>
                    <li>
                        To type a lambda expression expression, you may use `
                        <code>\</code>`, the word `<code>lambda</code>`, or the
                        unicode `<code>λ</code>` character.
                    </li>
                    <li>
                        Use the buttons below the editor to type special unicode
                        characters, including subscripts.
                    </li>
                    <li>
                        Lambda expressions only accept a single variable;
                        variables that are not the arguments of any lambda
                        expression are <em>free</em> variables. Evaluation must
                        terminate when a free variable is encountered.
                    </li>
                </ul>
            </Modal.Body>
        </Modal>
    );
}
