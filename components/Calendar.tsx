'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  events: Record<string, any[]>;
  onDateClick: (date: string) => void;
}

export default function Calendar({ events, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)}>
          <ChevronLeft />
        </button>
        <h3 className="font-bold text-lg">{`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}</h3>
        <button onClick={() => changeMonth(1)}>
          <ChevronRight />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className="font-semibold text-gray-600">
            {day}
          </div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`}></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, day) => {
          const date = day + 1;
          const fullDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
          const isToday = today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth() && today.getDate() === date;
          const hasEvent = events[fullDateStr]?.length > 0;

          return (
            <div
              key={date}
              onClick={() => onDateClick(fullDateStr)}
              className="py-2 cursor-pointer relative"
            >
              <span
                className={`mx-auto flex items-center justify-center rounded-full w-8 h-8 ${
                  isToday ? 'bg-red-500 text-white' : ''
                } ${hasEvent ? 'font-bold' : ''}`}
              >
                {date}
              </span>
              {hasEvent && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 