// src/services/region.service.js

// ... 기존 fetchRegions, fetchCities 함수 ...

// ▼▼▼ 이 함수를 파일에 추가해주세요 ▼▼▼
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
        return { regions: [], citiesByRegion: {}, cityToRegion: {} }; // 에러 발생 시 빈 객체 반환
    }
};