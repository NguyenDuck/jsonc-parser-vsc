import { ParseErrorCode, createScanner, SyntaxKind, ScanError } from "jsonc-parser"
import { Position, Range } from "vscode"
import { JsonSyntaxError } from "./exceptions/SyntaxError"
import { JsonArray } from "./types/Array"
import { JsonBoolean } from "./types/Boolean"
import { JsonComment } from "./types/Comment"
import { JsonNull } from "./types/Null"
import { JsonNumber } from "./types/Number"
import { JsonObject } from "./types/Object"
import { JsonString } from "./types/String"


export function parse(text: string) {
    let name: JsonString | undefined
    let current: JsonObject | JsonArray
    const errors: JsonSyntaxError[] = []

    const visitor: JSONVisitor = {
        onObjectBegin: ({ position }) => {
            const t = JsonObject.from({ start: position })

            if (current) {
                if (current instanceof JsonArray) current.add(t)
                if (current instanceof JsonObject) current.set(name!, t)
                t.parent = current
            }

            current = t
        },
        onObjectProperty: ({ start, end }, value) => {
            name = JsonString.from({ value, start, end })
        },
        onObjectEnd: ({ position }) => {
            name = undefined
            current.end = position
            current = current.parent ?? current
        },
        onArrayBegin: ({ position }) => {
            const t = JsonArray.from({ start: position })

            if (current) {
                if (current instanceof JsonObject) current.set(name!, t)
                t.parent = current
            }

            current = t
        },
        onArrayEnd: ({ position }) => {
            name = undefined
            current.end = position
            current = current.parent ?? current
        },
        onLiteralValue: ({ start, end }, value) => {
            let t: { from: (p: { value?: any, start?: Position, end?: Position }) => any } = JsonNull
            switch (typeof value) {
                case "string":
                    t = JsonString
                    break
                case "number":
                    t = JsonNumber
                    break
                case "boolean":
                    t = JsonBoolean
                    break
            }

            if (current instanceof JsonObject) {
                current.set(name!, t.from({ value, start, end }))
            } else if (current instanceof JsonArray) {
                current.add(t.from({ value, start, end }))
            }
        },
        onError: ({ start, end }, error) => {
            errors.push(new JsonSyntaxError(error, new Range(start, end)))
        },
        onComment({ start, end }, value) {
            JsonComment.from({
                value,
                start,
                end
            })
        },
    }
    visit(text, visitor)
    return {
        text: current!,
        errors
    }
}

interface VisitorParam {
    position: Position
}

interface VisitorEndParam {
    start: Position
    end: Position
}

interface JSONVisitor {
    onObjectBegin?: (param: VisitorParam) => void

    onObjectProperty?: (param: VisitorEndParam, property: string) => void

    onObjectEnd?: (param: VisitorParam) => void

    onArrayBegin?: (param: VisitorParam) => void

    onArrayEnd?: (param: VisitorParam) => void

    onLiteralValue?: (param: VisitorEndParam, value: any) => void

    onSeparator?: (param: VisitorParam) => void

    onComment?: (param: VisitorEndParam, value: string) => void

    onError?: (param: VisitorEndParam, error: ParseErrorCode) => void
}

