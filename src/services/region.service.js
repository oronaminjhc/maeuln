// src/services/region.service.js

// --- START OF FILE src/services/region.service.js ---

// ★ 여기에 발급받은 Vworld API 키를 입력하세요.
// 실제 프로덕션에서는 .env 파일로 관리하는 것이 안전합니다.
const VWORLD_API_KEY = "34C2C771-670D-3794-9960-F90675A12A17";

// Vworld 행정구역 검색 API 엔드포인트
const API_ENDPOINT = "http://api.vworld.kr/req/data";

// ★★★ 수정된 부분 ★★★
// 개발 환경 도메인. 배포 후에는 실제 도메인으로 변경해야 할 수 있습니다.
const CURRENT_DOMAIN = window.location.origin;


/**
 * 시/도 목록을 가져오는 함수
 * @returns {Promise<Array<{code: string, name: string}>>} 시/도 정보 배열
 */
export const fetchRegions = async () => {
    // ★★★ 수정된 부분: &domain=${CURRENT_DOMAIN} 추가
    const url = `${API_ENDPOINT}?service=data&request=GetSido&key=${VWORLD_API_KEY}&format=json&domain=${CURRENT_DOMAIN}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("시/도 정보를 가져오는 데 실패했습니다.");
        }
        const data = await response.json();

        // API 응답 구조에 맞게 데이터 파싱
        if (data.response && data.response.status === 'OK') {
            return data.response.result.sidoList.map(item => ({
                code: item.sidoCd,
                name: item.sidoNm,
            }));
        } else {
            // API 자체에서 에러를 보낸 경우
            console.error('VWorld API Error (Regions):', data.response.error.text);
            return [];
        }
    } catch (error) {
        console.error('Error fetching regions:', error);
        return [];
    }
};

/**
 * 시/군/구 목록을 가져오는 함수
 * @param {string} regionCode 시/도 코드
 * @returns {Promise<Array<{code: string, name: string}>>} 시/군/구 정보 배열
 */
export const fetchCities = async (regionCode) => {
    if (!regionCode) return [];
    
    // ★★★ 수정된 부분: &domain=${CURRENT_DOMAIN} 추가
    const url = `${API_ENDPOINT}?service=data&request=GetSgg&key=${VWORLD_API_KEY}&sidoCd=${regionCode}&format=json&domain=${CURRENT_DOMAIN}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("시/군/구 정보를 가져오는 데 실패했습니다.");
        }
        const data = await response.json();

        // API 응답 구조에 맞게 데이터 파싱
        if (data.response && data.response.status === 'OK') {
             // 결과가 없을 때 sggList가 없는 경우가 있으므로 안전하게 처리
            if (!data.response.result || !data.response.result.sggList) {
                return [];
            }
            return data.response.result.sggList.map(item => ({
                code: item.sggCd,
                name: item.sggNm,
            }));
        } else {
            console.error('VWorld API Error (Cities):', data.response.error.text);
            return [];
        }
    } catch (error) {
        console.error('Error fetching cities:', error);
        return [];
    }
};