import { Position } from "vscode"
import { JsonArray } from "./Array"
import { CanHaveParent } from "./CanHaveParent"
import { JsonObject } from "./Object"
import { WithPosition } from "./WithPosition"


export class JsonNull extends WithPosition implements CanHaveParent {

    public readonly type = 'null'

    public parent?: JsonObject | JsonArray

    public value = null

    public static from({ value = null, start, end }: {
        value?: null,
        start?: Position,
        end?: Position
    }): JsonNull {
        return Object.assign(new JsonNull(), {
            value,
            start,
            end
        })
    }

    public static isJsonNull(obj: unknown): boolean {
        return obj instanceof JsonNull
    }

    public toString() {
        return this.value
    }

    public toJSON() {
        return this.value
    }
}