// src/core/GameEngine.ts
import { Board } from "../models/Board.js";
import { Color } from "../models/types.js";
import { King } from "../models/King.js";
import { Piece } from "../models/Piece.js";
import { Pawn } from "../models/Pawn.js";
import { Queen } from "../models/Queen.js";
import { Rook } from "../models/Rook.js";
import { Bishop } from "../models/Bishop.js";
import { Knight } from "../models/Knight.js";
import { MoveHistory } from "./MoveHistory.js";
import { ChessClock } from "./ChessClock.js";
import { GameAnalytics } from "./GameAnalytics.js";
import { GameStorage } from "./GameStorage.js";
import { SoundManager, ChessSound } from "./SoundManager.js";
import { NotificationManager, NotifyType } from "../ui/NotificationManager.js";
import { ScoreManager } from "./ScoreManager.js";
import { PieceFactory } from "./PieceFactory.js";

export class GameEngine {
    public board: Board;
    public currentPlayer: Color;
    public isGameOver: boolean = false;
    public capturedPieces: any[] = [];

    public clock!: ChessClock;
    public moveHistory: MoveHistory = new MoveHistory();
    public analytics: GameAnalytics = new GameAnalytics();
    public storage: GameStorage = new GameStorage();

    private moveStartTime: number = Date.now();

    constructor(board: Board) {
        this.board = board;
        this.currentPlayer = Color.White;
    }

    public processMove(startX: number, startY: number, endX: number, endY: number, promotionChoice: string = "Queen"): boolean {
        if (this.isGameOver) return false;

        const piece = this.board.getPiece(startX, startY);
        if (!piece || piece.color !== this.currentPlayer) return false;

        if (!piece.canMove({ x: startX, y: startY }, { x: endX, y: endY }, this.board)) return false;

        if (this.wouldLeaveKingInCheck(piece, startX, startY, endX, endY)) {
            console.log("Неможливо зробити хід: король під шахом!");
            return false;
        }

        this.executeMoveLifecycle(piece, startX, startY, endX, endY, promotionChoice);
        this.handlePostMoveChecks();

        return true;
    }

    private executeMoveLifecycle(piece: Piece, startX: number, startY: number, endX: number, endY: number, promotionChoice: string): void {
        const targetPiece = this.board.cells[endY]![endX] ?? null;
        let isCaptureAction = false;

        if (targetPiece) {
            this.capturedPieces.push(targetPiece);
            isCaptureAction = true;
        }

        // Перевірка на взяття на проході (En Passant), бо targetPiece там спочатку null
        if (piece.constructor.name === "Pawn" && startX !== endX && targetPiece === null) {
            isCaptureAction = true;
        }

        this.executeMove(startX, startY, endX, endY);
        this.handleCastling(piece, startX, startY, endX, endY);
        this.handlePawnPromotion(endX, endY, promotionChoice);
        this.handleEnPassant(piece, startX, startY, endX, targetPiece);

        this.board.lastMove = { piece, startX, startY, endX, endY };

        const isPromotion = piece.constructor.name === "Pawn" && (endY === 0 || endY === 7);
        this.moveHistory.addMove(piece, startX, startY, endX, endY, targetPiece, isPromotion);

        this.trackAnalyticsData(piece);
        this.switchTurn();
        this.updateClockSystem();

        // ІНТЕЛЕКТУАЛЬНЕ СИСТЕМНЕ ВІДТВОРЕННЯ ЗВУКУ
        const soundService = SoundManager.getInstance();
        if (this.isCheck(this.currentPlayer)) {
            // Якщо після зміни черги ходу поточний гравець під шахом
            soundService.play(ChessSound.Check);
        } else if (isCaptureAction) {
            soundService.play(ChessSound.Capture);
        } else {
            soundService.play(ChessSound.Move);
        }

        this.saveCurrentState();
        this.moveStartTime = Date.now();
    }

