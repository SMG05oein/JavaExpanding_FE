import React from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import FacilityList from '../../Components/FacilityList/FacilityList';
import useLoginStatus from '../../Hooks/Status/useLoginStatus';
import './FacilitiesPage.style.css';

const FacilitiesPage = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useLoginStatus();

    const handleReserveFromFacility = (facilityId) => {
        // 예약 페이지로 이동하며 선택한 시설의 ID를 쿼리 스트링으로 전달
        navigate(`/reserve?facilityId=${facilityId}`);
    };

    return (
        <div className="facilities-page-wrapper py-5">
            <Container>
                <div className="page-header mb-5 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                    <div>
                        <h2 className="page-title">시설 목록</h2>
                        <p className="page-subtitle text-muted mb-0">백석대학교 학우님들이 이용하실 수 있는 전체 구장 및 체육 시설 목록입니다.</p>
                    </div>
                    {isLoggedIn && (
                        <button 
                            className="btn btn-outline-primary px-4 py-2 fw-semibold my-reservations-btn rounded-pill"
                            onClick={() => navigate('/my-reservations')}
                        >
                            내 예약 내역 조회
                        </button>
                    )}
                </div>
                <div className="page-content-box p-4 bg-white rounded-3 shadow-sm border">
                    <FacilityList onReserve={handleReserveFromFacility} />
                </div>
            </Container>
        </div>
    );
};

export default FacilitiesPage;
