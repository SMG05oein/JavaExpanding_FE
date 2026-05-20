import React, { useEffect, useState } from 'react';
import { Badge, OverlayTrigger, Popover } from 'react-bootstrap';
import useReservationStore from '../../store/reservationStore';
import useReservationApi from '../../Hooks/Api/useReservationApi';
import useLoginStatus from '../../Hooks/Status/useLoginStatus';
import './FacilityList.style.css';

const STATUS_MAP = {
    AVAILABLE: { label: '사용 가능', variant: 'success' },
    UNAVAILABLE: { label: '사용 불가', variant: 'danger' },
    MAINTENANCE: { label: '점검 중', variant: 'warning' },
};

// 💡 요일 순서 고정 배열
const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'];

const FacilityList = ({ onReserve }) => {
    const facilities = useReservationStore((s) => s.facilities);
    const reservations = useReservationStore((s) => s.reservations);
    const isFacilitiesLoading = useReservationStore((s) => s.isFacilitiesLoading);
    const facilitiesError = useReservationStore((s) => s.facilitiesError);
    const { loadFacilities, loadMyReservations } = useReservationApi();
    const { isLoggedIn } = useLoginStatus();

    const [page, setPage] = useState(1);
    const pageSize = 5;
    const totalPages = Math.ceil(facilities.length / pageSize);

    useEffect(() => {
        loadFacilities();
        if (isLoggedIn) {
            loadMyReservations();
        }
    }, [loadFacilities, loadMyReservations, isLoggedIn]);

    useEffect(() => {
        if (totalPages > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const stats = {
        available: facilities.filter((f) => f.status === 'AVAILABLE').length,
        pending: reservations.filter((r) => r.status === 'PENDING' || r.status === '대기').length,
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

                    // 💡 요일별 데이터 매칭 팝업
                    const popover = (
                        <Popover id={`popover-list-${facility.id}`}>
                            <Popover.Header as="h3" className="font-size-sm fw-bold">운영 시간 안내</Popover.Header>
                            <Popover.Body className="p-2">
                                <ul className="list-unstyled mb-0 font-size-sm">
                                    {DAYS_OF_WEEK.map((dayLabel) => {
                                        // 해당 요일의 데이터가 있는지 찾기
                                        const timeInfo = facility.facility_times?.find(t => t.day === dayLabel);

                                        return (
                                            <li key={dayLabel} className="mb-1">
                                                <strong>{dayLabel}요일:</strong>{' '}
                                                {timeInfo ? (
                                                    <span>{timeInfo.open} ~ {timeInfo.close} <span className="text-muted">({timeInfo.status})</span></span>
                                                ) : (
                                                    <span className="text-danger">운영시간 미등록</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Popover.Body>
                        </Popover>
                    );

                    return (
                        <div key={facility.id} className="facility-card">
                            <div className="facility-header">
                                <span className="facility-name">{facility.name}</span>
                                <Badge bg={variant}>{label}</Badge>
                            </div>

                            <div className="facility-meta">
                                <span>위치 {facility.location}</span>
                                <span>최대 {facility.capacity}명</span>
                                <span className="d-inline-flex align-items-center">
                                    {/* 💡 무조건 팝업 버튼 노출 */}
                                    <OverlayTrigger trigger="click" placement="bottom" overlay={popover} rootClose>
                                        <span className="hours-toggle-btn">운영시간 보기</span>
                                    </OverlayTrigger>
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