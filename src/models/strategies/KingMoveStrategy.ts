import { BaseMoveStrategy } from "./BaseMoveStrategy.js";
import { type Board } from "../Board.js";
import { type Piece } from "../Piece.js";

export class KingMoveStrategy extends BaseMoveStrategy {
    canMove(
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        board: Board,
        piece: Piece
    ): boolean {
        const { dx, dy } = this.getDiffs(startX, startY, endX, endY);

        return dx <= 1 && dy <= 1 && (dx + dy > 0);
    }
}