import { BaseMoveStrategy } from "./BaseMoveStrategy.js";
import { Board } from "../Board.js";
import { Piece } from "../Piece.js";

export class QueenMoveStrategy extends BaseMoveStrategy {
    canMove(startX: number, startY: number, endX: number, endY: number, board: Board, piece: Piece): boolean {
        const { dx, dy } = this.getDiffs(startX, startY, endX, endY);
        return (dx === dy) || (dx === 0 && dy > 0) || (dx > 0 && dy === 0);
    }
}