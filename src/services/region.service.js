// src/services/region.service.js

const API_KEY = process.env.REACT_APP_REGION_API_KEY;
// 참고: 현재 코드에서는 API_KEY를 사용하지 않고 있으나, 향후 인증이 필요할 경우를 위해 유지합니다.
const API_ENDPOINT = 'https://grpc-proxy-server-mkvo6j4wsq-du.a.run.app/v1/regcodes';

/**
 * 대한민국의 모든 시/도 정보를 가져옵니다.
 * @returns {Promise<Array<{name: string, code: string}>>} 시/도 객체 배열 (예: [{name: "서울특별시", code: "11"}, ...])
 */
export const fetchRegions = async () => {
    try {
        const response = await fetch(`${API_ENDPOINT}?regcode_pattern=*00000000`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        // [수정] 문자열 대신 {name, code} 객체 배열을 반환합니다.
        return data.regcodes.map(item => ({
            name: item.name,
            code: item.code.substring(0, 2) // "1100000000" -> "11"
        }));
    } catch (error) {
        console.error("Error fetching regions:", error);
        return [];
    }
};

/**
 * 특정 시/도에 속한 모든 시/군/구 정보를 가져옵니다.
 * @param {string} regionCode - 시/도 코드 (예: "11")
 * @returns {Promise<string[]>} 시/군/구 이름 배열 (예: ["강남구", "강동구", ...])
 */
export const fetchCities = async (regionCode) => {
    if (!regionCode) return [];
    try {
        // [수정] 지역 이름 대신 지역 코드로 API를 호출합니다.
        const response = await fetch(`${API_ENDPOINT}?regcode_pattern=${regionCode}*00000&is_ignore_zero=true`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        // [수정] 더 안정적인 파싱 로직으로 변경합니다.
        const cities = data.regcodes
            // 1. "서울특별시" 와 같은 시/도 이름 자체는 제외
            .filter(item => item.name.split(' ').length > 1) 
            // 2. "서울특별시 강남구" -> "강남구" 추출
            .map(item => item.name.split(' ')[1])
            .filter(Boolean);

        // 세종시처럼 시/군/구 구분이 없는 경우, "세종특별자치시" 와 같이 시/도 이름 반환
        if (cities.length === 0 && data.regcodes.length > 0) {
            // "세종특별자치시"와 같이 하나의 결과만 있는 경우 해당 이름을 반환
            const singleRegionName = data.regcodes[0].name.split(' ')[0];
            return [singleRegionName];
        }
        
        return cities;
    } catch (error) {
        console.error(`Error fetching cities for code ${regionCode}:`, error);
        return [];
    }
};


/**
 * 전국의 모든 '시/도'와 각 '시/도'에 속한 '시/군' 정보를 맵 형태로 한번에 가져옵니다.
 * @returns {Promise<{regions: Array<{name: string, code: string}>, citiesByRegion: object, cityToRegion: object}>}
 */
export const getAllRegionCityMap = async () => {
    try {
        const regions = await fetchRegions(); // {name, code} 객체 배열
        const citiesByRegion = {};
        const cityToRegion = {};

        const cityPromises = regions.map(async (region) => {
            // [수정] region.code를 fetchCities에 전달
            const cities = await fetchCities(region.code);
            citiesByRegion[region.name] = cities;
            cities.forEach(city => {
                cityToRegion[city] = region.name;
            });
        });

        await Promise.all(cityPromises);
        
        return { regions, citiesByRegion, cityToRegion };
    } catch (error) {
        console.error("Error fetching all region-city maps:", error);
        return { regions: [], citiesByRegion: {}, cityToRegion: {} };
    }
};