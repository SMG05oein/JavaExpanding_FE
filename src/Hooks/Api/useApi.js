import axios from 'axios';
import { useCallback } from 'react';

const useApi = () => {
    const baseURL = process.env.REACT_APP_API_URL;

    const fetchData = useCallback(async (endpoint, method = 'GET', data = null, customHeaders = {}) => {
        const token = localStorage.getItem('token');
        
        const headers = {
            "Content-Type": "application/json",
            "Accept": "*/*",
            ...customHeaders
        };

        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            url: `${baseURL}${endpoint}`,
            method: method,
            data: data,
            headers: headers
        };

        try {
            return await axios(config);
        } catch (error) {
            if (error.response) {
                console.error("서버 응답 에러:", error.response.status, error.response.data);
            }
            console.error("API 호출 중 오류 발생:", error);
            throw error;
        }
    }, [baseURL]);

    return { fetchData };
};

export default useApi;