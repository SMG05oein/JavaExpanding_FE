import { create } from 'zustand';

const useLoadingStore = create((set) => ({
    isLoading: false,
    activeRequests: 0,
    startLoading: () => set((state) => ({ 
        activeRequests: state.activeRequests + 1,
        isLoading: true 
    })),
    stopLoading: () => set((state) => {
        const nextRequests = Math.max(0, state.activeRequests - 1);
        return {
            activeRequests: nextRequests,
            isLoading: nextRequests > 0
        };
    }),
    resetLoading: () => set({ isLoading: false, activeRequests: 0 })
}));

export default useLoadingStore;
