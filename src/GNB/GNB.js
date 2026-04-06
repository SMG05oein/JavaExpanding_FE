import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './GNB.style.css';
import {Outlet} from "react-router-dom";

const GNB = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <nav className="gnb-wrapper">
            <Container fluid>
                <Row className="align-items-center gnb-row">
                    {/* 좌측: 로고 (Col 6만큼 차지) */}
                    <Col xs={6} className="gnb-left">
                        <img
                            src="/logo.png"
                            alt="백석대 로고"
                            className="gnb-logo"
                            onClick={() => window.location.href = '/'}
                        />
                    </Col>

                    {/* 우측: 메뉴 (Col 6만큼 차지, 텍스트 오른쪽 정렬) */}
                    <Col xs={6} className="gnb-right text-end">
                        {!isLoggedIn ? (
                            <div className="auth-menu">
                                <span className="menu-item">회원가입</span>
                                <span className="divider">|</span>
                                <span className="menu-item" onClick={() => window.location.href = '/login'}>로그인</span>
                            </div>
                        ) : (
                            <div className="user-menu">
                                <span className="menu-item" onClick={() => setIsLoggedIn(false)}>로그아웃</span>
                                <span className="divider">|</span>
                                <span className="menu-item">마이페이지</span>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
        <Outlet/>
        </nav>
    );
};

export default GNB;