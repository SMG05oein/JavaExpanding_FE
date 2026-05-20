import { create } from 'zustand';

const useReservationStore = create((set, get) => ({
    facilities: [],
    reservations: [],
    isFacilitiesLoading: false,
    facilitiesError: null,

    // Setters
    setFacilities: (facilities) => set({ facilities }),
    setReservations: (reservations) => set({ reservations }),
    setIsFacilitiesLoading: (isFacilitiesLoading) => set({ isFacilitiesLoading }),
    setFacilitiesError: (facilitiesError) => set({ facilitiesError }),

    // 시설 단일 조회
    getFacilityById: (id) =>
        get().facilities.find((f) => f.id === id) ?? null,

    getAvailableFacilities: () =>
        get().facilities.filter((f) => f.status === 'AVAILABLE'),

    // 예약 조회
    getReservationsByUser: (userId) => {
        return get().reservations;
    },

    getReservationsByFacility: (facilityId) =>
        get().reservations.filter((r) => r.facility_id === facilityId),

    // 시간 중복 체크
    hasConflict: (facilityId, date, startTime, endTime, excludeId = null) => {
        return get().reservations.some((r) => {
            if (r.facility_id !== facilityId) return false;
            if (r.reservation_date !== date) return false;
            if (r.status === 'CANCELLED' || r.status === 'REJECTED' || r.status === '취소' || r.status === '거절') return false;
            if (excludeId && r.id === excludeId) return false;
            return !(endTime <= r.start_time || startTime >= r.end_time);
        });
    },
}));

export default useReservationStore;
