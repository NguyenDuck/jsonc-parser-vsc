import { Position } from "vscode"
import { JsonArray } from "./Array"
import { CanHaveParent } from "./CanHaveParent"
import { JsonObject } from "./Object"
import { WithPosition } from "./WithPosition"


export class JsonNumber extends WithPosition implements CanHaveParent {

    public parent?: JsonObject | JsonArray

    public value!: number

    public static from({ value, start, end }: {
        value?: number,
        start?: Position,
        end?: Position
    }): JsonNumber {
        return Object.assign(new JsonNumber(), {
            value,
            start,
            end
        })
    }

    public static isJsonNumber(obj: unknown): boolean {
        return obj instanceof JsonNumber
    }

    public toString() {
        return this.value
    }
}