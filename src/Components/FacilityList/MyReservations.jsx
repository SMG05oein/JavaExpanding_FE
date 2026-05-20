import React, { useState, useEffect, useRef } from 'react';
import { Badge, Alert, Modal, Button, Form, Row, Col } from 'react-bootstrap';
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
    const { cancelReservation, loadMyReservations, loadFacilities, loadAllFacilities, updateReservation } = useReservationApi();

    const [alert, setAlert] = useState(null);
    const [editingReservation, setEditingReservation] = useState(null);
    const [editForm, setEditForm] = useState({
        facilityId: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        headcount: 1
    });
    const [editAlert, setEditAlert] = useState(null);
    const [editSearchTerm, setEditSearchTerm] = useState('');
    const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
    const [editDisplayVal, setEditDisplayVal] = useState('');
    const editDropdownRef = useRef(null);

    useEffect(() => {
        loadFacilities();
        loadAllFacilities();
        loadMyReservations();
    }, [loadFacilities, loadAllFacilities, loadMyReservations]);

    const reservations = getReservationsByUser(userId).sort((a, b) =>
        (a.reservation_date + a.start_time) > (b.reservation_date + b.start_time) ? 1 : -1
    );

    const handleCancel = async (reservationId) => {
        const result = await cancelReservation(reservationId);
        setAlert({ type: result.success ? 'success' : 'danger', message: result.message });
        setTimeout(() => setAlert(null), 3000);
    };

    const handleEditClick = (res) => {
        setEditingReservation(res);
        setEditForm({
            facilityId: res.facility_id,
            date: res.reservation_date,
            startTime: res.start_time,
            endTime: res.end_time,
            purpose: res.purpose,
            headcount: res.headcount
        });
        setEditAlert(null);
        setEditSearchTerm('');
        setIsEditDropdownOpen(false);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditAlert(null);

        const { facilityId, date, startTime, endTime, purpose, headcount } = editForm;
        if (!facilityId || !date || !startTime || !endTime || !purpose) {
            setEditAlert({ type: 'danger', message: '모든 항목을 입력해 주세요.' });
            return;
        }
        if (startTime >= endTime) {
            setEditAlert({ type: 'danger', message: '종료 시간이 시작 시간보다 늦어야 합니다.' });
            return;
        }

        const selectedFacility = allFacilities.find((f) => f.id === facilityId);
        if (selectedFacility) {
            if (startTime < selectedFacility.open_time || endTime > selectedFacility.close_time) {
                setEditAlert({
                    type: 'danger',
                    message: `운영 시간(${selectedFacility.open_time} ~ ${selectedFacility.close_time}) 내에서만 예약 가능합니다.`,
                });
                return;
            }
        }

        const result = await updateReservation(editingReservation.id, {
            facilityId,
            date,
            startTime,
            endTime,
            purpose,
            headcount: Number(headcount)
        });

        if (result.success) {
            setAlert({ type: 'success', message: result.message });
            setEditingReservation(null);
            setTimeout(() => setAlert(null), 3000);
        } else {
            setEditAlert({ type: 'danger', message: result.message });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (editDropdownRef.current && !editDropdownRef.current.contains(event.target)) {
                setIsEditDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredAllFacilities = allFacilities.filter((f) =>
        f.name.toLowerCase().includes(editSearchTerm.toLowerCase())
    );
    const selectedFacility = allFacilities.find((f) => f.id === editForm.facilityId);

    useEffect(() => {
        if (!isEditDropdownOpen) {
            setEditDisplayVal(selectedFacility ? selectedFacility.name : '');
        }
    }, [isEditDropdownOpen, selectedFacility]);

    const today = new Date().toISOString().slice(0, 10);

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

            {/* 예약 수정 모달 */}
            <Modal show={!!editingReservation} onHide={() => setEditingReservation(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>예약 정보 수정</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editAlert && (
                        <Alert variant={editAlert.type} onClose={() => setEditAlert(null)} dismissible>
                            {editAlert.message}
                        </Alert>
                    )}
                    <Form onSubmit={handleEditSubmit}>
                        {/* 시설 선택 */}
                        <Form.Group className="mb-3">
                            <Form.Label>시설 선택</Form.Label>
                            <div ref={editDropdownRef} className="position-relative">
                                <Form.Control
                                    type="text"
                                    placeholder="🔍 시설을 선택하거나 검색하세요..."
                                    value={editDisplayVal}
                                    onChange={(e) => {
                                        setEditSearchTerm(e.target.value);
                                        setEditDisplayVal(e.target.value);
                                        setIsEditDropdownOpen(true);
                                    }}
                                    onFocus={() => {
                                        setIsEditDropdownOpen(true);
                                        setEditSearchTerm('');
                                        setEditDisplayVal('');
                                    }}
                                />
                                {isEditDropdownOpen && (
                                    <div className="dropdown-menu show w-100" style={{ 
                                        maxHeight: '200px', 
                                        overflowY: 'auto',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        {filteredAllFacilities.length === 0 ? (
                                            <div className="dropdown-item text-muted">검색 결과가 없습니다.</div>
                                        ) : (
                                            filteredAllFacilities.map((f) => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    className="dropdown-item text-start"
                                                    onClick={() => {
                                                        setEditForm((prev) => ({ ...prev, facilityId: f.id }));
                                                        setIsEditDropdownOpen(false);
                                                    }}
                                                >
                                                    {f.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            {selectedFacility && (
                                <Form.Text className="text-muted d-block mt-1">
                                    {selectedFacility.location} | 최대 {selectedFacility.capacity}명 |&nbsp;
                                    {selectedFacility.open_time} ~ {selectedFacility.close_time}
                                </Form.Text>
                            )}
                        </Form.Group>

                        {/* 예약 날짜 */}
                        <Form.Group className="mb-3">
                            <Form.Label>예약 날짜</Form.Label>
                            <Form.Control
                                type="date"
                                name="date"
                                value={editForm.date}
                                min={today}
                                onChange={handleEditChange}
                            />
                        </Form.Group>

                        {/* 시간 */}
                        <Row className="mb-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label>시작 시간</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="startTime"
                                        value={editForm.startTime}
                                        onChange={handleEditChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label>종료 시간</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="endTime"
                                        value={editForm.endTime}
                                        onChange={handleEditChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* 목적 */}
                        <Form.Group className="mb-3">
                            <Form.Label>사용 목적</Form.Label>
                            <Form.Control
                                type="text"
                                name="purpose"
                                value={editForm.purpose}
                                placeholder="예) 동아리 활동, 체육 대회"
                                onChange={handleEditChange}
                            />
                        </Form.Group>

                        {/* 인원 */}
                        <Form.Group className="mb-4">
                            <Form.Label>참가 인원</Form.Label>
                            <Form.Control
                                type="number"
                                name="headcount"
                                value={editForm.headcount}
                                min={1}
                                max={selectedFacility?.capacity ?? 20}
                                onChange={handleEditChange}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setEditingReservation(null)}>
                                취소
                            </Button>
                            <Button type="submit" variant="primary">
                                수정 완료
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default MyReservations;