    private handlePostMoveChecks(): void {
        if (this.isCheck(this.currentPlayer)) {
            this.analytics.registerCheck();
        }

        if (this.isStalemate(this.currentPlayer)) {
            SoundManager.getInstance().play(ChessSound.GameEnd); // Звук кінця гри
            this.terminateGame("ПАТ! Нічия.");
        }

        if (this.isCheckmate(this.currentPlayer)) {
            SoundManager.getInstance().play(ChessSound.GameEnd); // Звук кінця гри

            const winner = this.currentPlayer === Color.White ? "Чорні" : "Білі";

            // 👇 ДОДАНО: АВТОМАТИЧНИЙ ЗАПИС ПЕРЕМОЖЦЯ В LOCALSTORAGE 👇
            const winnerKey = this.currentPlayer === Color.White ? "black" : "white";
            ScoreManager.recordWin(winnerKey);

            this.terminateGame(`ШАХ І МАТ! Перемогли ${winner}! 🏆`);
        }
    }

    private terminateGame(message: string): void {
        this.isGameOver = true;
        if (this.clock) this.clock.stop();
        this.storage.clearSave();

        NotificationManager.getInstance().show(message, NotifyType.Danger, 7000);
    }

    private wouldLeaveKingInCheck(piece: Piece, startX: number, startY: number, endX: number, endY: number): boolean {
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
        this.board.cells[endY]![endX] = targetPiece;

        if (originalX !== undefined && originalY !== undefined) {
            (piece as any).x = originalX;
            (piece as any).y = originalY;
        }

        return isSelfCheck;
    }

    private executeMove(startX: number, startY: number, endX: number, endY: number): void {
        this.board.movePiece(startX, startY, endX, endY);
    }

    private handlePawnPromotion(x: number, y: number, promotionChoice: string): void {
        const piece = this.board.cells[y]![x];
        if (!piece || piece.constructor.name !== "Pawn") return;

        const pieceColorStr = piece.color.toLowerCase();
        if ((pieceColorStr === "white" && y === 0) || (pieceColorStr === "black" && y === 7)) {
            // Refactored: Використання патерну Factory замість жорсткого switch
            this.board.cells[y]![x] = PieceFactory.createPiece(promotionChoice, { x, y }, piece.color);
        }
    }

    private handleCastling(piece: Piece, startX: number, startY: number, endX: number, endY: number): void {
        if (piece instanceof King && Math.abs(startX - endX) === 2) {
            if (endX === startX + 2) {
                this.executeMove(7, startY, startX + 1, startY);
            }
            if (endX === startX - 2) {
                this.executeMove(0, startY, startX - 1, startY);
            }
        }
    }

    private handleEnPassant(piece: Piece, startX: number, startY: number, endX: number, targetPiece: Piece | null): void {
        if (piece.constructor.name === "Pawn" && startX !== endX && targetPiece === null) {
            this.board.cells[startY]![endX] = null;
        }
    }

    public switchTurn(): void {
        this.currentPlayer = this.currentPlayer === Color.White ? Color.Black : Color.White;
    }

    private updateClockSystem(): void {
        if (this.clock) {
            const currentClockColor = this.currentPlayer.toLowerCase() as "white" | "black";
            this.clock.startOrSwitch(currentClockColor);
        }
    }

    private trackAnalyticsData(piece: Piece): void {
        const moveEndTime = Date.now();
        const durationSeconds = parseFloat(((moveEndTime - this.moveStartTime) / 1000).toFixed(1));
        this.analytics.registerMove(piece, durationSeconds);
    }

    private saveCurrentState(): void {
        const boardMatrix = [];
        for (let y = 0; y < 8; y++) {
            const row = [];
            for (let x = 0; x < 8; x++) {
                const piece = this.board.cells[y]![x];
                row.push(piece ? { type: piece.constructor.name, color: piece.color } : null);
            }
            boardMatrix.push(row);
        }

        this.storage.saveGame({
            boardMatrix,
            currentPlayer: this.currentPlayer,
            capturedPiecesData: this.capturedPieces.map(p => ({ type: p.constructor.name, color: p.color })),
            formattedHistory: this.moveHistory.getFormattedHistory()
        });
    }

