import React, { useEffect, useState } from 'react';
import { Badge } from 'react-bootstrap';
import useReservationStore from '../../store/reservationStore';
import './FacilityList.style.css';

const STATUS_MAP = {
    AVAILABLE: { label: '사용 가능', variant: 'success' },
    UNAVAILABLE: { label: '사용 불가', variant: 'danger' },
    MAINTENANCE: { label: '점검 중', variant: 'warning' },
};

const FacilityList = ({ onReserve }) => {
    const facilities = useReservationStore((s) => s.facilities);
    const reservations = useReservationStore((s) => s.reservations);
    const isFacilitiesLoading = useReservationStore((s) => s.isFacilitiesLoading);
    const facilitiesError = useReservationStore((s) => s.facilitiesError);
    const loadFacilities = useReservationStore((s) => s.loadFacilities);

    const [page, setPage] = useState(1);
    const pageSize = 5;
    const totalPages = Math.ceil(facilities.length / pageSize);

    useEffect(() => {
        loadFacilities();
    }, [loadFacilities]);

    useEffect(() => {
        if (totalPages > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const stats = {
        available: facilities.filter((f) => f.status === 'AVAILABLE').length,
        pending: reservations.filter((r) => r.status === 'PENDING').length,
        total: facilities.length,
    };

    const currentFacilities = facilities.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="facility-list">
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

            {isFacilitiesLoading && <div className="empty-state">시설 목록을 불러오는 중입니다...</div>}
            {!isFacilitiesLoading && facilitiesError && <div className="empty-state">{facilitiesError}</div>}
            {!isFacilitiesLoading && !facilitiesError && facilities.length === 0 && (
                <div className="empty-state">등록된 시설이 없습니다.</div>
            )}

            {!isFacilitiesLoading &&
                !facilitiesError &&
                currentFacilities.map((facility) => {
                    const { label, variant } = STATUS_MAP[facility.status] ?? {
                        label: facility.status,
                        variant: 'secondary',
                    };
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
                                <span>
                                    {facility.open_time} ~ {facility.close_time}
                                </span>
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

            {!isFacilitiesLoading && !facilitiesError && totalPages > 1 && (
                <div className="pagination-nav">
                    <button
                        className="pagination-button"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                    >
                        이전
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            className={`pagination-button ${page === index + 1 ? 'active' : ''}`}
                            onClick={() => setPage(index + 1)}
                        >
                            {index + 1}
                        </button>
                    ))}
                    <button
                        className="pagination-button"
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    );
};

export default FacilityList;
