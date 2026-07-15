import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';

interface PUPDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PUPDatePicker({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  className = '',
}: PUPDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current date value
  const parsedDate = value ? new Date(value) : null;

  // View state for month/year in the popup calendar
  const [viewDate, setViewDate] = useState(() => {
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
    }
    return new Date();
  });

  // Keep view state in sync with external value updates
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
  }, [value]);

  // Close calendar popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigation handlers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  // Format date to DD/MM/YYYY for display in input field
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Convert Date object to YYYY-MM-DD
  const toISODateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Calendar cells calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = new Date(year, month, 1).getDay(); // 0: Sun, 1: Mon...
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

  // Previous month padding days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, d);
    cells.push({
      date: prevDate,
      isCurrentMonth: false,
      key: `prev-${d}`,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month, d);
    cells.push({
      date: currDate,
      isCurrentMonth: true,
      key: `curr-${d}`,
    });
  }

  // Next month padding days to fill 42 cells (6 rows)
  const remainingCells = 42 - cells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextDate = new Date(year, month + 1, d);
    cells.push({
      date: nextDate,
      isCurrentMonth: false,
      key: `next-${d}`,
    });
  }

  const handleSelectDay = (date: Date) => {
    onChange(toISODateString(date));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Check if two dates represent the same day
  const isSameDay = (date1: Date, date2: Date | null) => {
    if (!date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Date Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-[11px] font-bold text-gray-700 shadow-xs cursor-pointer hover:border-pup-maroon transition-all min-w-[110px] select-none h-7"
      >
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
          <span className={value ? 'text-gray-800' : 'text-gray-400'}>
            {value ? formatDateDisplay(value) : placeholder}
          </span>
        </div>
        
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Date Picker Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1 left-0 bg-white border border-gray-100 rounded-xl shadow-lg p-3 w-[210px] select-none animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="text-gray-500 hover:text-pup-maroon font-extrabold text-[13px] tracking-tighter cursor-pointer p-0.5 hover:bg-slate-50 rounded"
              title="Previous Month"
            >
              «
            </button>
            <span className="font-display font-bold text-[11.5px] text-gray-800 tracking-tight">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="text-gray-500 hover:text-pup-maroon font-extrabold text-[13px] tracking-tighter cursor-pointer p-0.5 hover:bg-slate-50 rounded"
              title="Next Month"
            >
              »
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-y-1 mb-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span key={day} className="text-[10px] font-extrabold text-gray-700">
                {day}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-y-0.5 text-center">
            {cells.map((cell) => {
              const selected = isSameDay(cell.date, parsedDate);
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => handleSelectDay(cell.date)}
                  className={`
                    h-6 w-6 mx-auto text-[10px] font-bold rounded-md transition-all flex items-center justify-center
                    ${!cell.isCurrentMonth ? 'text-gray-300' : 'text-gray-800'}
                    ${selected 
                      ? 'bg-pup-maroon text-white shadow-xs font-black' 
                      : 'hover:bg-slate-100 cursor-pointer'}
                  `}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
