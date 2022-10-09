// Lambda calculus grammar
// ==========================
//

program "program"
    = expression
    / EOF

expression "expression"
    = application
    / function
    / name

application "application"
    = inner_application
    / paren_application

paren_application = "(" a:inner_application ")" { return a; }

inner_application
    = _
        e:(function / name / paren_application)
        rest:(
            _ n:(p:paren_application { return [p]; } / expression) { return n; }
        )+
        _ { return [e].concat(...rest); }

function
    = inner_function
    / "(" _ f:function _ ")" { return f; }

inner_function "inner_function"
    = lambda _ v:name _ "." _ expr:expression {
            return { type: "lambda", var: v, body: expr };
        }

name
    = inner_name
    / "(" _ n:name _ ")" { return n; }

inner_name "name" = $($[a-z]+ $("_" [0-9]+)? ($[₀₁₂₃₄₅₆₇₈₉]+)?)

lambda "lambda"
    = "\\"
    / "λ"
    / "lambda"

_ "whitespace" = [ \t\n\r]*

EOF = !.
