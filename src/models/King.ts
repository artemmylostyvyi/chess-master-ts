import {Piece} from "./Piece.js";
import {Color} from "./types.js";
import {DefaultMoveStrategy} from "./strategies/DefaultMoveStrategy.js";
import {KingMoveStrategy} from "./strategies/KingMoveStrategy.js";
import { Rook } from "./Rook.js";

export class King extends Piece{
    public readonly type = "King";
    constructor(position: {x: number, y: number}, color: Color) {
        super(position, color, new KingMoveStrategy());
    }
}