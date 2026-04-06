import axios from 'axios';

const useApi = () => {
    const baseURL = process.env.REACT_APP_API_URL;

    const fetchData = async (endpoint, method = 'GET', data = null, customHeaders = {}) => {
        // 1. 속성 이름을 headers로 수정
        // 2. 기본 헤더와 외부에서 들어온 헤더를 합침 (Spread 연산자 사용)
        const config = {
            url: `${baseURL}${endpoint}`,
            method: method,
            data: data,
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
            if (error.response) {
                console.error("서버 응답 에러:", error.response.status, error.response.data);
            }
            console.error("API 호출 중 오류 발생:", error);
            throw error;
        }
    };

    return { fetchData };
};

export default useApi;