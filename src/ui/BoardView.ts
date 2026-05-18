// src/ui/BoardView.ts
import { Board } from "../models/Board.js";
import { type GameEngine } from "../core/GameEngine.js";
import { Color } from "../models/types.js";

export class BoardView {
    private game: GameEngine;
    private board: Board;
    private container: HTMLElement;
    private selectedCell: { x: number; y: number } | null = null;

    private onMoveSuccess?: (() => void) | undefined;

    constructor(game: GameEngine, onMoveSuccess?: () => void) {
        this.game = game;
        this.board = game.board;
        this.onMoveSuccess = onMoveSuccess;

        const container = document.getElementById("board");
        if (!container) throw new Error("Container element not found");
        this.container = container;

        this.render();
        this.initEventListeners();

        document.addEventListener("game-restarted", () => {
            this.render();
        });
    }

    public render() {
        this.container.innerHTML = "";

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const cellElement = document.createElement("div");
                cellElement.setAttribute("data-x", x.toString());
                cellElement.setAttribute("data-y", y.toString());
                cellElement.classList.add("cell");

                const isBlack = (x + y) % 2 === 1;
                cellElement.classList.add(isBlack ? "black" : "white");

                const piece = this.board.cells[y]![x];
                if (piece) {
                    const img = document.createElement("img");
                    img.src = `/assets/images/${piece.color.toLowerCase()}-${piece.type.toLowerCase()}.png`;
                    cellElement.appendChild(img);

                    if (piece.type === "King" && piece.color === this.game.currentPlayer) {
                        if (this.game.isCheck(this.game.currentPlayer)) {
                            cellElement.classList.add("in-check");
                        }
                    }
                }
                this.container.appendChild(cellElement);
            }
        }
    }

    private clearMoveHints() {
        const hints = this.container.querySelectorAll('.possible-move, .possible-capture');
        hints.forEach(hint => hint.classList.remove('possible-move', 'possible-capture'));
    }

    private showMoveHints(startX: number, startY: number) {
        const validMoves = this.game.getValidMoves(startX, startY);

        for (const move of validMoves) {
            const cellElement = this.container.querySelector(`.cell[data-x="${move.x}"][data-y="${move.y}"]`);
            if (!cellElement) continue;

            const targetPiece = this.board.cells[move.y]![move.x];
            cellElement.classList.add(targetPiece ? 'possible-capture' : 'possible-move');
        }
    }

    initEventListeners() {
        this.container.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            const cell = target.closest('.cell') as HTMLElement;
            if (!cell) return;

            const x = Number(cell.getAttribute("data-x"));
            const y = Number(cell.getAttribute("data-y"));
            const clickedPiece = this.board.cells[y]![x];

            if (this.selectedCell) {
                if (this.selectedCell.x === x && this.selectedCell.y === y) {
                    this.resetSelection();
                    return;
                }

                const pieceInHand = this.board.cells[this.selectedCell.y]![this.selectedCell.x];

                if (clickedPiece && pieceInHand && clickedPiece.color === pieceInHand.color) {
                    this.changeSelection(cell, x, y);
                    return;
                }

                let promotionChoice = "Queen";
                if (pieceInHand && pieceInHand.type === "Pawn") {
                    const isWhitePromotion = pieceInHand.color === "white" && y === 0;
                    const isBlackPromotion = pieceInHand.color === "black" && y === 7;

                    if (isWhitePromotion || isBlackPromotion) {
                        promotionChoice = await this.askPromotionPiece(pieceInHand.color);
                    }
                }

                const moveSuccessful = this.game.processMove(this.selectedCell.x, this.selectedCell.y, x, y, promotionChoice);

                if (moveSuccessful) {
                    this.selectedCell = null;
                    this.render();

                    if (this.onMoveSuccess) this.onMoveSuccess();

                    setTimeout(() => {
                        if (this.game.isCheckmate && this.game.isCheckmate(this.game.currentPlayer)) {
                            const winner = this.game.currentPlayer === Color.White ? "Чорні" : "Білі";
                            alert(`Шах і мат! Перемогли ${winner}! 🏆`);
                        }
                    }, 100);
                } else {
                    console.log("Хід заборонено правилами!");
                    this.resetSelection();
                }

            } else {
                if (clickedPiece && clickedPiece.color === this.game.currentPlayer) {
                    this.changeSelection(cell, x, y);
                }
            }
        });
    }

    private resetSelection() {
        this.selectedCell = null;
        const previouslySelected = this.container.querySelector('.cell.selected');
        if (previouslySelected) previouslySelected.classList.remove('selected');
        this.clearMoveHints();
    }

    private changeSelection(cell: HTMLElement, x: number, y: number) {
        const previouslySelected = this.container.querySelector('.cell.selected');
        if (previouslySelected) previouslySelected.classList.remove('selected');

        this.selectedCell = { x, y };
        cell.classList.add('selected');

        this.clearMoveHints();
        this.showMoveHints(x, y);
    }

    private async askPromotionPiece(color: string): Promise<string> {
        return new Promise((resolve) => {
            const modal = document.getElementById("promotion-modal");
            const optionsContainer = document.getElementById("promotion-options");
            if (!modal || !optionsContainer) {
                resolve("Queen");
                return;
            }

            optionsContainer.innerHTML = "";
            const pieces = ["Queen", "Rook", "Bishop", "Knight"];

            pieces.forEach(pieceName => {
                const img = document.createElement("img");
                img.src = `/assets/images/${color.toLowerCase()}-${pieceName.toLowerCase()}.png`;

                img.onclick = () => {
                    modal.classList.add("hidden");
                    resolve(pieceName);
                };
                optionsContainer.appendChild(img);
            });

            modal.classList.remove("hidden");
        });
    }
}