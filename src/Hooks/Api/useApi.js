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
            if (error.response && error.response.status === 401) {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken && endpoint !== '/api/public_auh/refresh' && endpoint !== '/api/auth/login' && endpoint !== '/api/admin/login') {
                    try {
                        const refreshRes = await axios.post(`${baseURL}/api/public_auh/refresh`, null, {
                            headers: { 'refreshToken': refreshToken }
                        });
                        
                        const newTokens = refreshRes.data;
                        const newAccessToken = newTokens.accessToken || newTokens.token;
                        if (newAccessToken) {
                            localStorage.setItem('token', newAccessToken);
                            if (newTokens.refreshToken) {
                                localStorage.setItem('refreshToken', newTokens.refreshToken);
                            }
                            config.headers['Authorization'] = `Bearer ${newAccessToken}`;
                            return await axios(config);
                        }
                    } catch (refreshError) {
                        console.error("토큰 재발급 실패:", refreshError);
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        window.location.replace('/login');
                        throw refreshError;
                    }
                }
            }
            
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