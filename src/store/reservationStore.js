import { create } from 'zustand';
import axios from 'axios';

const useReservationStore = create((set, get) => ({
    facilities: [],
    reservations: [],
    isFacilitiesLoading: false,
    facilitiesError: null,

    // 시설 및 운영 시간 로드
    loadFacilities: async () => {
        set({ isFacilitiesLoading: true, facilitiesError: null });
        try {
            const baseURL = process.env.REACT_APP_API_URL;
            const response = await axios.get(`${baseURL}/api/facility/list?page=0`, {
                headers: {
                    Accept: '*/*',
                },
            });

            const pageContent = Array.isArray(response?.data?.content) ? response.data.content : [];

            // 각 시설별 운영 시간을 병렬로 조회하여 결합
            const mappedFacilities = await Promise.all(
                pageContent.map(async (facility) => {
                    let open_time = '09:00';
                    let close_time = '22:00';
                    try {
                        const token = localStorage.getItem('token');
                        const headers = token ? { Authorization: `Bearer ${token}` } : {};
                        const formatTime = (time) => {
                            if (!time) return '';
                            if (typeof time === 'string') return time.slice(0, 5);
                            const hour = String(time.hour !== undefined ? time.hour : 0).padStart(2, '0');
                            const minute = String(time.minute !== undefined ? time.minute : 0).padStart(2, '0');
                            return `${hour}:${minute}`;
                        };

                        const timeRes = await axios.get(`${baseURL}/api/facility-time/list/${facility.facIdx}`, { headers });

                        if (Array.isArray(timeRes.data) && timeRes.data.length > 0) {
                            // OPEN 상태인 설정 또는 첫 번째 설정 선택
                            const activeTime = timeRes.data.find((d) => d.facTimeStatus === 'OPEN') || timeRes.data[0];
                            if (activeTime.facOpen) open_time = formatTime(activeTime.facOpen);
                            if (activeTime.facClose) close_time = formatTime(activeTime.facClose);
                        }
                    } catch (err) {
                        // 권한 미달 또는 설정이 없는 경우 조용히 폴백값 유지
                    }

                    return {
                        id: `fac-${facility.facIdx}`,
                        name: facility.facName,
                        location: facility.facLocation,
                        description: facility.facDescription ?? '',
                        capacity: 10,
                        status: 'AVAILABLE', // 관리 기능이 추가되기 전까지는 기본값 사용
                        requires_approval: true,
                        open_time,
                        close_time,
                        created_by: 'admin',
                    };
                })
            );

            set({
                facilities: mappedFacilities,
                isFacilitiesLoading: false,
                facilitiesError: null,
            });
        } catch (error) {
            console.error('시설 목록 조회 실패:', error);
            set({
                isFacilitiesLoading: false,
                facilitiesError: '시설 목록을 불러오지 못했습니다.',
            });
        }
    },

    // 로그인된 사용자의 예약 목록 조회
    loadMyReservations: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const baseURL = process.env.REACT_APP_API_URL;
            const response = await axios.get(`${baseURL}/api/reservation/my?page=0`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': '*/*'
                }
            });

            const content = Array.isArray(response?.data?.content) ? response.data.content : (Array.isArray(response?.data) ? response.data : []);

            const formatTime = (time) => {
                if (!time) return '';
                if (typeof time === 'string') return time.slice(0, 5);
                const hour = String(time.hour !== undefined ? time.hour : 0).padStart(2, '0');
                const minute = String(time.minute !== undefined ? time.minute : 0).padStart(2, '0');
                return `${hour}:${minute}`;
            };

            const mappedReservations = content.map((res) => ({
                id: `res-${res.resIdx}`,
                user_id: res.user?.userId || res.userId || 'user',
                facility_id: `fac-${res.facility?.facIdx || res.facIdx}`,
                facility_name: res.facility?.facName || '',
                reservation_date: res.resDate,
                start_time: formatTime(res.resStart),
                end_time: formatTime(res.resEnd),
                purpose: res.resPurpose,
                status: res.resStatus || '대기',
                headcount: res.resHeadcount,
                created_at: res.resCreateDt || new Date().toISOString(),
                updated_at: res.resUpdateDt || new Date().toISOString(),
            }));

            set({ reservations: mappedReservations });
        } catch (error) {
            console.error('내 예약 목록 로드 실패:', error);
        }
    },

    // 시설 단일 조회
    getFacilityById: (id) =>
        get().facilities.find((f) => f.id === id) ?? null,

    getAvailableFacilities: () =>
        get().facilities.filter((f) => f.status === 'AVAILABLE'),

    // 예약 조회
    getReservationsByUser: (userId) => {
        // 이미 내 예약 API로 조회된 내역을 리턴하므로 필터링 없이 리스트 반환
        return get().reservations;
    },

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

    // 예약 생성 (API 연동)
    createReservation: async ({ facilityId, date, startTime, endTime, purpose, headcount }) => {
        const token = localStorage.getItem('token');
        if (!token) return { success: false, message: '로그인이 필요합니다.' };

        const facIdx = parseInt(facilityId.replace('fac-', ''));
        if (isNaN(facIdx)) {
            return { success: false, message: '시설 ID가 유효하지 않습니다.' };
        }

        try {
            const baseURL = process.env.REACT_APP_API_URL;

            // HH:MM 또는 HH:MM:SS -> 문자열 포맷으로 변환
            const formatTimeString = (timeStr) => {
                if (!timeStr) return '';
                const parts = timeStr.split(':');
                if (parts.length === 2) {
                    // HH:MM -> HH:MM:00
                    return `${parts[0]}:${parts[1]}:00`;
                }
                // 이미 HH:MM:SS 형태일 경우 그대로 반환
                return timeStr;
            };

            const formattedStart = formatTimeString(startTime);
            const formattedEnd = formatTimeString(endTime);

            await axios.post(`${baseURL}/api/reservation/create`, {
                facIdx,
                resDate: date,
                resStart: formattedStart,
                resEnd: formattedEnd,
                resPurpose: purpose,
                resHeadcount: parseInt(headcount)
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                }
            });

            // 생성 성공 후 예약 내역 리로드
            await get().loadMyReservations();

            return {
                success: true,
                message: '예약 신청이 접수되었습니다. 관리자 승인 대기 상태로 전환됩니다.'
            };
        } catch (error) {
            console.error('예약 생성 API 에러:', error);
            const errMsg = error.response?.data?.message || error.response?.data || '예약 생성에 실패했습니다.';
            return { success: false, message: errMsg };
        }
    },

    // 예약 취소 (API 연동)
    cancelReservation: async (reservationId) => {
        const token = localStorage.getItem('token');
        if (!token) return { success: false, message: '로그인이 필요합니다.' };

        const resIdx = parseInt(reservationId.replace('res-', ''));
        if (isNaN(resIdx)) {
            return { success: false, message: '예약 ID가 유효하지 않습니다.' };
        }

        try {
            const baseURL = process.env.REACT_APP_API_URL;
            await axios.post(`${baseURL}/api/reservation/cancel/${resIdx}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': '*/*'
                }
            });

            // 취소 완료 후 내 예약 리스트 갱신
            await get().loadMyReservations();
            return { success: true, message: '예약이 성공적으로 취소되었습니다.' };
        } catch (error) {
            console.error('예약 취소 API 에러:', error);
            const errMsg = error.response?.data?.message || '예약 취소에 실패했습니다.';
            return { success: false, message: errMsg };
        }
    },
}));

export default useReservationStore;
