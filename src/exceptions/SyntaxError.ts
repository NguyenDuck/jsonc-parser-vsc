import { ParseErrorCode } from "jsonc-parser"
import { Range } from "vscode"


export class JsonSyntaxError extends SyntaxError {

    constructor(
        public code: ParseErrorCode,
        public range: Range
    ) {
        super(`JSON syntax error at ${range.start.line}:${range.start.character}`)
    }

}