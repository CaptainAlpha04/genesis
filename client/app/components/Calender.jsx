// components/Calendar.jsx
import React, { useState } from 'react';
import Calendar from 'react-calendar';

const CustomCalendar = () => {
  const [date, setDate] = useState(new Date());

  return (
    <div className="flex justify-center items-center p-2 relative bottom-10">
      <div className="w-full max-w-sm p-4 bg-white shadow-lg rounded-lg dark:bg-gray-900">
        <Calendar
          onChange={setDate}
          value={date}
          className="custom-calendar"
        />
      </div>
    </div>
  );
};

export default CustomCalendar;
