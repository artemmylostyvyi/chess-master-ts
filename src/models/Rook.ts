import {Piece} from "./Piece.js";
import {Color} from "./types.js";
import {RookMoveStrategy} from "./strategies/RookMoveStrategy.js";

export class Rook extends Piece{
    public readonly type = "Rook";
    constructor(position: {x: number, y: number}, color: Color) {
        super(position, color, new RookMoveStrategy());
    }
}