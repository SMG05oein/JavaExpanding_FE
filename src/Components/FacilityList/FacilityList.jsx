import React from 'react';
import { Badge } from 'react-bootstrap';
import useReservationStore from '../../store/reservationStore';
import './FacilityList.style.css';

const STATUS_MAP = {
    AVAILABLE:   { label: '사용 가능', variant: 'success' },
    UNAVAILABLE: { label: '사용 불가', variant: 'danger' },
    MAINTENANCE: { label: '점검 중',   variant: 'warning' },
};

const FacilityList = ({ onReserve }) => {
    const facilities = useReservationStore((s) => s.facilities);
    const reservations = useReservationStore((s) => s.reservations);

    const stats = {
        available: facilities.filter((f) => f.status === 'AVAILABLE').length,
        pending:   reservations.filter((r) => r.status === 'PENDING').length,
        total:     facilities.length,
    };

    return (
        <div className="facility-list">
            {/* 요약 카드 */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-num">{stats.available}</div>
                    <div className="stat-label">사용 가능 시설</div>
                </div>
                <div className="stat-card">
                    <div className="stat-num">{stats.pending}</div>
                    <div className="stat-label">승인 대기 예약</div>
                </div>
                <div className="stat-card">
                    <div className="stat-num">{stats.total}</div>
                    <div className="stat-label">전체 시설 수</div>
                </div>
            </div>

            {/* 시설 카드 목록 */}
            {facilities.map((facility) => {
                const { label, variant } = STATUS_MAP[facility.status] ?? { label: facility.status, variant: 'secondary' };
                const isAvailable = facility.status === 'AVAILABLE';

                return (
                    <div key={facility.id} className="facility-card">
                        <div className="facility-header">
                            <span className="facility-name">{facility.name}</span>
                            <Badge bg={variant}>{label}</Badge>
                        </div>

                        <div className="facility-meta">
                            <span>위치 {facility.location}</span>
                            <span>최대 {facility.capacity}명</span>
                            <span>{facility.open_time} ~ {facility.close_time}</span>
                        </div>

                        <div className="facility-desc">{facility.description}</div>

                        {facility.requires_approval && (
                            <div className="facility-approval-note">* 관리자 승인 후 사용 가능합니다.</div>
                        )}

                        <button
                            className={`reserve-btn ${!isAvailable ? 'disabled' : ''}`}
                            disabled={!isAvailable}
                            onClick={() => onReserve(facility.id)}
                        >
                            {isAvailable ? '예약하러 가기' : '예약 불가'}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default FacilityList;
