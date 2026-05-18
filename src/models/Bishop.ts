import {Piece} from "./Piece.js";
import {Color} from "./types.js";
import {BishopMoveStrategy} from "./strategies/BishopMoveStrategy.js";

export class Bishop extends Piece{
    public readonly type = "Bishop";
    constructor(position: {x: number, y: number}, color: Color) {
        super(position, color, new BishopMoveStrategy());
    }
}