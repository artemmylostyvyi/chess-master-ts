import {Piece} from "./Piece.js";
import {Color} from "./types.js";
import {DefaultMoveStrategy} from "./strategies/DefaultMoveStrategy.js";
import {PawnMoveStrategy} from "./strategies/PawnMoveStrategy.js";

export class Pawn extends Piece{
    public readonly type = "Pawn";
    constructor(position: {x: number, y: number}, color: Color) {
        super(position, color, new PawnMoveStrategy());
    }
}