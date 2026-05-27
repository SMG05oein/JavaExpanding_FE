import './App.css';
import { Route, Routes, useLocation } from "react-router-dom";
import React, { useEffect } from 'react';
import MainPage from "./Pages/MainPage/MainPage";
import GNB from "./GNB/GNB";
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginPage from "./Pages/Login/LoginPage";
import Signup from "./Pages/SignUp/Signup";
import MyPage from "./Pages/MyPage/MyPage";
import FacilitiesPage from "./Pages/Facilities/FacilitiesPage";
import ReservePage from "./Pages/Reserve/ReservePage";
import MyReservationsPage from "./Pages/MyReservations/MyReservationsPage";
import useLoginStatus from "./Hooks/Status/useLoginStatus";
import LoadingOverlay from "./Components/LoadingOverlay/LoadingOverlay";

// 관리자 페이지
import AdminLayout      from "./Pages/Admin/AdminLayout";
import AdminDashboard   from "./Pages/Admin/AdminDashboard";
import AdminReservations from "./Pages/Admin/AdminReservations";
import AdminApprovals   from "./Pages/Admin/AdminApprovals";
import AdminFacilities  from "./Pages/Admin/AdminFacilities";
import AdminFacilityTimes from "./Pages/Admin/AdminFacilityTimes";

function App() {
    const { isLoggedIn, fetchUser } = useLoginStatus();
    const location = useLocation();

    // 앱 마운트 시 또는 로그인 변경 시 유저 정보를 실시간 로딩
    useEffect(() => {
        if (isLoggedIn) {
            fetchUser();
        }
    }, [isLoggedIn, fetchUser]);

    // 페이지 이동 시 엑세스 토큰이 유실되었고 리프레시 토큰이 있다면 선제적으로 토큰 갱신 트리거
    useEffect(() => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        if (!token && refreshToken) {
            fetchUser();
        }
    }, [location, fetchUser]);

    return (
        <>
            <LoadingOverlay />
            <Routes>
                {/* ── 일반 사용자 (GNB 포함) ── */}
                <Route path="/" element={<GNB />}>
                    <Route index element={<MainPage />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/facilities" element={<FacilitiesPage />} />
                    <Route path="/reserve" element={<ReservePage />} />
                    <Route path="/my-reservations" element={<MyReservationsPage />} />
                    <Route path="/mypage" element={<MyPage />} />
                </Route>

                {/* ── 관리자 (사이드바 레이아웃, GNB 없음) ── */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="reservations" element={<AdminReservations />} />
                    <Route path="approvals"    element={<AdminApprovals />} />
                    <Route path="facilities"   element={<AdminFacilities />} />
                    <Route path="facilities/:facIdx/times" element={<AdminFacilityTimes />} />
                </Route>
            </Routes>
        </>
    );
}

export default App;

