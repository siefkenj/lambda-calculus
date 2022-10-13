# lambda-calculus

A basic lambda calculus interpreter, evaluator, and playground.

## Playground

Visit the **[Playground](https://siefkenj.github.io/lambda-calculus/)** to evaluate lambda expressions
in the playground. Try out the samples to get an idea of the syntax.

## Development

The project is organized into `npm` workspaces. In the root project directory, run

```
npm install
npm build
```

The workspaces are

-   `lambda-calculus-interpreter/` The main parser and evaluator.
-   `lambda-calculus-playground/` A React-based web frontend for evaluating lambda expressions.
-   `lambda-lezer-grammar/` A Lezer grammar to allow syntax highlighting of lambda expressions in CodeMirror.
