// src/services/region.service.js

const API_KEY = process.env.REACT_APP_REGION_API_KEY;
const API_ENDPOINT = 'https://grpc-proxy-server-mkvo6j4wsq-du.a.run.app/v1/regcodes';

/**
 * 대한민국의 모든 시/도 정보를 가져옵니다.
 * @returns {Promise<Array<{name: string, code: string}>>} 시/도 객체 배열 (예: [{name: "서울특별시", code: "1100000000"}, ...])
 */
export const fetchRegions = async () => {
    try {
        const response = await fetch(`${API_ENDPOINT}?regcode_pattern=*00000000`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        // [수정] 이름만 반환하는 대신, 이름과 코드가 포함된 객체 배열을 반환합니다.
        return data.regcodes.map(item => ({ name: item.name, code: item.code }));
    } catch (error) {
        console.error("Error fetching regions:", error);
        return [];
    }
};

/**
 * 특정 시/도에 속한 모든 시/군/구 정보를 가져옵니다.
 * @param {string} regionCode - 시/도 법정동 코드 (예: "1100000000")
 * @returns {Promise<string[]>} 시/군/구 이름 배열 (예: ["강남구", "강동구", ...])
 */
export const fetchCities = async (regionCode) => {
    if (!regionCode) return [];
    try {
        // [수정] regionName 대신 regionCode를 사용하여 API를 호출합니다.
        const codePrefix = regionCode.substring(0, 2);
        const response = await fetch(`${API_ENDPOINT}?regcode_pattern=${codePrefix}*00000&is_ignore_zero=true`);
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        // [수정] 시/도 이름과 같은 경우는 제외하고, "시/도 시" 형태에서 뒤의 "시/군/구" 부분만 추출
        const cities = data.regcodes
            .filter(item => item.code !== regionCode) // 시/도 자체(예: 경기도)는 제외
            .map(item => item.name.split(' ')[1])
            .filter(Boolean); // undefined, null 등 빈 값 제거

        // 시/군/구 구분이 없는 특별시/광역시/특별자치시의 경우, 시/도 이름을 반환
        const regionName = data.regcodes.find(item => item.code === regionCode)?.name;
        return cities.length > 0 ? cities : (regionName ? [regionName.split(' ')[0]] : []);
    } catch (error) {
        console.error(`Error fetching cities for code ${regionCode}:`, error);
        return [];
    }
};

/**
 * 전국의 모든 '시/도'와 각 '시/도'에 속한 '시/군' 정보를 맵 형태로 한번에 가져옵니다.
 * @returns {Promise<{regions: string[], citiesByRegion: object, cityToRegion: object}>}
 */
export const getAllRegionCityMap = async () => {
    try {
        const regions = await fetchRegions(); // 이제 regions는 객체 배열입니다.
        const citiesByRegion = {};
        const cityToRegion = {};

        const cityPromises = regions.map(async (region) => {
            // [수정] fetchCities에 코드만 전달합니다.
            const cities = await fetchCities(region.code);
            citiesByRegion[region.name] = cities;
            cities.forEach(city => {
                cityToRegion[city] = region.name;
            });
        });

        await Promise.all(cityPromises);
        
        return { regions: regions.map(r => r.name), citiesByRegion, cityToRegion };
    } catch (error) {
        console.error("Error fetching all region-city maps:", error);
        return { regions: [], citiesByRegion: {}, cityToRegion: {} };
    }
};