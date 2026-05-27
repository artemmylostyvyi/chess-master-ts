import { Color } from "../models/types.js";

export interface SavedGameState {
    boardMatrix: Array<Array<{ type: string; color: string } | null>>;
    currentPlayer: Color;
    capturedPiecesData: Array<{ type: string; color: string }>;
    formattedHistory: string[];
}

// Новий інтерфейс-абстракція для механізму збереження даних
export interface IStorageBackend {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

export class GameStorage {
    private readonly STORAGE_KEY = "chess_game_save_state";
    private readonly backend: IStorageBackend;

    // Впроваджуємо залежність через конструктор. 
    // Якщо бекенд не передано, за замовчуванням використовується стандартний localStorage
    constructor(backend: IStorageBackend = localStorage) {
        this.backend = backend;
    }

    public saveGame(state: SavedGameState): boolean {
        try {
            this.backend.setItem(this.STORAGE_KEY, JSON.stringify(state));
            return true;
        } catch (error) {
            console.error("Помилка збереження гри:", error);
            return false;
        }
    }

    public loadGame(): SavedGameState | null {
        try {
            const data = this.backend.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error("Помилка завантаження гри:", error);
            return null;
        }
    }

    public clearSave(): void {
        this.backend.removeItem(this.STORAGE_KEY);
    }

    public hasSavedGame(): boolean {
        return this.backend.getItem(this.STORAGE_KEY) !== null;
    }
}
