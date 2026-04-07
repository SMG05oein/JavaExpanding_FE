import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import useApi from '../../Hooks/Api/useApi';
import useLoginStatus from "../../Hooks/Status/useLoginStatus";
import './LoginContent.style.css';
import {useNavigate} from "react-router-dom";

const LoginContent = () => {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const { login } = useLoginStatus();
    const navigate = useNavigate();
    const { fetchData } = useApi();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const result = await fetchData('/api/auth/login', 'POST', { userEmail: id, userPw: pw });
            login(result);
            console.log(result);
            localStorage.setItem('token', result.data.accessToken);
            navigate('/')
        } catch (err) {
            alert('로그인에 실패했습니다. 학번과 비밀번호를 확인하세요.');
        }
    };

    return (
        <div className="login-content">
            <div className="login-logo-area d-flex flex-column align-items-center">
                <img src="/Mp7qkImU.ico" alt="백석대 로고" className="login-form-logo" />
                <h4 className="mt-3 mb-4">통합 예매 시스템 로그인</h4>
            </div>

            <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>학번 / 아이디</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="학번을 입력하세요"
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
                    로그인
                </Button>
            </Form>

            <div className="login-footer-links mt-4">
                <span onClick={()=>alert("기능개발 중")} style={{cursor: "pointer"}}>비밀번호 찾기</span>
                <span className="mx-2">|</span>
                <span onClick={()=>window.location.href="signup"} style={{cursor: "pointer"}}>회원가입</span>
            </div>
        </div>
    );
};

export default LoginContent;