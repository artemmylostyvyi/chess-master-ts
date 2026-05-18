import {Piece} from "./Piece.js";
import {Color} from "./types.js";
import {DefaultMoveStrategy} from "./strategies/DefaultMoveStrategy.js";
import {QueenMoveStrategy} from "./strategies/QueenMoveStraregy.js";

export class Queen extends Piece{
    public readonly type = "Queen";
    constructor(position: {x: number, y: number}, color: Color) {
        super(position, color, new QueenMoveStrategy());
    }
}