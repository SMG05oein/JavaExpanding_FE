import React, { useEffect, useState } from 'react';
import { Badge, OverlayTrigger, Popover } from 'react-bootstrap';
import useApi from '../../Hooks/Api/useApi';
import './FacilityList.style.css';

const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'];

const FacilityList = ({ onReserve }) => {
    const { fetchData } = useApi();

    const [pageData, setPageData] = useState({
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        first: true,
        last: true
    });
    const [isLoading, setIsLoading] = useState(false);

    // 💡 특정 페이지 데이터 페칭 및 운영시간 병합 로직
    const fetchFacilityPage = async (pageNumber) => {
        setIsLoading(true);
        try {
            // 1. 해당 페이지의 시설 목록 가져오기
            const result1 = await fetchData(`/api/facility/list?page=${pageNumber}`, 'GET');

            if (result1) {
                const content = result1.content || result1.data?.content || [];
                const totalPages = result1.totalPages || result1.data?.totalPages || 0;
                const totalElements = result1.totalElements || result1.data?.totalElements || 0;
                const number = result1.number || result1.data?.number || 0;
                const first = result1.first ?? result1.data?.first ?? true;
                const last = result1.last ?? result1.data?.last ?? true;

                // 2. 현재 페이지의 시설들에 대해 운영시간 API 각각 호출 (Promise.all)
                const facilitiesWithTimes = await Promise.all(
                    content.map(async (facility) => {
                        try {
                            const timeResult = await fetchData(`/api/facility-time/admin/list/${facility.facIdx}`, 'GET');
                            const timesArray = Array.isArray(timeResult) ? timeResult : (timeResult?.data || []);

                            return { ...facility, facility_times: timesArray };
                        } catch (error) {
                            console.error(`[운영시간 에러] ${facility.facName} 로딩 실패`);
                            return { ...facility, facility_times: [] }; // 에러 시 빈 배열 처리
                        }
                    })
                );

                // 3. 운영시간이 포함된 최종 데이터를 상태에 저장
                setPageData({
                    content: facilitiesWithTimes,
                    totalPages,
                    totalElements,
                    number,
                    first,
                    last
                });
            }
        } catch (error) {
            console.error("시설 목록 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 컴포넌트 마운트 시 첫 페이지(0) 로드
    useEffect(() => {
        fetchFacilityPage(0);
    }, []);

    const handlePageChange = (newPage) => {
        fetchFacilityPage(newPage - 1); // 백엔드는 0부터 시작하므로 -1
    };

    const currentFacilities = pageData.content || [];

    return (
        <div className="facility-list">
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-num">{pageData.totalElements}</div>
                    <div className="stat-label">전체 시설 수</div>
                </div>
                <div className="stat-card">
                    <div className="stat-num">{currentFacilities.length}</div>
                    <div className="stat-label">현재 페이지 시설</div>
                </div>
                <div className="stat-card">
                    <div className="stat-num">{pageData.totalPages}</div>
                    <div className="stat-label">총 페이지</div>
                </div>
            </div>

            {isLoading && <div className="empty-state">시설 데이터를 불러오는 중입니다...</div>}

            {!isLoading && currentFacilities.length === 0 && (
                <div className="empty-state">등록된 시설이 없습니다.</div>
            )}

            {!isLoading && currentFacilities.map((facility) => {
                const isAvailable = true; // 임시 예약 가능 상태

                // 💡 팝업 데이터 렌더링 부분
                const popover = (
                    <Popover id={`popover-list-${facility.facIdx}`}>
                        <Popover.Header as="h3" className="font-size-sm fw-bold">운영 시간 안내</Popover.Header>
                        <Popover.Body className="p-2">
                            <ul className="list-unstyled mb-0 font-size-sm">
                                {DAYS_OF_WEEK.map((dayLabel) => {
                                    // 주의: 백엔드 명세에 따라 t.day를 t.facDay 등으로 수정하세요!
                                    const timeInfo = facility.facility_times?.find(t => t.facDay === dayLabel);

                                    return (
                                        <li key={dayLabel} className="mb-1">
                                            <strong>{dayLabel}요일:</strong>{' '}
                                            {timeInfo ? (
                                                // 주의: 백엔드 명세에 따라 open, close, status 필드명을 수정하세요!
                                                <span>{timeInfo.facOpen} ~ {timeInfo.facClose} <span className="text-muted">({timeInfo.facTimeStatus})</span></span>
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
                    <div key={facility.facIdx} className="facility-card">
                        <div className="facility-header">
                            <span className="facility-name">{facility.facName}</span>
                            <Badge bg="success">사용 가능</Badge>
                        </div>

                        <div className="facility-meta">
                            <span>위치 {facility.facLocation || '미등록'}</span>
                            <span className="d-inline-flex align-items-center">
                                <OverlayTrigger trigger="click" placement="bottom" overlay={popover} rootClose>
                                    <span className="hours-toggle-btn">운영시간 보기</span>
                                </OverlayTrigger>
                            </span>
                        </div>

                        <div className="facility-desc">
                            {facility.facDescription || '시설물에 대한 설명이 없습니다.'}
                        </div>

                        <button
                            className={`reserve-btn ${!isAvailable ? 'disabled' : ''}`}
                            disabled={!isAvailable}
                            onClick={() => onReserve(facility.facIdx)}
                        >
                            {isAvailable ? '예약하러 가기' : '예약 불가'}
                        </button>
                    </div>
                );
            })}

            {/* 💡 페이지네이션 렌더링 부분 */}
            {!isLoading && pageData.totalPages > 1 && (
                <div className="pagination-nav">
                    <button
                        className="pagination-button"
                        onClick={() => handlePageChange(pageData.number)} // 이전 페이지
                        disabled={pageData.first}
                    >
                        이전
                    </button>

                    {[...Array(pageData.totalPages)].map((_, index) => (
                        <button
                            key={index}
                            className={`pagination-button ${pageData.number === index ? 'active' : ''}`}
                            onClick={() => handlePageChange(index + 1)} // UI는 1부터 시작
                        >
                            {index + 1}
                        </button>
                    ))}

                    <button
                        className="pagination-button"
                        onClick={() => handlePageChange(pageData.number + 2)} // 다음 페이지
                        disabled={pageData.last}
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    );
};

export default FacilityList;