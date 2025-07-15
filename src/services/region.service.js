// src/services/region.service.js

const API_ENDPOINT = 'https://grpc-proxy-server-mkvo6j4wsq-du.a.run.app/v1/regcodes';

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

export const fetchCities = async (regionCode, regionName) => {
    if (!regionCode || !regionName) return [];

    const METROPOLITAN_CITY_CODES = new Set(['11', '26', '27', '28', '29', '30', '31', '36']);
    
    if (METROPOLITAN_CITY_CODES.has(regionCode)) {
        return [regionName];
    }

    try {
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

export const getAllRegionCityMap = async () => {
    try {
        const regions = await fetchRegions();
        const citiesByRegion = {};
        const cityToRegion = {};

        const cityPromises = regions.map(async (region) => {
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