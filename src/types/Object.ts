import { Position } from "vscode"
import { CanHaveParent } from "./CanHaveParent"
import { WithPosition } from "./WithPosition"
import { JsonArray } from "./Array"
import { JsonBoolean } from "./Boolean"
import { JsonString } from "./String"
import { JsonNull } from "./Null"
import { JsonNumber } from "./Number"

declare type JsonObjectValue = JsonArray | JsonString | JsonNumber | JsonBoolean | JsonNull


export class JsonObject extends WithPosition implements CanHaveParent {

    public readonly type = 'object'

    public parent?: JsonObject | JsonArray

    private children: {
        key: string[],
        pos: WithPosition[],
        value: JsonObjectValue[]
    }

    constructor() {
        super()
        this.children = { key: [], pos: [], value: [] }
    }

    public static from({ start, end }: {
        start?: Position,
        end?: Position
    }): JsonObject {
        return Object.assign(new JsonObject(), {
            start,
            end
        })
    }

    public static isJsonObject(obj: unknown): boolean {
        return obj instanceof JsonObject
    }

    public get(key: string | JsonString): JsonObjectValue | undefined {
        let index: number

        if (typeof key === 'string') {
            index = this.children.key.indexOf(key)
        } else {
            index = this.children.key.indexOf(key.value)
        }

        return this.children.value.at(index)
    }

    public set(key: string | JsonString, value: JsonObjectValue): void {
        const rawKey = (typeof key === 'string' ? key : key.value)
        const index = this.children.key.indexOf(rawKey)
        if (index === -1) {
            this.children.pos[index] = value
        }

        this.children.key
    }

    public has(key: string | JsonString): boolean {
        return this.children.key.includes((typeof key === 'string' ? key : key.value))
    }

    public toString(): string {
        let s: any = {}
        this.children.key.forEach(k => {
            const value = this.get(k)
            if (value instanceof JsonObject || value instanceof JsonArray) {
                s[k] = value.toString()
            } else {
                s[k] = value?.toString()
            }
        })
        return JSON.stringify(s)
    }

    public toJSON() {
        let obj: any = {}
        this.children.key.forEach(k => {
            const value = this.get(k)
            if (value instanceof JsonObject || value instanceof JsonArray) {
                obj[k] = value.toJSON()
            } else {
                obj[k] = value?.toJSON()
            }
        })
        return obj
    }
}