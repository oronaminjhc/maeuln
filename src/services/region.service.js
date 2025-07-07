// src/services/region.service.js

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase'; // 이제 정상적으로 동작하는 진짜 db를 가져옵니다.

/**
 * Firestore의 'regions' 컬렉션에서 모든 시/도 이름 목록을 가져옵니다.
 */
export const fetchRegions = async () => {
  try {
    const regionsCollectionRef = collection(db, 'regions');
    const data = await getDocs(regionsCollectionRef);
    // 각 문서에서 'sido' 필드 값만 추출하여 배열로 만듭니다.
    const sidoList = data.docs.map((doc) => doc.data().sido);
    return sidoList;
  } catch (error) {
    console.error("Error fetching regions: ", error);
    return []; // 오류 발생 시 빈 배열을 반환
  }
};

/**
 * 선택된 시/도에 해당하는 시/군/구 목록을 가져옵니다.
 * @param {string} selectedSido - 사용자가 선택한 시/도 이름
 */
export const fetchCities = async (selectedSido) => {
  if (!selectedSido) {
    return []; // 선택된 시/도가 없으면 바로 빈 배열 반환
  }

  try {
    // 'regions' 컬렉션에서 'sido' 필드가 사용자가 선택한 값과 일치하는 문서를 찾습니다.
    const q = query(collection(db, 'regions'), where('sido', '==', selectedSido));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No cities found for selected region: ${selectedSido}`);
      return []; // 해당하는 문서가 없으면 빈 배열 반환
    }

    // 찾은 문서에서 'sigungu' 필드(시/군/구 배열)를 반환합니다.
    const regionDoc = querySnapshot.docs[0];
    return regionDoc.data().sigungu || [];
  } catch (error) {
    console.error("Error fetching cities: ", error);
    return []; // 오류 발생 시 빈 배열을 반환
  }
};