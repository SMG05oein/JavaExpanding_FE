import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useLoginStatus = create(
    persist(
        (set) => ({
            // 상태 변수명 변경: isLoggedIn
            isLoggedIn: false,

            // 로그인 액션
            login: (result) => {
                const token = result.data.accessToken;
                if (token) {
                    localStorage.setItem('token', token);
                }
                set({ isLoggedIn: true });
            },

            // 로그아웃 액션
            logout: () => {
                localStorage.removeItem('token');
                set({ isLoggedIn: false, user: null });
                // 메인 페이지로 이동시키려면 호출부에서 navigate('/') 수행
            },

            // 상태 수동 변경 (필요할 경우 사용)
            setIsLoggedIn: (status) => set({ isLoggedIn: status }),
        }),
        {
            name: 'auth-storage', // 브라우저 로컬스토리지에 저장될 키 이름
        }
    )
);

export default useLoginStatus;