import React, { useState } from 'react';
import { Badge, Alert } from 'react-bootstrap';
import useReservationStore from '../../store/reservationStore';
import './MyReservations.style.css';

const STATUS_MAP = {
    PENDING:   { label: '승인 대기', variant: 'warning' },
    APPROVED:  { label: '승인 완료', variant: 'success' },
    REJECTED:  { label: '거절됨',    variant: 'danger' },
    CANCELLED: { label: '취소됨',    variant: 'secondary' },
};

const MyReservations = ({ userId }) => {
    const getReservationsByUser = useReservationStore((s) => s.getReservationsByUser);
    const getFacilityById = useReservationStore((s) => s.getFacilityById);
    const cancelReservation = useReservationStore((s) => s.cancelReservation);

    const [alert, setAlert] = useState(null);

    const reservations = getReservationsByUser(userId).sort((a, b) =>
        (a.reservation_date + a.start_time) > (b.reservation_date + b.start_time) ? 1 : -1
    );

    const handleCancel = (reservationId) => {
        const result = cancelReservation(reservationId, userId);
        setAlert({ type: result.success ? 'success' : 'danger', message: result.message });
        setTimeout(() => setAlert(null), 3000);
    };

    return (
        <div className="my-reservations">
            {alert && (
                <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
                    {alert.message}
                </Alert>
            )}

            {reservations.length === 0 ? (
                <div className="empty-state">예약 내역이 없습니다.</div>
            ) : (
                reservations.map((res) => {
                    const facility = getFacilityById(res.facility_id);
                    const { label, variant } = STATUS_MAP[res.status] ?? { label: res.status, variant: 'secondary' };
                    const canCancel = res.status === 'PENDING' || res.status === 'APPROVED';

                    return (
                        <div key={res.id} className="reservation-card">
                            <div className="res-row">
                                <div className="res-info">
                                    <div className="res-facility-name">
                                        {facility?.name ?? res.facility_id}
                                        <Badge bg={variant} className="ms-2">{label}</Badge>
                                    </div>
                                    <div className="res-time">
                                        {res.reservation_date} | {res.start_time} ~ {res.end_time} | {res.headcount}명
                                    </div>
                                    <div className="res-purpose">{res.purpose}</div>
                                </div>

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
                    );
                })
            )}
        </div>
    );
};

export default MyReservations;
