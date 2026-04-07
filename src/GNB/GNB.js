import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './GNB.style.css';
import {Outlet, useNavigate} from "react-router-dom";
import useLoginStatus from "../Hooks/Status/useLoginStatus";

const GNB = () => {
    // const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { isLoggedIn, logout } = useLoginStatus();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            logout();
            // alert("로그아웃 되었습니다.");
            navigate('/');
        }
    };

    return (
        <>
        <nav className="gnb-wrapper">
            <Container fluid>
                <Row className="align-items-center gnb-row">
                    {/* 좌측: 로고 (Col 6만큼 차지) */}
                    <Col xs={6}>
                        <div className="gnb-left d-flex align-items-center gap-2" style={{cursor: "pointer"}} onClick={() => window.location.href = '/'}>
                            <img
                                src="/Mp7qkImU.ico"
                                alt="백석대 로고"
                                className="gnb-logo"
                            />
                            <div className={"title_msg"}>백석대 통합 예매 시스템</div>
                        </div>
                    </Col>

                    {/* 우측: 메뉴 (Col 6만큼 차지, 텍스트 오른쪽 정렬) */}
                    <Col xs={6} className="gnb-right text-end">
                        {!isLoggedIn ? (
                            <div className="auth-menu">
                                <span className="menu-item" onClick={() => window.location.href = '/signup'}>회원가입</span>
                                <span className="divider">|</span>
                                <span className="menu-item" onClick={() => window.location.href = '/login'}>로그인</span>
                            </div>
                        ) : (
                            <div className="user-menu">
                                <span className="menu-item" onClick={() => handleLogout()}>로그아웃</span>
                                <span className="divider">|</span>
                                <span className="menu-item">마이페이지</span>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
        </nav>
        <Outlet/>
    </>
    );
};

export default GNB;