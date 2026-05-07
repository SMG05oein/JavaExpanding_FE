import React, { useState } from 'react';
import { Container, Tab, Nav } from 'react-bootstrap';
import FacilityList from '../../Components/FacilityList/FacilityList';
import ReservationForm from '../../Components/FacilityList/ReservationForm';
import MyReservations from '../../Components/FacilityList/MyReservations';
import './FutsalReservationPage.style.css';

// 나중에 JWT/로그인 훅으로 교체
const CURRENT_USER = {
    id: 'user-001',
    name: '김지훈',
    email: 'jihoon.kim@school.ac.kr',
};

const FutsalReservationPage = () => {
    const [activeTab, setActiveTab] = useState('facilities');
    const [preSelectedFacilityId, setPreSelectedFacilityId] = useState('');

    // 시설 카드의 "예약하러 가기" 버튼 → 예약 탭으로 이동 + 시설 선택
    const handleReserveFromFacility = (facilityId) => {
        setPreSelectedFacilityId(facilityId);
        setActiveTab('reserve');
    };

    const initials = CURRENT_USER.name.slice(0, 2);

    return (
        <div className="reservation-page-wrapper">
            <Container fluid="md" className="reservation-container">
                {/* 사용자 헤더 */}
                <div className="user-header">
                    <div className="user-avatar">{initials}</div>
                    <div>
                        <div className="user-name">{CURRENT_USER.name}</div>
                        <div className="user-email">{CURRENT_USER.email}</div>
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'facilities')}>
                    <Nav variant="tabs" className="reservation-tabs mb-3">
                        <Nav.Item>
                            <Nav.Link eventKey="facilities">시설 목록</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="reserve">예약하기</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="my">내 예약</Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content>
                        <Tab.Pane eventKey="facilities">
                            <FacilityList onReserve={handleReserveFromFacility} />
                        </Tab.Pane>

                        <Tab.Pane eventKey="reserve">
                            <ReservationForm preSelectedFacilityId={preSelectedFacilityId} />
                        </Tab.Pane>

                        <Tab.Pane eventKey="my">
                            <MyReservations userId={CURRENT_USER.id} />
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Container>
        </div>
    );
};

export default FutsalReservationPage;
