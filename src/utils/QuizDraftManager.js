import { apiClient } from "../App";

class QuizDraftManager {
    constructor() {
        this.intervalId = null;
    }

    /**
     * Saves draft data to localStorage
     */
    saveLocal(quizId, data) {
        const key = `quiz_draft_${quizId}`;
        localStorage.setItem(key, JSON.stringify({
            data,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Retrieves draft data from localStorage
     */
    getLocal(quizId) {
        const key = `quiz_draft_${quizId}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Clears draft data
     */
    clearLocal(quizId) {
        localStorage.removeItem(`quiz_draft_${quizId}`);
    }

    /**
     * Syncs draft data with the backend server
     */
    async syncWithServer(quizId, data) {
        try {
            await apiClient.post("/quiz/autosave", {
                quiz_id: quiz_id,
                draft_data: data
            });
            console.log(`[QuizDraftManager] Server autosave successful for ${quizId}`);
            return true;
        } catch (error) {
            console.error(`[QuizDraftManager] Server autosave failed:`, error);
            return false;
        }
    }

    /**
     * Starts periodic autosave (every 30 seconds)
     */
    startAutosave(quizId, dataGetter, onSyncStatusChange) {
        if (this.intervalId) this.stopAutosave();

        this.intervalId = setInterval(async () => {
            const data = dataGetter();
            if (!data) return;

            // Always save local first
            this.saveLocal(quizId, data);

            // Async sync with server
            if (onSyncStatusChange) onSyncStatusChange('syncing');
            const success = await this.syncWithServer(quizId, data);
            if (onSyncStatusChange) onSyncStatusChange(success ? 'synced' : 'error');
        }, 30000); // 30 seconds
    }

    /**
     * Stops periodic autosave
     */
    stopAutosave() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

export const draftManager = new QuizDraftManager();
