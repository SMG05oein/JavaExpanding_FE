import { useCallback } from 'react';
import axios from 'axios';

const useAdminApi = () => {
    const baseURL = process.env.REACT_APP_API_URL;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            Accept: '*/*',
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    };

    /* ─────────────────────────────────────────
       예약 관리
    ───────────────────────────────────────── */
    const loadAllReservations = useCallback(async (page = 0) => {
        const res = await axios.get(
            `${baseURL}/api/reservation/admin/list?page=${page}`,
            { headers: getAuthHeaders() }
        );
        return res.data; // { content, totalPages, totalElements, ... }
    }, [baseURL]);

    const deleteReservation = useCallback(async (resIdx) => {
        await axios.delete(
            `${baseURL}/api/reservation/admin/delete/${resIdx}`,
            { headers: getAuthHeaders() }
        );
    }, [baseURL]);

    /* ─────────────────────────────────────────
       승인/반려 관리
    ───────────────────────────────────────── */
    const processApproval = useCallback(async ({ resIdx, appIsApprov, appComment = '' }) => {
        await axios.post(
            `${baseURL}/api/approval/admin/process`,
            { resIdx, appIsApprov, appComment },
            { headers: getAuthHeaders() }
        );
    }, [baseURL]);

    const loadApprovals = useCallback(async (page = 0) => {
        const res = await axios.get(
            `${baseURL}/api/approval/admin/list?page=${page}`,
            { headers: getAuthHeaders() }
        );
        return res.data;
    }, [baseURL]);

    /* ─────────────────────────────────────────
       시설물 관리
    ───────────────────────────────────────── */
    const loadFacilitiesAdmin = useCallback(async (page = 0) => {
        const res = await axios.get(
            `${baseURL}/api/facility/list?page=${page}`,
            { headers: getAuthHeaders() }
        );
        return res.data;
    }, [baseURL]);

    const createFacility = useCallback(async ({ facName, facLocation, facDescription }) => {
        await axios.post(
            `${baseURL}/api/facility/admin/create`,
            { facName, facLocation, facDescription },
            { headers: getAuthHeaders() }
        );
    }, [baseURL]);

    const updateFacility = useCallback(async (id, { facName, facLocation, facDescription }) => {
        await axios.post(
            `${baseURL}/api/facility/admin/update/${id}`,
            { facName, facLocation, facDescription },
            { headers: getAuthHeaders() }
        );
    }, [baseURL]);

    const deleteFacility = useCallback(async (id) => {
        await axios.delete(
            `${baseURL}/api/facility/admin/delete/${id}`,
            { headers: getAuthHeaders() }
        );
    }, [baseURL]);

    /* ─────────────────────────────────────────
       운영 시간 관리
    ───────────────────────────────────────── */
    const loadFacilityTimes = useCallback(async (facIdx) => {
        const res = await axios.get(
            `${baseURL}/api/facility-time/admin/list/${facIdx}`,
            { headers: getAuthHeaders() }
        );
        return res.data; // array of FacilityTime
    }, [baseURL]);

    const createFacilityTime = useCallback(async ({ facIdx, facDay, facOpen, facClose, facTimeStatus }) => {
        await axios.post(
            `${baseURL}/api/facility-time/admin/create`,
            { facIdx, facDay, facOpen, facClose, facTimeStatus },
            { headers: getAuthHeaders() }
        );
    }, [baseURL]);

    const updateFacilityTime = useCallback(async (id, { facIdx, facDay, facOpen, facClose, facTimeStatus }) => {
        await axios.post(
            `${baseURL}/api/facility-time/admin/update/${id}`,
            { facIdx, facDay, facOpen, facClose, facTimeStatus },
            { headers: getAuthHeaders() }
        );
    }, [baseURL]);

    const deleteFacilityTime = useCallback(async (id) => {
        await axios.delete(
            `${baseURL}/api/facility-time/admin/delete/${id}`,
            { headers: getAuthHeaders() }
        );
    }, [baseURL]);

    return {
        loadAllReservations,
        deleteReservation,
        processApproval,
        loadApprovals,
        loadFacilitiesAdmin,
        createFacility,
        updateFacility,
        deleteFacility,
        loadFacilityTimes,
        createFacilityTime,
        updateFacilityTime,
        deleteFacilityTime,
    };
};

export default useAdminApi;
