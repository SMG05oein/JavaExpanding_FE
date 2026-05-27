import { useCallback } from 'react';
import axios from 'axios';
import useReservationStore from '../../store/reservationStore';


const useReservationApi = () => {
    const baseURL = process.env.REACT_APP_API_URL;


    // Zustand actions
    const setFacilities = useReservationStore((s) => s.setFacilities);
    const setAllFacilities = useReservationStore((s) => s.setAllFacilities);
    const setReservations = useReservationStore((s) => s.setReservations);
    const setIsFacilitiesLoading = useReservationStore((s) => s.setIsFacilitiesLoading);
    const setFacilitiesError = useReservationStore((s) => s.setFacilitiesError);

    // 1. 시설 및 운영 시간 로드
    const loadFacilities = useCallback(async () => {
        setIsFacilitiesLoading(true);
        setFacilitiesError(null);
        try {
            const response = await axios.get(`${baseURL}/api/facility/list?page=0`, {
                headers: { Accept: '*/*' }
            });

            const pageContent = Array.isArray(response?.data?.content) ? response.data.content : [];
            
            const mappedFacilities = await Promise.all(
                pageContent.map(async (facility) => {
                    let open_time = '09:00';
                    let close_time = '22:00';
                    let facility_times = [];
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

                        const timeRes = await axios.get(`${baseURL}/api/facility-time/admin/list/${facility.facIdx}`, { headers });
                        
                        if (Array.isArray(timeRes.data) && timeRes.data.length > 0) {
                            facility_times = timeRes.data.map(d => ({
                                day: d.facDay,
                                open: formatTime(d.facOpen),
                                close: formatTime(d.facClose),
                                status: d.facTimeStatus
                            }));
                            const activeTime = timeRes.data.find((d) => d.facTimeStatus === '운영중') || timeRes.data[0];
                            if (activeTime.facOpen) open_time = formatTime(activeTime.facOpen);
                            if (activeTime.facClose) close_time = formatTime(activeTime.facClose);
                        }
                    } catch (err) {
                        // 폴백값 유지
                    }

                    return {
                        id: `fac-${facility.facIdx}`,
                        name: facility.facName,
                        location: facility.facLocation,
                        description: facility.facDescription ?? '',
                        capacity: 10,
                        status: 'AVAILABLE',
                        requires_approval: true,
                        open_time,
                        close_time,
                        facility_times,
                        created_by: 'admin',
                    };
                })
            );

            setFacilities(mappedFacilities);
            setIsFacilitiesLoading(false);
        } catch (error) {
            console.error('시설 목록 조회 실패:', error);
            setFacilitiesError('시설 목록을 불러오지 못했습니다.');
            setIsFacilitiesLoading(false);
        }
    }, [baseURL, setFacilities, setIsFacilitiesLoading, setFacilitiesError]);

    // 2. 로그인된 사용자의 예약 목록 조회
    const loadMyReservations = useCallback(async () => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        if (!token && !refreshToken) return;
        try {
            const response = await axios.get(`${baseURL}/api/reservation/my?page=0`, {
                headers: {
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
                reject_reason: res.rejectReason || '',
                created_at: res.resCreateDt || new Date().toISOString(),
                updated_at: res.resUpdateDt || new Date().toISOString(),
            }));

            setReservations(mappedReservations);
        } catch (error) {
            console.error('내 예약 목록 로드 실패:', error);
        }
    }, [baseURL, setReservations]);

    // 3. 예약 생성
    const createReservation = useCallback(async ({ facilityId, date, startTime, endTime, purpose, headcount }) => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        if (!token && !refreshToken) return { success: false, message: '로그인이 필요합니다.' };

        const facIdx = parseInt(facilityId.replace('fac-', ''));
        if (isNaN(facIdx)) {
            return { success: false, message: '시설 ID가 유효하지 않습니다.' };
        }

        try {
            const formatTimeString = (timeStr) => {
                if (!timeStr) return '';
                const parts = timeStr.split(':');
                if (parts.length === 2) {
                    return `${parts[0]}:${parts[1]}:00`;
                }
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
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                }
            });

            await loadMyReservations();

            return {
                success: true,
                message: '예약 신청이 접수되었습니다. 관리자 승인 대기 상태로 전환됩니다.'
            };
        } catch (error) {
            console.error('예약 생성 API 에러:', error);
            const errMsg = error.response?.data?.message || error.response?.data || '예약 생성에 실패했습니다.';
            return { success: false, message: errMsg };
        }
    }, [baseURL, loadMyReservations]);

    // 4. 예약 취소
    const cancelReservation = useCallback(async (reservationId) => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        if (!token && !refreshToken) return { success: false, message: '로그인이 필요합니다.' };

        const resIdx = parseInt(reservationId.replace('res-', ''));
        if (isNaN(resIdx)) {
            return { success: false, message: '예약 ID가 유효하지 않습니다.' };
        }

        try {
            await axios.post(`${baseURL}/api/reservation/cancel/${resIdx}`, {}, {
                headers: {
                    'Accept': '*/*'
                }
            });

            await loadMyReservations();
            return { success: true, message: '예약이 성공적으로 취소되었습니다.' };
        } catch (error) {
            console.error('예약 취소 API 에러:', error);
            const errMsg = error.response?.data?.message || '예약 취소에 실패했습니다.';
            return { success: false, message: errMsg };
        }
    }, [baseURL, loadMyReservations]);

    // 5. 전체 시설 목록 로드 (실시간 예약하기 전용)
    const loadAllFacilities = useCallback(async () => {
        try {
            const response = await axios.get(`${baseURL}/api/facility/allList`, {
                headers: { Accept: '*/*' }
            });
            const data = Array.isArray(response?.data) ? response.data : [];
            const mapped = data.map((facility) => ({
                id: `fac-${facility.facIdx}`,
                name: facility.facName,
                location: '학내 구장/세미나실',
                capacity: 10,
                status: 'AVAILABLE',
                open_time: '09:00',
                close_time: '22:00'
            }));

            const mappedWithTimes = await Promise.all(
                mapped.map(async (fac) => {
                    let open_time = '09:00';
                    let close_time = '22:00';
                    let facility_times = [];
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
                        const timeIdx = fac.id.replace('fac-', '');
                        const timeRes = await axios.get(`${baseURL}/api/facility-time/admin/list/${timeIdx}`, { headers });
                        if (Array.isArray(timeRes.data) && timeRes.data.length > 0) {
                            facility_times = timeRes.data.map(d => ({
                                day: d.facDay,
                                open: formatTime(d.facOpen),
                                close: formatTime(d.facClose),
                                status: d.facTimeStatus
                            }));
                            const activeTime = timeRes.data.find((d) => d.facTimeStatus === '운영중') || timeRes.data[0];
                            if (activeTime.facOpen) open_time = formatTime(activeTime.facOpen);
                            if (activeTime.facClose) close_time = formatTime(activeTime.facClose);
                        }
                    } catch (e) {}
                    return { ...fac, open_time, close_time, facility_times };
                })
            );

            setAllFacilities(mappedWithTimes);
        } catch (error) {
            console.error('전체 시설 목록 조회 실패:', error);
        }
    }, [baseURL, setAllFacilities]);

    // 6. 예약 수정
    const updateReservation = useCallback(async (reservationId, { facilityId, date, startTime, endTime, purpose, headcount }) => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        if (!token && !refreshToken) return { success: false, message: '로그인이 필요합니다.' };

        const resIdx = parseInt(reservationId.replace('res-', ''));
        if (isNaN(resIdx)) {
            return { success: false, message: '예약 ID가 유효하지 않습니다.' };
        }

        const facIdx = parseInt(facilityId.replace('fac-', ''));
        if (isNaN(facIdx)) {
            return { success: false, message: '시설 ID가 유효하지 않습니다.' };
        }

        try {
            const formatTimeString = (timeStr) => {
                if (!timeStr) return '';
                const parts = timeStr.split(':');
                if (parts.length === 2) {
                    return `${parts[0]}:${parts[1]}:00`;
                }
                return timeStr;
            };

            const formattedStart = formatTimeString(startTime);
            const formattedEnd = formatTimeString(endTime);

            await axios.post(`${baseURL}/api/reservation/update/${resIdx}`, {
                facIdx,
                resDate: date,
                resStart: formattedStart,
                resEnd: formattedEnd,
                resPurpose: purpose,
                resHeadcount: parseInt(headcount)
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                }
            });

            await loadMyReservations();

            return {
                success: true,
                message: '예약이 성공적으로 수정되었습니다.'
            };
        } catch (error) {
            console.error('예약 수정 API 에러:', error);
            const errMsg = error.response?.data?.message || error.response?.data || '예약 수정에 실패했습니다.';
            return { success: false, message: errMsg };
        }
    }, [baseURL, loadMyReservations]);

    return {
        loadFacilities,
        loadMyReservations,
        createReservation,
        cancelReservation,
        loadAllFacilities,
        updateReservation
    };
};

export default useReservationApi;
