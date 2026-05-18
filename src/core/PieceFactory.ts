import { Piece } from "../models/Piece.js";
import { King } from "../models/King.js";
import { Queen } from "../models/Queen.js";
import { Rook } from "../models/Rook.js";
import { Bishop } from "../models/Bishop.js";
import { Knight } from "../models/Knight.js";
import { Pawn } from "../models/Pawn.js";
import { Color } from "../models/types.js";

export class PieceFactory {
    /**
     * Патерн Factory Method для централізованого створення шахових фігур
     */
    public static createPiece(type: string, position: { x: number, y: number }, color: Color): Piece {
        switch (type) {
            case "King": return new King(position, color);
            case "Queen": return new Queen(position, color);
            case "Rook": return new Rook(position, color);
            case "Bishop": return new Bishop(position, color);
            case "Knight": return new Knight(position, color);
            case "Pawn": return new Pawn(position, color);
            default:
                console.warn(`[PieceFactory] Невідомий тип фігури: ${type}. Створено пішака за замовчуванням.`);
                return new Pawn(position, color);
        }
    }
}
