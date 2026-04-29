import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import useReservationStore from '../../store/reservationStore';
import useLoginStatus from '../../Hooks/Status/useLoginStatus';
import './ReservationForm.style.css';

const ReservationForm = ({ preSelectedFacilityId = '' }) => {
    const getAvailableFacilities = useReservationStore((s) => s.getAvailableFacilities);
    const getFacilityById = useReservationStore((s) => s.getFacilityById);
    const createReservation = useReservationStore((s) => s.createReservation);

    // 로그인 훅과 실제 사용자 정보를 연동하면 교체
    const { isLoggedIn } = useLoginStatus();
    const currentUserId = isLoggedIn ? 'user-001' : 'guest';

    const [form, setForm] = useState({
        facilityId: preSelectedFacilityId,
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        headcount: 6,
    });
    const [alert, setAlert] = useState(null); // { type: 'success'|'danger', message }

    useEffect(() => {
        if (preSelectedFacilityId) {
            setForm((prev) => ({ ...prev, facilityId: preSelectedFacilityId }));
        }
    }, [preSelectedFacilityId]);

    const availableFacilities = getAvailableFacilities();
    const selectedFacility = getFacilityById(form.facilityId);

    const today = new Date().toISOString().slice(0, 10);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setAlert(null);

        const { facilityId, date, startTime, endTime, purpose, headcount } = form;

        // 필수 입력/시간 유효성 검사
        if (!facilityId || !date || !startTime || !endTime || !purpose) {
            setAlert({ type: 'danger', message: '모든 항목을 입력해 주세요.' });
            return;
        }
        if (startTime >= endTime) {
            setAlert({ type: 'danger', message: '종료 시간이 시작 시간보다 늦어야 합니다.' });
            return;
        }
        if (selectedFacility) {
            if (startTime < selectedFacility.open_time || endTime > selectedFacility.close_time) {
                setAlert({
                    type: 'danger',
                    message: `운영 시간(${selectedFacility.open_time} ~ ${selectedFacility.close_time}) 내에서만 예약 가능합니다.`,
                });
                return;
            }
        }

        const result = createReservation({
            facilityId,
            date,
            startTime,
            endTime,
            purpose,
            headcount: Number(headcount),
            userId: currentUserId,
        });

        setAlert({ type: result.success ? 'success' : 'danger', message: result.message });

        if (result.success) {
            setForm({ facilityId: '', date: '', startTime: '', endTime: '', purpose: '', headcount: 6 });
        }
    };

    return (
        <div className="reservation-form-wrapper">
            <div className="reservation-form-card">
                <div className="form-title">예약 신청</div>

                {alert && (
                    <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
                        {alert.message}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    {/* 시설 선택 */}
                    <Form.Group className="mb-3">
                        <Form.Label>시설 선택</Form.Label>
                        <Form.Select name="facilityId" value={form.facilityId} onChange={handleChange}>
                            <option value="">-- 시설을 선택하세요 --</option>
                            {availableFacilities.map((f) => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </Form.Select>
                        {selectedFacility && (
                            <Form.Text className="text-muted">
                                {selectedFacility.location} | 최대 {selectedFacility.capacity}명 |&nbsp;
                                {selectedFacility.open_time} ~ {selectedFacility.close_time}
                                {selectedFacility.requires_approval && ' | 관리자 승인 필요'}
                            </Form.Text>
                        )}
                    </Form.Group>

                    {/* 날짜 */}
                    <Form.Group className="mb-3">
                        <Form.Label>예약 날짜</Form.Label>
                        <Form.Control
                            type="date"
                            name="date"
                            value={form.date}
                            min={today}
                            onChange={handleChange}
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
                                    value={form.startTime}
                                    step={1800}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>종료 시간</Form.Label>
                                <Form.Control
                                    type="time"
                                    name="endTime"
                                    value={form.endTime}
                                    step={1800}
                                    onChange={handleChange}
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
                            value={form.purpose}
                            placeholder="예) 체육 수업, 동아리 경기"
                            onChange={handleChange}
                        />
                    </Form.Group>

                    {/* 인원 */}
                    <Form.Group className="mb-4">
                        <Form.Label>참가 인원</Form.Label>
                        <Form.Control
                            type="number"
                            name="headcount"
                            value={form.headcount}
                            min={1}
                            max={selectedFacility?.capacity ?? 20}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Button type="submit" className="submit-btn w-100">
                        예약 신청하기
                    </Button>
                </Form>
            </div>
        </div>
    );
};

export default ReservationForm;
