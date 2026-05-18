import { type Position, Color } from "./types.js";
import { type MoveStrategy } from "./strategies/MoveStrategy.js";
import type {Board} from "./Board.js";

export abstract class Piece {
    public position: Position;
    public color: Color;
    protected strategy: MoveStrategy;
    public isFirstMove: boolean = true;
    public abstract readonly type: string;

    constructor(position: Position, color: Color, strategy: MoveStrategy) {
        this.position = position;
        this.color = color;
        this.strategy = strategy;
    }

    public canMove(currentPosition: Position, targetPosition: Position, board: Board) : boolean {

        const targetPiece = board.cells[targetPosition.y]![targetPosition.x];
        if (targetPiece && targetPiece.color === this.color) {
            return false;
        }

        return this.strategy.canMove(currentPosition.x, currentPosition.y, targetPosition.x, targetPosition.y, board, this);
    };
}