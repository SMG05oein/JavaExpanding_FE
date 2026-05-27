import React from 'react';
import useLoadingStore from '../../store/loadingStore';
import './LoadingOverlay.css';

const LoadingOverlay = () => {
    const isLoading = useLoadingStore((state) => state.isLoading);

    if (!isLoading) return null;

    return (
        <div className="global-loading-overlay">
            <div className="loading-spinner-container">
                <div className="loading-spinner-ring"></div>
                <div className="loading-text">요청을 처리 중입니다...</div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
