import React from 'react';
import MainContent from '../../Components/MainPage/MainContent';
import './MainPage.style.css';
import {Button} from "react-bootstrap";
import useApi from "../../Hooks/Api/useApi";
import useCheckLogin from "../../Hooks/Api/useCheckLogin";

const MainPage = () => {
    const { fetchData } = useApi();
    const { checkLogin } = useCheckLogin();

    const handleTemp = async() => {
        const token = localStorage.getItem('token');
        const result = await checkLogin({Authorization: `Bearer ${token}`})
        // const result = await fetchData(
        //     '/api/public_auh/check_status',
        //     'POST',
        //     null,
        //     {Authorization: `Bearer ${token}`}
        //     );
        console.log(result);
    }

    return (
        <div className="main-page-container">
            <header className="main-header">
                <h1>백석대 통합 예매 시스템</h1>
            </header>
            <main>
                <MainContent />
            </main>
            <Button onClick={() => handleTemp()}>
                Test
            </Button>
        </div>
    );
};

export default MainPage;