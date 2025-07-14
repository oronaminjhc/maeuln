// src/services/region.service.js

const API_KEY = process.env.REACT_APP_REGION_API_KEY;
const API_ENDPOINT = 'https://grpc-proxy-server-mkvo6j4wsq-du.a.run.app/v1/regcodes';

/**
 * 대한민국의 모든 시/도 정보를 가져옵니다.
 * @returns {Promise<string[]>} 시/도 이름 배열 (예: ["서울특별시", "부산광역시", ...])
 */
export const fetchRegions = async () => {
    try {
        const response = await fetch(`${API_ENDPOINT}?regcode_pattern=*00000000`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.regcodes.map(item => item.name);
    } catch (error) {
        console.error("Error fetching regions:", error);
        return []; // 오류 발생 시 빈 배열 반환
    }
};

/**
 * 특정 시/도에 속한 모든 시/군/구 정보를 가져옵니다.
 * @param {string} regionName - 시/도 이름 (예: "서울특별시")
 * @returns {Promise<string[]>} 시/군/구 이름 배열 (예: ["강남구", "강동구", ...])
 */
export const fetchCities = async (regionName) => {
    if (!regionName) return [];
    try {
        const response = await fetch(`${API_ENDPOINT}?regcode_pattern=${regionName}&is_ignore_zero=true`);
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        // 시/도 이름과 같은 경우는 제외하고, "시/도 시" 형태에서 뒤의 "시" 부분만 추출
        const cities = data.regcodes
            .map(item => item.name.split(' ')[1])
            .filter(Boolean); // undefined, null 등 빈 값 제거

        // 만약 시/군/구 구분이 없는 특별시/도(예: 세종특별자치시)인 경우, 시/도 이름을 반환
        return cities.length > 0 ? cities : [regionName];
    } catch (error) {
        console.error(`Error fetching cities for ${regionName}:`, error);
        return [];
    }
};

/**
 * 전국의 모든 '시/도'와 각 '시/도'에 속한 '시/군' 정보를 맵 형태로 한번에 가져옵니다.
 * @returns {Promise<{regions: string[], citiesByRegion: object, cityToRegion: object}>}
 */
export const getAllRegionCityMap = async () => {
    try {
        const regions = await fetchRegions();
        const citiesByRegion = {};
        const cityToRegion = {};

        const cityPromises = regions.map(async (region) => {
            const cities = await fetchCities(region);
            citiesByRegion[region] = cities;
            cities.forEach(city => {
                cityToRegion[city] = region;
            });
        });

        await Promise.all(cityPromises);
        
        return { regions, citiesByRegion, cityToRegion };
    } catch (error) {
        console.error("Error fetching all region-city maps:", error);
        return { regions: [], citiesByRegion: {}, cityToRegion: {} };
    }
};