export type BasicProgram = BasicExpression | undefined;
export type BasicExpression = BasicApplication | BasicLambda | BasicName;
export type BasicApplication = Array<BasicExpression>;
export type BasicLambda = {
    type: "lambda";
    var: string;
    body: BasicExpression;
};
export type BasicName = string;

export type Program = Expression | { type: "empty_program" };
export type Expression = Application | Lambda | Name;
export type Application = {
    type: "application";
    body: Expression[];
};
export type Lambda = {
    type: "lambda";
    var: Name;
    body: Expression;
};
export type Name = {
    type: "name";
    val: string;
    boundName?: number;
};
