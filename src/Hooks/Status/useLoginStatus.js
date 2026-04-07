import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useLoginStatus = create(
    persist(
        (set) => ({
            // 상태 변수명 변경: isLoggedIn
            isLoggedIn: false,

            // 로그인 액션
            login: result => set({ isLoggedIn: true }),

            // 로그아웃 액션
            logout: () => {
                set({ isLoggedIn: false });
                // 필요시 로컬스토리지 토큰 삭제 로직 추가 가능
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