    public loadSavedGameIfPresent(): boolean {
        if (!this.storage.hasSavedGame()) return false;
        const savedState = this.storage.loadGame();
        if (!savedState) return false;

        try {
            this.currentPlayer = savedState.currentPlayer.toLowerCase() === "white" ? Color.White : Color.Black;

            this.capturedPieces = savedState.capturedPiecesData.map(p => ({
                color: p.color,
                constructor: { name: p.type }
            }));

            if (this.moveHistory && (this.moveHistory as any).moves !== undefined) {
                (this.moveHistory as any).moves = [...savedState.formattedHistory];
            }

            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    const cellData = savedState.boardMatrix[y]![x];
                    if (cellData) {
                        const pColor = cellData.color.toLowerCase() === "white" ? Color.White : Color.Black;
                        const pPos = { x, y };
                        let newPiece;

                        // Refactored: Використання патерну Factory для відновлення фігур
                        this.board.cells[y]![x] = PieceFactory.createPiece(cellData.type, pPos, pColor);
                    } else {
                        this.board.cells[y]![x] = null;
                    }
                }
            }
            return true;
        } catch (e) {
            this.storage.clearSave();
            return false;
        }
    }

    public isCheck(color: Color): boolean {
        let kingX = -1;
        let kingY = -1;

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board.cells[j]![i] instanceof King && this.board.cells[j]![i]?.color === color) {
                    kingX = i;
                    kingY = j;
                }
            }
        }

        if (kingX === -1 || kingY === -1) return true;

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.board.cells[j]![i];
                if (piece instanceof Piece && piece.color !== color) {
                    if (piece.canMove({ x: i, y: j }, { x: kingX, y: kingY }, this.board)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public isCheckmate(color: Color): boolean {
        if (!this.isCheck(color)) return false;
        return this.hasNoValidMoves(color);
    }

    public isStalemate(color: Color): boolean {
        if (this.isCheck(color)) return false;
        return this.hasNoValidMoves(color);
    }

    private hasNoValidMoves(color: Color): boolean {
        for (let startX = 0; startX < 8; startX++) {
            for (let startY = 0; startY < 8; startY++) {
                const piece = this.board.cells[startY]![startX];
                if (piece instanceof Piece && piece.color === color) {
                    for (let endX = 0; endX < 8; endX++) {
                        for (let endY = 0; endY < 8; endY++) {
                            if (startX === endX && startY === endY) continue;
                            if (piece.canMove({ x: startX, y: startY }, { x: endX, y: endY }, this.board)) {
                                const targetPiece = this.board.cells[endY]![endX] ?? null;
                                if (targetPiece && targetPiece.color === color) continue;

                                if (!this.wouldLeaveKingInCheck(piece, startX, startY, endX, endY)) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    public getValidMoves(startX: number, startY: number): { x: number, y: number }[] {
        const validMoves: { x: number, y: number }[] = [];
        const piece = this.board.getPiece(startX, startY);

        if (!piece || piece.color !== this.currentPlayer) return validMoves;

        for (let endX = 0; endX < 8; endX++) {
            for (let endY = 0; endY < 8; endY++) {
                if (startX === endX && startY === endY) continue;

                if (piece.canMove({ x: startX, y: startY }, { x: endX, y: endY }, this.board)) {
                    if (!this.wouldLeaveKingInCheck(piece, startX, startY, endX, endY)) {
                        validMoves.push({ x: endX, y: endY });
                    }
                }
            }
        }
        return validMoves;
    }

    public restart(): void {
        this.isGameOver = false;
        this.currentPlayer = Color.White;
        this.capturedPieces = [];
        this.moveHistory.clear();
        this.board.resetBoard();
        this.analytics.reset();
        this.storage.clearSave();
        this.moveStartTime = Date.now();

        if (this.clock) {
            this.clock.reset(5);
        }
    }
}
