import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import useReservationStore from '../../store/reservationStore';
import useReservationApi from '../../Hooks/Api/useReservationApi';
import './ReservationForm.style.css';

const ReservationForm = ({ preSelectedFacilityId = '' }) => {
    const allFacilities = useReservationStore((s) => s.allFacilities);
    const { loadAllFacilities, createReservation } = useReservationApi();
    const [form, setForm] = useState({
        facilityId: preSelectedFacilityId,
        date: new Date().toISOString().slice(0, 10),
        startTime: '09:00',
        endTime: '18:00',
        purpose: '',
        headcount: 0,
    });
    const [alert, setAlert] = useState(null); // { type: 'success'|'danger', message }
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [displayVal, setDisplayVal] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadAllFacilities();
    }, [loadAllFacilities]);

    useEffect(() => {
        if (preSelectedFacilityId) {
            const formattedId = preSelectedFacilityId.toString().startsWith('fac-')
                ? preSelectedFacilityId
                : `fac-${preSelectedFacilityId}`;
            setForm((prev) => ({ ...prev, facilityId: formattedId }));
        }
    }, [preSelectedFacilityId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredFacilities = allFacilities.filter((f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const selectedFacility = allFacilities.find((f) => f.id === form.facilityId) || null;

    useEffect(() => {
        if (!isOpen) {
            setDisplayVal(selectedFacility ? selectedFacility.name : '');
        }
    }, [isOpen, selectedFacility]);

    const today = new Date().toISOString().slice(0, 10);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
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

        const result = await createReservation({
            facilityId,
            date,
            startTime,
            endTime,
            purpose,
            headcount: Number(headcount),
        });

        setAlert({ type: result.success ? 'success' : 'danger', message: result.message });

        if (result.success) {
            setForm({ facilityId: '', date: new Date().toISOString().slice(0, 10), startTime: '09:00', endTime: '18:00', purpose: '', headcount: 0 });
            setSearchTerm('');
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
                        <div ref={dropdownRef} className="position-relative">
                            <Form.Control
                                type="text"
                                placeholder="🔍 시설을 선택하거나 검색하세요..."
                                value={displayVal}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setDisplayVal(e.target.value);
                                    setIsOpen(true);
                                }}
                                onFocus={() => {
                                    setIsOpen(true);
                                    setSearchTerm('');
                                    setDisplayVal('');
                                }}
                            />
                            {isOpen && (
                                <div className="dropdown-menu show w-100" style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}>
                                    {filteredFacilities.length === 0 ? (
                                        <div className="dropdown-item text-muted">검색 결과가 없습니다.</div>
                                    ) : (
                                        filteredFacilities.map((f) => (
                                            <button
                                                key={f.id}
                                                type="button"
                                                className="dropdown-item text-start"
                                                onClick={() => {
                                                    setForm((prev) => ({ ...prev, facilityId: f.id }));
                                                    setIsOpen(false);
                                                }}
                                            >
                                                {f.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        {/*{selectedFacility && (*/}
                        {/*    <Form.Text className="text-muted">*/}
                        {/*        {selectedFacility.location} | 최대 {selectedFacility.capacity}명 |&nbsp;*/}
                        {/*        {selectedFacility.open_time} ~ {selectedFacility.close_time}*/}
                        {/*        {selectedFacility.requires_approval && ' | 관리자 승인 필요'}*/}
                        {/*    </Form.Text>*/}
                        {/*)}*/}
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
                            max={99}
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
