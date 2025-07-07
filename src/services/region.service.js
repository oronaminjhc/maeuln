// --- START OF FILE src/services/region.service.js ---

// ★ 여기에 발급받은 VWorld API 키를 입력하세요.
// 실제 프로덕션에서는 .env 파일로 관리하는 것이 안전합니다.
const VWORLD_API_KEY = "34C2C771-670D-3794-9960-F90675A12A17";

// VWorld 행정구역 검색 API 엔드포인트
const API_ENDPOINT = "http://api.vworld.kr/req/data";

/**
 * 시/도 목록을 가져오는 함수
 * @returns {Promise<Array<{code: string, name: string}>>} 시/도 정보 배열
 */
export const fetchRegions = async () => {
  const url = `${API_ENDPOINT}?service=data&request=GetSido&key=${VWORLD_API_KEY}&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("시/도 정보를 가져오는 데 실패했습니다.");
    }
    const data = await response.json();
    
    // API 응답 구조에 맞게 데이터 가공
    if (data.response.status === "OK") {
      return data.response.result.featureCollection.features.map(feature => ({
        code: feature.properties.ctprvn_cd,
        name: feature.properties.ctp_kor_nm,
      }));
    } else {
      throw new Error(data.response.error.text);
    }
  } catch (error) {
    console.error("fetchRegions error:", error);
    return []; // 에러 발생 시 빈 배열 반환
  }
};

/**
 * 특정 시/도의 시/군/구 목록을 가져오는 함수
 * @param {string} regionCode - 시/도 코드 (예: "11")
 * @returns {Promise<Array<{code: string, name: string}>>} 시/군/구 정보 배열
 */
export const fetchCities = async (regionCode) => {
  if (!regionCode) return [];
  
  const url = `${API_ENDPOINT}?service=data&request=GetSgg&key=${VWORLD_API_KEY}&format=json&sido=${regionCode}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("시/군/구 정보를 가져오는 데 실패했습니다.");
    }
    const data = await response.json();
    
    if (data.response.status === "OK") {
      return data.response.result.featureCollection.features.map(feature => ({
        code: feature.properties.sig_cd,
        name: feature.properties.sig_kor_nm,
      }));
    } else {
      throw new Error(data.response.error.text);
    }
  } catch (error) {
    console.error("fetchCities error:", error);
    return [];
  }
};