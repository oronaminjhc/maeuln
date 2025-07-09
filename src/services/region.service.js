// src/services/region.service.js

// 로컬 데이터 파일 import
import { regionData } from '../mock-regions';

/**
 * 모든 시/도 이름 목록을 가져옵니다.
 * @returns {Promise<string[]>} 시/도 이름 배열
 */
export const fetchRegions = async () => {
  // regionData에서 'sido' 이름만 추출하여 배열로 반환
  const sidoList = regionData.map(region => region.sido);
  return Promise.resolve(sidoList); // 비동기 함수 형식을 맞추기 위해 Promise로 감싸서 반환
};

/**
 * 선택된 시/도에 해당하는 시/군/구 목록을 가져옵니다.
 * @param {string} selectedSido - 사용자가 선택한 시/도 이름
 * @returns {Promise<string[]>} 시/군/구 이름 배열
 */
export const fetchCities = async (selectedSido) => {
  if (!selectedSido) {
    return Promise.resolve([]); // 선택된 시/도가 없으면 빈 배열 반환
  }

  // regionData에서 선택된 시/도와 일치하는 객체를 찾음
  const selectedRegion = regionData.find(region => region.sido === selectedSido);

  if (selectedRegion) {
    // 찾은 객체의 'sigungu' 배열을 반환
    return Promise.resolve(selectedRegion.sigungu);
  } else {
    // 일치하는 데이터가 없으면 빈 배열 반환
    console.warn(`No cities found for selected region: ${selectedSido}`);
    return Promise.resolve([]);
  }
};