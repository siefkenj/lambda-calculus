// Lambda calculus grammar
// ==========================
//

program "program"
    = _ e:expression _ { return e; }
    / _ EOF { return undefined; }

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
        _
        rest:(
            _ n:(p:paren_application { return [p]; } / expression) { return n; }
        )+
        _ { return [e].concat(...rest); }

function
    = inner_function
    / "(" _ f:function _ ")" { return f; }

inner_function "inner_function"
    = lambda _ v:name (_ "." _ / [ \t\n\r]+) _ expr:expression _ {
            return { type: "lambda", var: v, body: expr };
        }

name
    = inner_name
    / "(" _ n:name _ ")" { return n; }

inner_name "name" = $($[a-zA-Z0-9_]+ ($[₀₁₂₃₄₅₆₇₈₉]+)?)

lambda "lambda"
    = "\\"
    / "λ"
    / "lambda"

_ "comment_or_whitespace"
    = comment
    / ws

ws "whitespace" = [ \t\n\r]*

comment "comment"
    = [ \t]* "//" (c:. & { return !"\n\r".includes(c); })* ("\n" ws _ / EOF)

EOF = !.
