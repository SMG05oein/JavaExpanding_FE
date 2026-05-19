import React from 'react';
import { Container } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReservationForm from '../../Components/FacilityList/ReservationForm';
import useLoginStatus from '../../Hooks/Status/useLoginStatus';
import './ReservePage.style.css';

const ReservePage = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useLoginStatus();
    const [searchParams] = useSearchParams();
    const preSelectedFacilityId = searchParams.get('facilityId') || '';

    return (
        <div className="reserve-page-wrapper py-5">
            <Container>
                <div className="page-header mb-5 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                    <div>
                        <h2 className="page-title">실시간 예약하기</h2>
                        <p className="page-subtitle text-muted mb-0">원하시는 체육 시설과 사용 일시를 선택하여 예약 신청서를 작성합니다.</p>
                    </div>
                    <button 
                        className="btn btn-outline-secondary px-4 py-2 fw-semibold back-btn rounded-pill"
                        onClick={() => navigate('/facilities')}
                    >
                        ← 시설 목록으로 돌아가기
                    </button>
                </div>
                <div className="page-content-box p-4 bg-white rounded-3 shadow-sm border">
                    {isLoggedIn ? (
                        <ReservationForm preSelectedFacilityId={preSelectedFacilityId} />
                    ) : (
                        <div className="text-center py-5">
                            <p className="text-muted mb-4 fs-5">시설 예약을 신청하려면 로그인이 필요합니다.</p>
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

export default ReservePage;
