import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import useApi from '../../Hooks/Api/useApi';
import './SignUp.style.css';
import { useNavigate } from "react-router-dom";

const SignUpContent = () => {
    // 입력 상태 관리
    const [id, setId] = useState('');       // 학번 또는 관리자 ID
    const [email, setEmail] = useState(''); // 이메일
    const [name, setName] = useState('');   // 이름
    const [pw, setPw] = useState('');       // 비밀번호
    const [confirmPw, setConfirmPw] = useState(''); // 비밀번호 확인
    const [role, setRole] = useState('STUDENT');    // STUDENT 또는 ADMIN

    const navigate = useNavigate();
    const { fetchData } = useApi();

    const handleSignUp = async (e) => {
        e.preventDefault();

        // 1. 비밀번호 일치 확인
        if (pw !== confirmPw) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            let requestData = {};
            let endpoint = '';

            // 2. 역할에 따른 API 엔드포인트 및 데이터 구조 분기 (보내주신 스키마 적용)
            if (role === 'STUDENT') {
                endpoint = '/api/auth/signup'; // 백엔드 학생 가입 주소로 수정 필요
                requestData = {
                    userEmail: email,
                    userPw: pw,
                    userId: id,
                    userName: name
                };
            } else {
                endpoint = '/api/admin/signup'; // 백엔드 관리자 가입 주소로 수정 필요
                requestData = {
                    adminEmail: email,
                    adminPw: pw,
                    adminId: id,
                    adminName: name
                };
            }

            // 3. API 호출
            const result = await fetchData(endpoint, 'POST', requestData);

            if (result) {
                alert(`${role === 'STUDENT' ? '학생' : '관리자'} 회원가입이 완료되었습니다!`);
                navigate('/login');
            }
        } catch (err) {
            console.error("회원가입 에러:", err);
            alert('회원가입에 실패했습니다. 입력 정보를 확인하세요.');
        }
    };

    return (
        <div className="login-content">
            <div className="login-logo-area d-flex flex-column align-items-center">
                <img src="/Mp7qkImU.ico" alt="백석대 로고" className="login-form-logo" />
                <h4 className="mt-3 mb-4">통합 예매 시스템 회원가입</h4>
            </div>

            <Form onSubmit={handleSignUp}>
                {/* 사용자 구분 라디오 버튼 */}
                <Form.Group className="mb-4">
                    <Form.Label>사용자 구분</Form.Label>
                    <div className="d-flex gap-4 p-2 border rounded bg-light">
                        <Form.Check
                            type="radio"
                            label="학생"
                            name="roleGroup"
                            id="roleStudent"
                            checked={role === 'STUDENT'}
                            onChange={() => setRole('STUDENT')}
                        />
                        <Form.Check
                            type="radio"
                            label="관리자"
                            name="roleGroup"
                            id="roleAdmin"
                            checked={role === 'ADMIN'}
                            onChange={() => setRole('ADMIN')}
                        />
                    </div>
                </Form.Group>

                {/* 이름 입력 */}
                <Form.Group className="mb-3" controlId="formName">
                    <Form.Label>이름</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="이름을 입력하세요"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </Form.Group>

                {/* 아이디/학번 입력 (역할에 따라 라벨 변경) */}
                <Form.Group className="mb-3" controlId="formId">
                    <Form.Label>{role === 'STUDENT' ? '학번' : '관리자 ID'}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={role === 'STUDENT' ? "학번을 입력하세요" : "관리자 ID를 입력하세요"}
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        required
                    />
                </Form.Group>

                {/* 이메일 입력 */}
                <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label>이메일</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="example@bu.ac.kr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </Form.Group>

                {/* 비밀번호 입력 */}
                <Form.Group className="mb-3" controlId="formPassword">
                    <Form.Label>비밀번호</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        required
                    />
                </Form.Group>

                {/* 비밀번호 확인 입력 */}
                <Form.Group className="mb-4" controlId="formConfirmPassword">
                    <Form.Label>비밀번호 확인</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        required
                    />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 login-btn">
                    회원가입 완료
                </Button>
            </Form>

            <div className="login-footer-links mt-4">
                <span onClick={() => navigate('/login')} style={{ cursor: "pointer" }}>
                    이미 계정이 있으신가요? <b>로그인 바로가기</b>
                </span>
            </div>
        </div>
    );
};

export default SignUpContent;