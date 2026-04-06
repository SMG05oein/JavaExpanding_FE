import React, { useEffect, useState } from 'react';
import './MainContent.style.css';

const MainContent = () => {
    const [testData, setTestData] = useState('');

    return (
        <div className="main-content">
            <h2>환영합니다!</h2>
            <p>예매를 위해 로그인이 필요합니다.</p>
            <div className="status-box">서버 상태: {testData}</div>
        </div>
    );
};

export default MainContent;