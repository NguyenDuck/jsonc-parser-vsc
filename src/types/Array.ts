import { Position } from "vscode"
import { CanHaveParent } from "./CanHaveParent"
import { JsonObject } from "./Object"
import { WithPosition } from "./WithPosition"
import { JsonNumber } from "./Number"
import { JsonBoolean } from "./Boolean"
import { JsonNull } from "./Null"
import { JsonString } from "./String"

declare type JsonArrayValue = JsonObject | JsonString | JsonNumber | JsonBoolean | JsonNull


export class JsonArray extends WithPosition implements CanHaveParent {

    public readonly type = 'array'

    public parent?: JsonObject | JsonArray

    private children: JsonArrayValue[] = []

    public static from({ start, end }: {
        start?: Position,
        end?: Position
    }): JsonArray {
        return Object.assign(new JsonArray(), {
            start,
            end
        })
    }

    public static isJsonArray(obj: unknown): boolean {
        return obj instanceof JsonArray
    }

    public get(n: number): JsonArrayValue | undefined {
        return this.children.at(n)
    }

    public add(value: JsonArrayValue): number {
        return this.children.push(value)
    }

    public delete(key: number | JsonArrayValue): void {
        if (typeof key === 'number') {
            this.children = this.children.filter((_, index) => index !== key)
        } else {
            this.children = this.children.filter(v => v !== key)
        }
    }

    public toString() {
        return this.children.flatMap(v => v.toString())
    }
}