import React, { useEffect } from 'react';
import MainContent from '../../Components/MainPage/MainContent';
import './MainPage.style.css';
import useReservationApi from '../../Hooks/Api/useReservationApi';
import useLoginStatus from '../../Hooks/Status/useLoginStatus';

const MainPage = () => {
    const { loadFacilities, loadMyReservations } = useReservationApi();
    const { isLoggedIn } = useLoginStatus();

    useEffect(() => {
        // 메인 페이지 진입 시 실시간 시설 상태 정보를 새로 불러옴
        loadFacilities();
        if (isLoggedIn) {
            loadMyReservations();
        }
    }, [loadFacilities, loadMyReservations, isLoggedIn]);

    return (
        <div className="main-page-wrapper">
            <main className="main-content-area">
                <MainContent />
            </main>
            
            <footer className="main-footer">
                <div className="footer-container">
                    <p>© {new Date().getFullYear()} 백석대학교 통합 예매 시스템. All Rights Reserved.</p>
                    <p className="footer-subtext">본 시스템은 백석대학교 학내 체육 시설 및 세미나실 예약을 지원하기 위한 통합 플랫폼입니다.</p>
                </div>
            </footer>
        </div>
    );
};

export default MainPage;