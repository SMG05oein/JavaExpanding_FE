import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useLoginStatus = create(
    persist(
        (set, get) => ({
            isLoggedIn: false,
            user: null,

            // 로그인 액션 (JWT 디코딩 없이 토큰만 로컬 저장소에 저장)
            login: (result) => {
                let token = null;
                let refreshToken = null;
                if (result) {
                    const data = result.data !== undefined ? result.data : result;
                    if (typeof data === 'string') {
                        token = data;
                    } else if (data && typeof data === 'object') {
                        token = data.accessToken || data.token || data.jwt || data.authorization || (Object.values(data).find(v => typeof v === 'string' && v.length > 20));
                        refreshToken = data.refreshToken;
                    }
                }

                if (token && typeof token === 'string') {
                    localStorage.setItem('token', token);
                    if (refreshToken) {
                        localStorage.setItem('refreshToken', refreshToken);
                    }
                    set({ isLoggedIn: true });
                } else {
                    console.error('유효한 토큰 문자열을 찾을 수 없습니다. 결과 객체:', result);
                }
            },

            // 로그아웃 액션 (토큰 제거 및 메인 페이지 새로고침 이동)
            logout: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                set({ isLoggedIn: false, user: null });
                window.location.replace('/');
            },

            // 상태 수동 변경 (필요할 경우 사용)
            setIsLoggedIn: (status) => set({ isLoggedIn: status }),
            setUser: (user) => set({ user }),

            // 백엔드의 신규 '내 정보 조회' API를 호출하여 유저 정보 갱신
            fetchUser: async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    set({ isLoggedIn: false, user: null });
                    return null;
                }
                try {
                    const baseURL = process.env.REACT_APP_API_URL;
                    const response = await axios.get(`${baseURL}/api/public_auh/my_info`);

                    if (response?.data) {
                        const userData = response.data;
                        const userObj = {
                            id: userData.id || 'user',
                            name: userData.name || '사용자',
                            email: userData.email || '',
                            role: userData.position === 'Admin' ? 'ADMIN' : 'STUDENT'
                        };
                        set({ isLoggedIn: true, user: userObj });
                        return userObj;
                    }
                } catch (error) {
                    console.error('내 정보 조회 API 호출 실패:', error);
                    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                        // 만약 여기서도 실패하면 강제 로그아웃
                        // 실제로는 useApi.js에서 재발급을 시도하므로 여기서는 간단히 처리
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        set({ isLoggedIn: false, user: null });
                    }
                }
                return null;
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ isLoggedIn: state.isLoggedIn, user: state.user }),
        }
    )
);

export default useLoginStatus;