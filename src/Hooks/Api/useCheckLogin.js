import axios from 'axios';

const useCheckLogin = () => {
    const baseURL = process.env.REACT_APP_API_URL;

    const checkLogin = async (customHeaders = {}) => {
        // 1. 속성 이름을 headers로 수정
        // 2. 기본 헤더와 외부에서 들어온 헤더를 합침 (Spread 연산자 사용)
        const config = {
            url: `${baseURL}/api/public_auh/check_status`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "*/*",
                ...customHeaders
            }
        };

        try {
            const response = await axios(config);
            return response;
        } catch (error) {
            // 상세한 에러 로그 출력 (디버깅용)
            // if (error.response) {
            //     console.error("서버 응답 에러:", error.response.status, error.response.data);
            // }
            console.error("API 호출 중 오류 발생:", error);
            alert("로그인 정보가 없습니다.");
            // throw error;
        }
    };

    return { checkLogin };
};

export default useCheckLogin;