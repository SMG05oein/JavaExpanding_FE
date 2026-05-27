import React, { useState, useEffect } from 'react';
import { Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import useReservationStore from '../../store/reservationStore';
import useReservationApi from '../../Hooks/Api/useReservationApi';
import './MyReservations.style.css';

const STATUS_MAP = {
    '대기':   { label: '승인 대기', variant: 'warning' },
    '승인':   { label: '승인 완료', variant: 'success' },
    '거절':   { label: '거절됨',    variant: 'danger' },
    '취소':   { label: '취소됨',    variant: 'secondary' },
};

const MyReservations = ({ userId }) => {
    const getReservationsByUser = useReservationStore((s) => s.getReservationsByUser);
    const getFacilityById = useReservationStore((s) => s.getFacilityById);
    const allFacilities = useReservationStore((s) => s.allFacilities);
    const { cancelReservation, loadMyReservations, loadFacilities, loadAllFacilities } = useReservationApi();

    const navigate = useNavigate();
    const [alert, setAlert] = useState(null);
    const [activeTab, setActiveTab] = useState('대기'); // '대기', '승인', '거절'

    useEffect(() => {
        loadFacilities();
        loadAllFacilities();
        loadMyReservations();
    }, [loadFacilities, loadAllFacilities, loadMyReservations]);

    const allUserReservations = getReservationsByUser(userId).filter(
        (res) => res.status !== '취소' && res.status !== 'CANCELLED'
    );

    const pendingReservations = allUserReservations.filter(
        (res) => res.status === '대기' || res.status === 'PENDING'
    );
    const approvedReservations = allUserReservations.filter(
        (res) => res.status === '승인' || res.status === 'APPROVED'
    );
    const rejectedReservations = allUserReservations.filter(
        (res) => res.status === '거절' || res.status === 'REJECTED'
    );

    const activeReservations = 
        activeTab === '대기' ? pendingReservations :
        activeTab === '승인' ? approvedReservations :
        rejectedReservations;

    const sortedReservations = [...activeReservations].sort((a, b) =>
        (a.reservation_date + a.start_time) > (b.reservation_date + b.start_time) ? 1 : -1
    );

    const handleCancel = async (reservationId) => {
        const result = await cancelReservation(reservationId);
        setAlert({ type: result.success ? 'success' : 'danger', message: result.message });
        setTimeout(() => setAlert(null), 3000);
    };

    const handleEditClick = (res) => {
        navigate(`/reserve?edit=${res.id}`);
    };

    return (
        <div className="my-reservations">
            {alert && (
                <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
                    {alert.message}
                </Alert>
            )}

            <div className="my-res-tabs">
                <button
                    type="button"
                    className={`res-tab-btn ${activeTab === '대기' ? 'active' : ''}`}
                    onClick={() => setActiveTab('대기')}
                >
                    승인 대기 ({pendingReservations.length})
                </button>
                <button
                    type="button"
                    className={`res-tab-btn ${activeTab === '승인' ? 'active' : ''}`}
                    onClick={() => setActiveTab('승인')}
                >
                    승인 완료 ({approvedReservations.length})
                </button>
                <button
                    type="button"
                    className={`res-tab-btn ${activeTab === '거절' ? 'active' : ''}`}
                    onClick={() => setActiveTab('거절')}
                >
                    반려됨 ({rejectedReservations.length})
                </button>
            </div>

            {sortedReservations.length === 0 ? (
                <div className="empty-state">해당하는 예약 내역이 없습니다.</div>
            ) : (
                sortedReservations.map((res) => {
                    const facility = getFacilityById(res.facility_id) || allFacilities.find((f) => f.id === res.facility_id);
                    const { label, variant } = STATUS_MAP[res.status] ?? { label: res.status, variant: 'secondary' };
                    const canCancel = res.status === '대기' || res.status === '승인';

                    return (
                        <div key={res.id} className="reservation-card">
                            <div className="res-row">
                                <div className="res-info">
                                    <div className="res-facility-name">
                                        {facility?.name ?? res.facility_name ?? res.facility_id}
                                        <Badge bg={variant} className="ms-2">{label}</Badge>
                                    </div>
                                    <div className="res-time">
                                        {res.reservation_date} | {res.start_time} ~ {res.end_time} | {res.headcount}명
                                    </div>
                                    <div className="res-purpose">{res.purpose}</div>
                                    {res.status === '거절' && res.reject_reason && (
                                        <div className="res-reject-reason text-danger" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                            <strong>반려 사유:</strong> {res.reject_reason}
                                        </div>
                                    )}
                                </div>

                                <div className="res-actions d-flex gap-2 align-items-center">
                                    {res.status === '대기' && (
                                        <button
                                            className="edit-btn"
                                            onClick={() => handleEditClick(res)}
                                        >
                                            수정
                                        </button>
                                    )}
                                    {canCancel && (
                                        <button
                                            className="cancel-btn"
                                            onClick={() => handleCancel(res.id)}
                                        >
                                            취소
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}


        </div>
    );
};

export default MyReservations;
