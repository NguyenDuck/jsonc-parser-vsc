import { Position } from "vscode"
import { JsonArray } from "./Array"
import { CanHaveParent } from "./CanHaveParent"
import { JsonObject } from "./Object"
import { WithPosition } from "./WithPosition"


export class JsonBoolean extends WithPosition implements CanHaveParent {

    public readonly type = 'boolean'

    public parent?: JsonObject | JsonArray

    public value!: boolean

    public static from({ value, start, end }: {
        value?: boolean,
        start?: Position,
        end?: Position
    }): JsonBoolean {
        return Object.assign(new JsonBoolean(), {
            value,
            start,
            end
        })
    }

    public static isJsonBoolean(obj: unknown): boolean {
        return obj instanceof JsonBoolean
    }
    
    public toString() {
        return this.value
    }
}