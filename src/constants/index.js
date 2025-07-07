// src/constants/index.js

export const ADMIN_UID = 'wvXNcSqXMsaiqOCgBvU7A4pJoFv1';

export const categoryStyles = {
    '일상': { text: 'text-purple-600', bg: 'bg-purple-100', bgStrong: 'bg-purple-500' },
    '친목': { text: 'text-pink-600', bg: 'bg-pink-100', bgStrong: 'bg-pink-500' },
    '10대': { text: 'text-cyan-600', bg: 'bg-cyan-100', bgStrong: 'bg-cyan-500' },
    '청년': { text: 'text-indigo-600', bg: 'bg-indigo-100', bgStrong: 'bg-indigo-500' },
    '중년': { text: 'text-yellow-600', bg: 'bg-yellow-100', bgStrong: 'bg-yellow-500' },
    '마을맘': { text: 'text-teal-600', bg: 'bg-teal-100', bgStrong: 'bg-teal-500' },
    '질문': { text: 'text-blue-600', bg: 'bg-blue-100', bgStrong: 'bg-blue-500' },
    '기타': { text: 'text-gray-600', bg: 'bg-gray-100', bgStrong: 'bg-gray-500' }
};

export const getCategoryStyle = (category, city = '') => {
    const dynamicCategoryName = `${city}맘`;
    if (category === dynamicCategoryName) {
        return categoryStyles['마을맘'];
    }
    return categoryStyles[category] || categoryStyles['기타'];
};