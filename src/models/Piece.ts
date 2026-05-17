import type {Board} from "./Board.js";
import { type Position, Color } from "./types.js";
import { type MoveStrategy } from "./strategies/MoveStrategy.js";

export abstract class Piece {
    public position: Position;
    public color: Color;
    protected strategy: MoveStrategy;
    public isFirstMove: boolean = true;

    constructor(position: Position, color: Color, strategy: MoveStrategy) {
        this.position = position;
        this.color = color;
        this.strategy = strategy;
    }

    public canMove(currentPosition: Position, targetPosition: Position, board: Board) : boolean {
        return this.strategy.canMove(currentPosition.x, currentPosition.y, targetPosition.x, targetPosition.y, board, this);
    };
}