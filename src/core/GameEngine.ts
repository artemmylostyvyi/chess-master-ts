import {Board} from "../models/Board.js";
import {Color} from "../models/types.js"
import {King} from "../models/King.js";
import {Piece} from "../models/Piece.js";

export class GameEngine {
    public board: Board;
    public currentPlayer: Color;
    public isGameOver: boolean = false;

    constructor(board: Board) {
        this.board = board;
        this.currentPlayer = Color.White;
    }

    public processMove(startX: number, startY: number, endX: number, endY: number): boolean {
        if (this.isGameOver) {
            return false;
        }

        const piece = this.board.getPiece(startX, startY);

        if (!piece) {
            console.log("Тут немає фігури!");
            return false;
        }
        if (piece.color !== this.currentPlayer) {
            console.log(`Зараз хід кольору: ${this.currentPlayer}`);
            return false;
        }

        if (!piece.canMove({x: startX, y: startY}, {x: endX, y: endY}, this.board)) {
            console.log("Ця фігура так не ходить або шлях заблоковано!");
            return false;
        }

        const targetPiece = this.board.cells[endY]![endX] ?? null;

        this.board.cells[endY]![endX] = piece;
        this.board.cells[startY]![startX] = null;

        const originalX = (piece as any).x;
        const originalY = (piece as any).y;
        if (originalX !== undefined && originalY !== undefined) {
            (piece as any).x = endX;
            (piece as any).y = endY;
        }

        const isSelfCheck = this.isCheck(this.currentPlayer);

        this.board.cells[startY]![startX] = piece;
        this.board.cells[endY]![endX] = targetPiece ?? null;

        if (originalX !== undefined && originalY !== undefined) {
            (piece as any).x = originalX;
            (piece as any).y = originalY;
        }

        if (isSelfCheck) {
            console.log("Неможливо зробити хід: ваш король залишиться під шахом!");
            return false;
        }

        this.executeMove(startX, startY, endX, endY);
        this.switchTurn();

        if (this.isCheckmate(this.currentPlayer)) {
            this.isGameOver = true;
            const winner = this.currentPlayer === Color.White ? 'Чорні' : 'Білі';
            alert(`ШАХ І МАТ! Перемогли ${winner}!`);
        } else if (this.isStalemate(this.currentPlayer)) {
            this.isGameOver = true;
            alert("ПАТ! Нічия.");
        }

        return true;
    }

    private executeMove(startX: number, startY: number, endX: number, endY: number): void {
        this.board.movePiece(startX, startY, endX, endY);
        console.log(`Фігуру переміщено з (${startX}, ${startY}) на (${endX}, ${endY})`);
    }

    public switchTurn(): void {
        this.currentPlayer = this.currentPlayer === Color.White ? Color.Black : Color.White;
        console.log(`Хід передано. Тепер ходять: ${this.currentPlayer}`);
    }

    public isCheck(color: Color): boolean {
        let kingX = 0;
        let kingY = 0;

        for (let i = 0; i < 8; i++){
            for (let j = 0; j < 8; j++){
                if (this.board.cells[j]![i] instanceof King && this.board.cells[j]![i]?.color === color) {
                    kingX = i;
                    kingY = j;
                }
            }
        }
        for (let i = 0; i < 8; i++){
            for (let j = 0; j < 8; j++){
                if (this.board.cells[j]![i] instanceof Piece && this.board.cells[j]![i]?.color !== color) {
                    const piece = this.board.cells[j]![i];
                    if (piece?.canMove({x: i, y: j}, {x: kingX, y: kingY}, this.board)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public hasValidMoves(color: Color): boolean {
        for (let startX = 0; startX < 8; startX++) {
            for (let startY = 0; startY < 8; startY++) {
                const piece = this.board.cells[startY]![startX];

                if (piece instanceof Piece && piece.color === color) {
                    for (let endX = 0; endX < 8; endX++) {
                        for (let endY = 0; endY < 8; endY++) {
                            if (startX === endX && startY === endY) continue;

                            if (piece.canMove({x: startX, y: startY}, {x: endX, y: endY}, this.board)) {
                                const targetPiece = this.board.cells[endY]![endX] ?? null;

                                if (targetPiece && targetPiece.color === color) continue;

                                this.board.cells[endY]![endX] = piece;
                                this.board.cells[startY]![startX] = null;

                                const originalX = (piece as any).x;
                                const originalY = (piece as any).y;
                                if (originalX !== undefined && originalY !== undefined) {
                                    (piece as any).x = endX;
                                    (piece as any).y = endY;
                                }

                                const isSelfCheck = this.isCheck(color);

                                this.board.cells[startY]![startX] = piece;
                                this.board.cells[endY]![endX] = targetPiece;

                                if (originalX !== undefined && originalY !== undefined) {
                                    (piece as any).x = originalX;
                                    (piece as any).y = originalY;
                                }

                                if (!isSelfCheck) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    public isCheckmate(color: Color): boolean {
        if (!this.isCheck(color)) {
            return false;
        }

        return !this.hasValidMoves(color);
    }

    public isStalemate(color: Color): boolean {
        if (this.isCheck(color)) {
            return false;
        }

        return !this.hasValidMoves(color);
    }
}