function visit(text: string, visitor?: JSONVisitor): any {
    const scanner = createScanner(text)

    const onObjectBegin = visitor?.onObjectBegin || (() => { }),
        onObjectProperty = visitor?.onObjectProperty || (() => { }),
        onObjectEnd = visitor?.onObjectEnd || (() => { }),
        onArrayBegin = visitor?.onArrayBegin || (() => { }),
        onArrayEnd = visitor?.onArrayEnd || (() => { }),
        onLiteralValue = visitor?.onLiteralValue || (() => { }),
        onComment = visitor?.onComment || (() => { }),
        onSeparator = visitor?.onSeparator || (() => { }),
        onError = visitor?.onError || (() => { })

    function scanNext(): SyntaxKind {
        let token = scanner.scan()
        while (token !== SyntaxKind.EOF) {
            switch (scanner.getTokenError()) {
                case ScanError.InvalidUnicode:
                    handleError(ParseErrorCode.InvalidUnicode)
                    break
                case ScanError.InvalidEscapeCharacter:
                    handleError(ParseErrorCode.InvalidEscapeCharacter)
                    break
                case ScanError.UnexpectedEndOfNumber:
                    handleError(ParseErrorCode.UnexpectedEndOfNumber)
                    break
                case ScanError.UnexpectedEndOfComment:
                    handleError(ParseErrorCode.UnexpectedEndOfComment)
                    break
                case ScanError.UnexpectedEndOfString:
                    handleError(ParseErrorCode.UnexpectedEndOfString)
                    break
                case ScanError.InvalidCharacter:
                    handleError(ParseErrorCode.InvalidCharacter)
                    break
            }

            switch (token) {
                case SyntaxKind.LineCommentTrivia:
                case SyntaxKind.BlockCommentTrivia:
                    onComment({
                        start: getStartPosition(),
                        end: getEndPosition(),
                    }, scanner.getTokenValue())
                    break
                case SyntaxKind.Trivia:
                case SyntaxKind.LineBreakTrivia:
                    break
                default:
                    return token
            }

            token = scanner.scan()
        }
        return token
    }

    function handleError(error: ParseErrorCode, skipUntilAfter: SyntaxKind[] = [], skipUntil: SyntaxKind[] = []) {
        onError({
            start: getStartPosition(),
            end: getEndPosition(),
        }, error)
        if (skipUntilAfter.length + skipUntil.length > 0) {
            let token = scanner.getToken()
            while (token !== SyntaxKind.EOF) {
                if (skipUntilAfter.indexOf(token) !== -1) {
                    scanNext()
                    break
                } else if (skipUntil.indexOf(token) !== -1) {
                    break
                }
                token = scanNext()
            }
        }
    }

    function parseString(isValue: boolean): boolean {
        const value = scanner.getTokenValue()
        if (isValue) {
            onLiteralValue({
                start: getStartPosition(),
                end: getEndPosition(),
            }, value)
        } else {
            onObjectProperty({
                start: getStartPosition(),
                end: getEndPosition(),
            }, value)
        }

        scanNext()
        return true
    }

    function parseLiteral(): boolean {
        switch (scanner.getToken()) {
            case SyntaxKind.NumericLiteral:
                const tokenValue = scanner.getTokenValue()
                let value = Number(tokenValue)

                if (isNaN(value)) {
                    handleError(ParseErrorCode.InvalidNumberFormat)
                    value = 0
                }

                onLiteralValue({
                    start: getStartPosition(),
                    end: getEndPosition(),
                }, value)
                break
            case SyntaxKind.NullKeyword:
                onLiteralValue({
                    start: getStartPosition(),
                    end: getEndPosition(),
                }, null)
                break
            case SyntaxKind.TrueKeyword:
                onLiteralValue({
                    start: getStartPosition(),
                    end: getEndPosition(),
                }, true)
                break
            case SyntaxKind.FalseKeyword:
                onLiteralValue({
                    start: getStartPosition(),
                    end: getEndPosition(),
                }, false)
                break
            default:
                return false
        }

        scanNext()
        return true
    }

    function parseProperty(): boolean {
        if (scanner.getToken() !== SyntaxKind.StringLiteral) {
            handleError(ParseErrorCode.PropertyNameExpected, [], [SyntaxKind.CloseBraceToken, SyntaxKind.CommaToken])
            return false
        }
        parseString(false)
        if (scanner.getToken() === SyntaxKind.ColonToken) {
            onSeparator({
                position: new Position(scanner.getTokenStartLine() + 1, scanner.getTokenStartCharacter() + 1),
            })
            scanNext()

            if (!parseValue()) {
                handleError(ParseErrorCode.ValueExpected, [], [SyntaxKind.CloseBraceToken, SyntaxKind.CommaToken])
            }
        } else {
            handleError(ParseErrorCode.ColonExpected, [], [SyntaxKind.CloseBraceToken, SyntaxKind.CommaToken])
        }
        return true
    }

    function parseObject(): boolean {
        onObjectBegin({
            position: getStartPosition(),
        })
        scanNext()

        let needsComma = false
        while (scanner.getToken() !== SyntaxKind.CloseBraceToken && scanner.getToken() !== SyntaxKind.EOF) {
            if (scanner.getToken() === SyntaxKind.CommaToken) {
                if (!needsComma) {
                    handleError(ParseErrorCode.ValueExpected, [], [])
                }
                onSeparator({
                    position: getStartPosition(),
                })
                scanNext()
            } else if (needsComma) {
                handleError(ParseErrorCode.CommaExpected, [], [])
            }
            if (!parseProperty()) {
                handleError(ParseErrorCode.ValueExpected, [], [SyntaxKind.CloseBraceToken, SyntaxKind.CommaToken])
            }
            needsComma = true
        }
        onObjectEnd({
            position: getStartPosition(),
        })
        if (scanner.getToken() !== SyntaxKind.CloseBraceToken) {
            handleError(ParseErrorCode.CloseBraceExpected, [SyntaxKind.CloseBraceToken], [])
        } else {
            scanNext()
        }
        return true
    }

    function parseArray(): boolean {
        onArrayBegin({
            position: getStartPosition(),
        })
        scanNext()

        let needsComma = false
        while (scanner.getToken() !== SyntaxKind.CloseBracketToken && scanner.getToken() !== SyntaxKind.EOF) {
            if (scanner.getToken() === SyntaxKind.CommaToken) {
                if (!needsComma) {
                    handleError(ParseErrorCode.ValueExpected, [], [])
                }
                onSeparator({
                    position: getStartPosition(),
                })
                scanNext()
            } else if (needsComma) {
                handleError(ParseErrorCode.CommaExpected, [], [])
            }
            if (!parseValue()) {
                handleError(ParseErrorCode.ValueExpected, [], [SyntaxKind.CloseBracketToken, SyntaxKind.CommaToken])
            }
            needsComma = true
        }
        onArrayEnd({
            position: getStartPosition(),
        })
        if (scanner.getToken() !== SyntaxKind.CloseBracketToken) {
            handleError(ParseErrorCode.CloseBracketExpected, [SyntaxKind.CloseBracketToken], [])
        } else {
            scanNext()
        }
        return true
    }

    function parseValue(): boolean {
        switch (scanner.getToken()) {
            case SyntaxKind.OpenBracketToken:
                return parseArray()
            case SyntaxKind.OpenBraceToken:
                return parseObject()
            case SyntaxKind.StringLiteral:
                return parseString(true)
            default:
                return parseLiteral()
        }
    }

    function getStartPosition(): Position {
        return new Position(scanner.getTokenStartLine(), scanner.getTokenStartCharacter())
    }

    function getEndPosition(): Position {
        const localScanner = createScanner(scanner.getTokenValue())
        while (localScanner.scan() !== SyntaxKind.EOF) { }
        return new Position(
            scanner.getTokenStartLine() + localScanner.getTokenStartLine(),
            scanner.getTokenStartCharacter() + localScanner.getTokenStartCharacter()
        )
    }

    scanNext()
    if (scanner.getToken() === SyntaxKind.EOF || !parseValue()) {
        handleError(ParseErrorCode.ValueExpected, [], [])
        return false
    }
    if (scanner.getToken() !== SyntaxKind.EOF) {
        handleError(ParseErrorCode.EndOfFileExpected, [], [])
    }

    return true
}