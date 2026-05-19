import './App.css';
import { Route, Routes } from "react-router-dom";
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

function App() {
    const { isLoggedIn, fetchUser } = useLoginStatus();

    // 앱 마운트 시 또는 로그인 변경 시 유저 정보를 실시간 로딩
    useEffect(() => {
        if (isLoggedIn) {
            fetchUser();
        }
    }, [isLoggedIn, fetchUser]);

    return (
        <Routes>
            <Route path="/" element={<GNB />}>
                <Route index element={<MainPage />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/facilities" element={<FacilitiesPage />} />
                <Route path="/reserve" element={<ReservePage />} />
                <Route path="/my-reservations" element={<MyReservationsPage />} />
                <Route path="/mypage" element={<MyPage />} />
            </Route>
        </Routes>
    );
}

export default App;
