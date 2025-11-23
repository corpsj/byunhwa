import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    parse,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import styles from './Calendar.module.css';

type CalendarProps = {
    schedules: { time: string; remaining: number }[];
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
};

export default function Calendar({ schedules, selectedDate, onDateSelect }: CalendarProps) {
    // Fixed to December of current year (or 2024 if preferred, but dynamic is better)
    const [currentMonth] = useState(new Date(new Date().getFullYear(), 11, 1)); // Month is 0-indexed, 11 is Dec

    // Extract dates that have schedules
    const scheduledDates = schedules.map((s) => {
        // Parse "12월 25일 (수) 14:00" format
        // Assuming current year for simplicity as per original logic
        const match = s.time.match(/(\d{1,2})월\s*(\d{1,2})일/);
        if (!match) return null;
        const year = new Date().getFullYear();
        return new Date(year, Number(match[1]) - 1, Number(match[2]));
    }).filter(Boolean) as Date[];

    const hasSchedule = (date: Date) => {
        return scheduledDates.some((d) => isSameDay(d, date));
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });



    return (
        <div className={styles.calendar}>
            <div className={styles.header}>
                {/* Navigation hidden as requested */}
                <span className={styles.monthTitle}>
                    {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                </span>
            </div>

            <div className={styles.daysRow}>
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                    <div key={day} className={styles.dayName}>
                        {day}
                    </div>
                ))}
            </div>

            <div className={styles.grid}>
                {calendarDays.map((day) => {
                    const isScheduled = hasSchedule(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={day.toString()}
                            className={`${styles.cell} ${!isCurrentMonth ? styles.disabled : ''
                                } ${isSelected ? styles.selected : ''} ${isScheduled ? styles.scheduled : ''
                                }`}
                            onClick={() => {
                                if (isScheduled) onDateSelect(day);
                            }}
                        >
                            <span className={styles.dayNumber}>{format(day, 'd')}</span>
                            {isScheduled && <div className={styles.dot} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
