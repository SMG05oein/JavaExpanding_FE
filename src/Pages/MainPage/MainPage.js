import React from 'react';
import MainContent from '../../Components/MainPage/MainContent';
import './MainPage.style.css';

const MainPage = () => {
    return (
        <div className="main-page-container">
            <header className="main-header">
                <h1>백석대 통합 예매 시스템</h1>
            </header>
            <main>
                <MainContent />
            </main>
        </div>
    );
};

export default MainPage;