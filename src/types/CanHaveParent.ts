import { JsonArray } from "./Array"
import { JsonObject } from "./Object"


export interface CanHaveParent {
    parent?: JsonObject | JsonArray
}