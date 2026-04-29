import { create } from 'zustand';

// 임시 하드코딩 데이터 (추후 API 연동 가능)
const initialFacilities = [
    {
        id: 'fac-001',
        name: 'A구장 (야외)',
        location: '본교 1층',
        description: '야외 코트와 벤치',
        capacity: 10,
        status: 'AVAILABLE',       // AVAILABLE | UNAVAILABLE | MAINTENANCE
        requires_approval: false,
        open_time: '09:00',
        close_time: '21:00',
        created_by: 'admin-001',
    },
    {
        id: 'fac-002',
        name: 'B구장 (야외)',
        location: '본교 1층',
        description: '조명 시설이 있는 코트',
        capacity: 10,
        status: 'AVAILABLE',
        requires_approval: true,
        open_time: '09:00',
        close_time: '22:00',
        created_by: 'admin-001',
    },
    {
        id: 'fac-003',
        name: 'C구장 (실내)',
        location: '체육관',
        description: '실내 코트 6인 기준',
        capacity: 6,
        status: 'MAINTENANCE',
        requires_approval: false,
        open_time: '08:00',
        close_time: '20:00',
        created_by: 'admin-001',
    },
];

const initialReservations = [
    {
        id: 'res-001',
        user_id: 'user-001',
        facility_id: 'fac-001',
        reservation_date: '2026-04-10',
        start_time: '14:00',
        end_time: '16:00',
        purpose: '체육 수업',
        status: 'APPROVED',        // PENDING | APPROVED | REJECTED | CANCELLED
        headcount: 8,
        created_at: '2026-04-05T10:00:00',
        updated_at: '2026-04-05T11:00:00',
    },
    {
        id: 'res-002',
        user_id: 'user-001',
        facility_id: 'fac-002',
        reservation_date: '2026-04-12',
        start_time: '18:00',
        end_time: '20:00',
        purpose: '동아리 경기',
        status: 'PENDING',
        headcount: 10,
        created_at: '2026-04-06T14:00:00',
        updated_at: '2026-04-06T14:00:00',
    },
];

let nextResIndex = 3;

const useReservationStore = create((set, get) => ({
    facilities: initialFacilities,
    reservations: initialReservations,

    // 시설 조회
    getFacilityById: (id) =>
        get().facilities.find((f) => f.id === id) ?? null,

    getAvailableFacilities: () =>
        get().facilities.filter((f) => f.status === 'AVAILABLE'),

    // 예약 조회
    getReservationsByUser: (userId) =>
        get().reservations.filter((r) => r.user_id === userId),

    getReservationsByFacility: (facilityId) =>
        get().reservations.filter((r) => r.facility_id === facilityId),

    // 시간 중복 체크
    hasConflict: (facilityId, date, startTime, endTime, excludeId = null) => {
        return get().reservations.some((r) => {
            if (r.facility_id !== facilityId) return false;
            if (r.reservation_date !== date) return false;
            if (r.status === 'CANCELLED' || r.status === 'REJECTED') return false;
            if (excludeId && r.id === excludeId) return false;
            return !(endTime <= r.start_time || startTime >= r.end_time);
        });
    },

    // 예약 생성
    createReservation: ({ facilityId, date, startTime, endTime, purpose, headcount, userId }) => {
        const facility = get().getFacilityById(facilityId);
        if (!facility) return { success: false, message: '시설을 찾을 수 없습니다.' };

        if (get().hasConflict(facilityId, date, startTime, endTime)) {
            return { success: false, message: '해당 시간대에 이미 예약이 있습니다.' };
        }

        const newRes = {
            id: `res-${String(++nextResIndex).padStart(3, '0')}`,
            user_id: userId,
            facility_id: facilityId,
            reservation_date: date,
            start_time: startTime,
            end_time: endTime,
            purpose,
            headcount,
            status: facility.requires_approval ? 'PENDING' : 'APPROVED',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        set((state) => ({ reservations: [...state.reservations, newRes] }));

        const message = facility.requires_approval
            ? '예약이 접수되었습니다. 관리자 승인 후 확정됩니다.'
            : '예약이 완료되었습니다.';

        return { success: true, message, reservation: newRes };
    },

    // 예약 취소
    cancelReservation: (reservationId, userId) => {
        const res = get().reservations.find((r) => r.id === reservationId);
        if (!res) return { success: false, message: '예약을 찾을 수 없습니다.' };
        if (res.user_id !== userId) return { success: false, message: '권한이 없습니다.' };
        if (!['PENDING', 'APPROVED'].includes(res.status)) {
            return { success: false, message: '취소할 수 없는 상태입니다.' };
        }

        set((state) => ({
            reservations: state.reservations.map((r) =>
                r.id === reservationId
                    ? { ...r, status: 'CANCELLED', updated_at: new Date().toISOString() }
                    : r
            ),
        }));

        return { success: true, message: '예약이 취소되었습니다.' };
    },
}));

export default useReservationStore;
