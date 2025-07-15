// src/services/region.service.js

const API_ENDPOINT = 'https://grpc-proxy-server-mkvo6j4wsq-du.a.run.app/v1/regcodes';

/**
 * 대한민국의 모든 시/도 정보를 가져옵니다.
 * @returns {Promise<Array<{name: string, code: string}>>} 시/도 객체 배열
 */
export const fetchRegions = async () => {
    try {
        const response = await fetch(`${API_ENDPOINT}?regcode_pattern=*00000000`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.regcodes.map(item => ({
            name: item.name,
            code: item.code.substring(0, 2)
        }));
    } catch (error) {
        console.error("Error fetching regions:", error);
        return [];
    }
};

/**
 * 특정 시/도에 속한 시/군/구 정보를 가져옵니다.
 * 광역시/특별시는 도시 이름만, 일반 '도'는 시/군 목록을 반환합니다.
 * @param {string} regionCode - 시/도 코드 (예: "11")
 * @param {string} regionName - 시/도 이름 (예: "서울특별시")
 * @returns {Promise<string[]>} 시/군/구 이름 배열
 */
export const fetchCities = async (regionCode, regionName) => {
    if (!regionCode || !regionName) return [];

    // ▼▼▼▼▼ [수정] 광역시/특별시 코드 목록 ▼▼▼▼▼
    const METROPOLITAN_CITY_CODES = new Set(['11', '26', '27', '28', '29', '30', '31', '36']);
    
    // 선택된 지역이 광역시/특별시이면 API 호출 없이 바로 도시 이름만 반환합니다.
    if (METROPOLITAN_CITY_CODES.has(regionCode)) {
        return [regionName];
    }
    // ▲▲▲▲▲ [수정] 광역시/특별시 처리 로직 ▲▲▲▲▲

    try {
        // 일반 '도'의 경우에만 API를 호출하여 시/군 목록을 가져옵니다.
        const response = await fetch(`${API_ENDPOINT}?regcode_pattern=${regionCode}*00000&is_ignore_zero=true`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const cities = data.regcodes
            .filter(item => item.name.split(' ').length > 1) 
            .map(item => item.name.split(' ')[1])
            .filter(Boolean);
        
        return cities;
    } catch (error) {
        console.error(`Error fetching cities for code ${regionCode}:`, error);
        return [];
    }
};

/**
 * 전국의 모든 지역 정보를 맵 형태로 한번에 가져옵니다.
 * @returns {Promise<{regions: Array<{name: string, code: string}>, citiesByRegion: object, cityToRegion: object}>}
 */
export const getAllRegionCityMap = async () => {
    try {
        const regions = await fetchRegions();
        const citiesByRegion = {};
        const cityToRegion = {};

        const cityPromises = regions.map(async (region) => {
            // [수정] fetchCities에 region.name도 함께 전달합니다.
            const cities = await fetchCities(region.code, region.name);
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