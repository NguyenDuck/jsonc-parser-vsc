import { Position, Range } from "vscode"


export class WithPosition {

    public start!: Position
    public end!: Position

    public toRange() {
        return new Range(this.start, this.end)
    }
}