import { Piece } from "../models/Piece.js";

export interface MoveRecord {
    pieceMoved: string;
    pieceColor: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    capturedPiece: string | null;
    isPromotion: boolean;
}

export class MoveFormatter {
    private static readonly FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    private static readonly PIECE_INITIALS: { [key: string]: string } = {
        "King": "K", "Queen": "Q", "Rook": "R", "Bishop": "B", "Knight": "N", "Pawn": ""
    };

    public static toChessNotation(x: number, y: number): string {
        const row = 8 - y;
        return `${this.FILES[x]}${row}`;
    }

    public static formatSingleMove(move: MoveRecord): string {
        let notation = this.PIECE_INITIALS[move.pieceMoved] || "";

        if (move.capturedPiece) {
            if (move.pieceMoved === "Pawn") {
                notation += `${this.FILES[move.startX]}x`;
            } else {
                notation += "x";
            }
        }

        notation += this.toChessNotation(move.endX, move.endY);

        if (move.isPromotion) notation += "=Q";

        return notation;
    }

    public static formatHistory(moves: MoveRecord[]): string[] {
        const formatted: string[] = [];

        for (let i = 0; i < moves.length; i += 2) {
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];

            if (!whiteMove) continue;

            let turnText = `${Math.floor(i / 2) + 1}. ${this.formatSingleMove(whiteMove)}`;

            if (blackMove) {
                turnText += ` ${this.formatSingleMove(blackMove)}`;
            }

            formatted.push(turnText);
        }

        return formatted;
    }
}

export class MoveHistory {
    private moves: MoveRecord[] = [];

    public addMove(
        pieceMoved: Piece,
        startX: number, startY: number,
        endX: number, endY: number,
        capturedPiece: Piece | null = null,
        isPromotion: boolean = false
    ) {
        this.moves.push({
            pieceMoved: pieceMoved.constructor.name,
            pieceColor: pieceMoved.color,
            startX,
            startY,
            endX,
            endY,
            capturedPiece: capturedPiece ? capturedPiece.constructor.name : null,
            isPromotion
        });
    }

    public getHistory(): MoveRecord[] {
        return this.moves;
    }

    public clear() {
        this.moves = [];
    }

    public getFormattedHistory(): string[] {
        return MoveFormatter.formatHistory(this.moves);
    }
}