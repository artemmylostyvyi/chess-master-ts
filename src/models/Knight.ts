import {Piece} from "./Piece.js";
import { KnightMoveStrategy } from "./strategies/KnightMoveStrategy.js";
import {Color} from "./types.js";

export class Knight extends Piece{
    public readonly type = "Knight";
    constructor(position: {x: number, y: number}, color: Color) {
        super(position, color, new KnightMoveStrategy());
    }
}