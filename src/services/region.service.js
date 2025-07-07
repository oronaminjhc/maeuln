// src/services/region.service.js

import { regions as mockRegions } from '../data/mock-regions';

/**
 * App.js가 요청하는 'fetchRegions' 함수입니다.
 * 시/도 이름 목록만 반환합니다.
 */
export const fetchRegions = async () => {
  const sidoList = mockRegions.map(region => region.sido);
  return sidoList;
};

/**
 * App.js가 요청하는 'fetchCities' 함수입니다.
 * 선택된 시/도 이름을 받아서 해당하는 시/군/구 목록을 반환합니다.
 */
export const fetchCities = async (selectedSido) => {
  const regionData = mockRegions.find(region => region.sido === selectedSido);
  return regionData ? regionData.sigungu : [];
};