import axios from 'axios';
import useLoginStatus from './Hooks/Status/useLoginStatus';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    useLoginStatus.getState().setIsLoggedIn(false);
    useLoginStatus.getState().setUser(null);
    window.location.replace('/login');
};

const setupAxiosInterceptors = () => {
    // 1. 요청 인터셉터: 토큰 주입
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            const url = config.url || '';
            const isPublicEndpoint = 
                url.includes('/api/public_auh/refresh') ||
                url.includes('/api/auth/login') ||
                url.includes('/api/admin/login');

            if (token && !isPublicEndpoint && !config.headers['Authorization']) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // 2. 응답 인터셉터: 401 처리 및 리프레시
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            if (
                error.response &&
                error.response.status === 401 &&
                originalRequest &&
                !originalRequest._retry &&
                !originalRequest.url.includes('/api/public_auh/refresh') &&
                !originalRequest.url.includes('/api/auth/login') &&
                !originalRequest.url.includes('/api/admin/login')
            ) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            originalRequest.headers['Authorization'] = `Bearer ${token}`;
                            return axios(originalRequest);
                        })
                        .catch((err) => {
                            return Promise.reject(err);
                        });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                const refreshToken = localStorage.getItem('refreshToken');

                if (refreshToken) {
                    try {
                        const baseURL = process.env.REACT_APP_API_URL || '';
                        // 전역 인터셉터 영향을 받지 않도록 독립된 axios 인스턴스 생성
                        const refreshAxios = axios.create();
                        const refreshRes = await refreshAxios.post(`${baseURL}/api/public_auh/refresh`, null, {
                            headers: {
                                'accept': '*/*',
                                'refreshToken': refreshToken
                            }
                        });
                        
                        const newTokens = refreshRes.data;
                        const newAccessToken = newTokens && (
                            newTokens.accessToken ||
                            newTokens.token ||
                            newTokens.jwt ||
                            newTokens.authorization ||
                            (Object.values(newTokens).find(v => typeof v === 'string' && v.length > 20))
                        );

                        if (newAccessToken) {
                            localStorage.setItem('token', newAccessToken);

                            const newRefreshToken = newTokens.refreshToken || newTokens.refresh_token;
                            if (newRefreshToken) {
                                localStorage.setItem('refreshToken', newRefreshToken);
                            }

                            // 헤더 설정
                            axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                            processQueue(null, newAccessToken);
                            isRefreshing = false;

                            window.location.reload();

                            return axios(originalRequest);
                        } else {
                            throw new Error('Refresh response does not contain access token');
                        }
                    } catch (refreshError) {
                        console.error('리프레시 토큰 갱신 실패:', refreshError);
                        processQueue(refreshError, null);
                        isRefreshing = false;
                        handleLogout();
                        return Promise.reject(refreshError);
                    }
                } else {
                    isRefreshing = false;
                    handleLogout();
                }
            }

            return Promise.reject(error);
        }
    );
};

export default setupAxiosInterceptors;

