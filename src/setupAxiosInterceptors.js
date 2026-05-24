import axios from 'axios';

const setupAxiosInterceptors = () => {
    // 1. 요청 인터셉터: 토큰 주입
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token && !config.headers['Authorization']) {
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
                originalRequest._retry = true;
                const refreshToken = localStorage.getItem('refreshToken');

                if (refreshToken) {
                    try {
                        const baseURL = process.env.REACT_APP_API_URL;
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
                            
                            // 갱신된 토큰으로 헤더 교체 후 재시도
                            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error('리프레시 토큰 갱신 실패:', refreshError);
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        window.location.replace('/login');
                        return Promise.reject(refreshError);
                    }
                } else {
                    localStorage.removeItem('token');
                    window.location.replace('/login');
                }
            }

            return Promise.reject(error);
        }
    );
};

export default setupAxiosInterceptors;
