import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import useApi from '../../Hooks/Api/useApi';
import useLoginStatus from "../../Hooks/Status/useLoginStatus";
import './LoginContent.style.css';
import { useNavigate } from "react-router-dom";

const LoginContent = () => {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [role, setRole] = useState('STUDENT'); // STUDENT 또는 ADMIN 상태 추가

    const { login } = useLoginStatus();
    const navigate = useNavigate();
    const { fetchData } = useApi();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '';
            let requestData = {};

            // 1. 역할에 따른 API 주소 및 데이터 필드 설정
            if (role === 'STUDENT') {
                endpoint = '/api/auth/login'; // 학생 로그인 API
                requestData = {
                    userEmailorId: id, // 명세에 따라 userEmail 혹은 userId로 수정 가능
                    userPw: pw
                };
            } else {
                endpoint = '/api/admin/login'; // 관리자 로그인 API
                requestData = {
                    adminIdorEmail: id,
                    adminPw: pw
                };
            }

            const result = await fetchData(endpoint, 'POST', requestData);

            // 2. Zustand 스토어의 login 함수 호출 (토큰 저장 및 상태 변경)
            login(result);

            console.log(`${role} 로그인 성공:`, result);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인하세요.');
        }
    };

    return (
        <div className="login-content">
            <div className="login-logo-area d-flex flex-column align-items-center">
                <img src="/Mp7qkImU.ico" alt="백석대 로고" className="login-form-logo" />
                <h4 className="mt-3 mb-4">통합 예매 시스템 로그인</h4>
            </div>

            <Form onSubmit={handleLogin}>
                {/* 학생 / 관리자 선택 라디오 버튼 */}
                <Form.Group className="mb-4">
                    <div className="d-flex gap-4 p-2 border rounded bg-light justify-content-center">
                        <Form.Check
                            type="radio"
                            label="학생"
                            name="loginRole"
                            id="loginStudent"
                            checked={role === 'STUDENT'}
                            onChange={() => setRole('STUDENT')}
                        />
                        <Form.Check
                            type="radio"
                            label="관리자"
                            name="loginRole"
                            id="loginAdmin"
                            checked={role === 'ADMIN'}
                            onChange={() => setRole('ADMIN')}
                        />
                    </div>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>{role === 'STUDENT' ? '학번 / 이메일' : '아이디 / 이메일'}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={role === 'STUDENT' ? "학번을 입력하세요" : "관리자 ID를 입력하세요"}
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formBasicPassword">
                    <Form.Label>비밀번호</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        required
                    />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 login-btn">
                    {role === 'STUDENT' ? '학생 로그인' : '관리자 로그인'}
                </Button>
            </Form>

            <div className="login-footer-links mt-4">
                <span onClick={() => alert("기능개발 중")} style={{ cursor: "pointer" }}>비밀번호 찾기</span>
                <span className="mx-2">|</span>
                <span onClick={() => navigate('/signup')} style={{ cursor: "pointer" }}>회원가입</span>
            </div>
        </div>
    );
};

export default LoginContent;