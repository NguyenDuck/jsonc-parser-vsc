import { Position } from "vscode"
import { JsonArray } from "./Array"
import { CanHaveParent } from "./CanHaveParent"
import { JsonObject } from "./Object"
import { WithPosition } from "./WithPosition"


export class JsonString extends WithPosition implements CanHaveParent {

    public readonly type = 'string'

    public parent?: JsonObject | JsonArray

    public value!: string

    public static from({ value, start, end }: {
        value?: string,
        start?: Position,
        end?: Position
    }): JsonString {
        return Object.assign(new JsonString(), {
            value,
            start,
            end
        })
    }

    public static isJsonString(obj: unknown): boolean {
        return obj instanceof JsonString
    }

    public toString() {
        return this.value
    }

    public toJSON() {
        return this.value
    }
}