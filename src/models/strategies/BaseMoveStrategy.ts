import { Board } from "../Board.js";
import { Piece } from "../Piece.js";
import { type MoveStrategy } from "./MoveStrategy.js";

export abstract class BaseMoveStrategy implements MoveStrategy {
    abstract canMove(startX: number, startY: number, endX: number, endY: number, board: Board, piece: Piece): boolean;

    protected getDiffs(startX: number, startY: number, endX: number, endY: number) {
        return {
            dx: Math.abs(endX - startX),
            dy: Math.abs(endY - startY)
        };
    }
}