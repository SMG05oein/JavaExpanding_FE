import React from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import MyReservations from '../../Components/FacilityList/MyReservations';
import useLoginStatus from '../../Hooks/Status/useLoginStatus';
import './MyReservationsPage.style.css';

const MyReservationsPage = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useLoginStatus();

    return (
        <div className="my-reservations-page-wrapper py-5">
            <Container>
                <div className="page-header mb-5 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                    <div>
                        <h2 className="page-title">내 예약 내역</h2>
                        <p className="page-subtitle text-muted mb-0">학우님이 신청하신 실시간 시설 예약 신청서의 승인 현황 및 지난 예약 내역을 관리합니다.</p>
                    </div>
                    <button 
                        className="btn btn-outline-secondary px-4 py-2 fw-semibold back-btn rounded-pill"
                        onClick={() => navigate('/facilities')}
                    >
                        ← 시설 목록으로 돌아가기
                    </button>
                </div>
                <div className="page-content-box p-4 bg-white rounded-3 shadow-sm border">
                    {isLoggedIn && user ? (
                        <MyReservations userId={user.id} />
                    ) : (
                        <div className="text-center py-5">
                            <p className="text-muted mb-4 fs-5">내 예약 내역을 조회하려면 로그인이 필요합니다.</p>
                            <button className="btn btn-primary px-5 py-2 fw-semibold" onClick={() => navigate('/login')}>
                                로그인하러 가기
                            </button>
                        </div>
                    )}
                </div>
            </Container>
        </div>
    );
};

export default MyReservationsPage;
