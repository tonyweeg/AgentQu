import React, { useState } from 'react';
import { Activity } from '../lib/types';

interface ScoredActivity extends Activity {
  thereThenScore?: number;
  thereThenBreakdown?: {
    weather: number;
    airQuality: number;
    timeOptimization: number;
    userAffinity: number;
    ageAdjustment?: number;
  };
}

interface TimeSlot {
  time: string;
  hour: number;
  activity?: ScoredActivity;
}

interface DayItinerary {
  date: string;
  timestamp: number;
  slots: TimeSlot[];
}

interface ItineraryBuilderProps {
  tripDates: { startDate: number; endDate: number };
  scoredActivities: ScoredActivity[];
  onSaveItinerary: (itinerary: DayItinerary[]) => void;
}

const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({
  tripDates,
  scoredActivities,
  onSaveItinerary,
}) => {
  // Generate days array from trip dates
  const generateDays = (): DayItinerary[] => {
    const days: DayItinerary[] = [];
    const start = new Date(tripDates.startDate);
    const end = new Date(tripDates.endDate);

    const current = new Date(start);
    while (current <= end) {
      const slots: TimeSlot[] = [];

      // Generate time slots from 8am to 10pm (14 hours, 2-hour blocks)
      for (let hour = 8; hour <= 22; hour += 2) {
        const time = hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
        slots.push({ time, hour, activity: undefined });
      }

      days.push({
        date: current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        timestamp: current.getTime(),
        slots,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const [itinerary, setItinerary] = useState<DayItinerary[]>(generateDays());
  const [draggedActivity, setDraggedActivity] = useState<ScoredActivity | null>(null);

  const handleDragStart = (activity: ScoredActivity) => {
    setDraggedActivity(activity);
    console.log(`🎯 ITINERARY: Dragging "${activity.name}"`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dayIndex: number, slotIndex: number) => {
    if (!draggedActivity) return;

    const newItinerary = [...itinerary];
    newItinerary[dayIndex].slots[slotIndex].activity = draggedActivity;
    setItinerary(newItinerary);

    console.log(`✅ ITINERARY: Added "${draggedActivity.name}" to ${newItinerary[dayIndex].date} at ${newItinerary[dayIndex].slots[slotIndex].time}`);
    setDraggedActivity(null);
  };

  const handleRemoveActivity = (dayIndex: number, slotIndex: number) => {
    const newItinerary = [...itinerary];
    const removed = newItinerary[dayIndex].slots[slotIndex].activity;
    newItinerary[dayIndex].slots[slotIndex].activity = undefined;
    setItinerary(newItinerary);
    console.log(`🗑️ ITINERARY: Removed "${removed?.name}"`);
  };

  const handleSave = () => {
    onSaveItinerary(itinerary);
    console.log(`💾 ITINERARY: Saved itinerary with ${itinerary.length} days`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-navy-text">📅 Build Your Itinerary</h2>
        <button
          onClick={handleSave}
          className="bg-ocean-bright hover:bg-ocean-mid text-white font-bold px-6 py-2 rounded-lg transition-colors"
        >
          Save Itinerary
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity List */}
        <div className="lg:col-span-4">
          <h3 className="text-lg font-bold text-navy-text mb-4">🎯 Top Activities</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {scoredActivities.slice(0, 20).map((activity) => (
              <div
                key={activity.activityId}
                draggable
                onDragStart={() => handleDragStart(activity)}
                className="bg-gray-50 rounded-lg p-3 cursor-move hover:bg-ocean-bright/10 transition-all border-2 border-transparent hover:border-ocean-bright"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-navy-text truncate">{activity.name}</p>
                    <p className="text-xs text-gray-600">{activity.categories?.slice(0, 2).join(', ')}</p>
                  </div>
                  <div className="ml-2 bg-ocean-bright text-white px-2 py-1 rounded text-xs font-bold">
                    {activity.thereThenScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-8">
          <h3 className="text-lg font-bold text-navy-text mb-4">🗓️ Daily Timeline</h3>
          <div className="space-y-6 max-h-[600px] overflow-y-auto">
            {itinerary.map((day, dayIndex) => (
              <div key={day.timestamp} className="border-2 border-gray-200 rounded-xl p-4">
                <h4 className="font-bold text-navy-text mb-3">{day.date}</h4>
                <div className="space-y-2">
                  {day.slots.map((slot, slotIndex) => (
                    <div
                      key={slot.time}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(dayIndex, slotIndex)}
                      className={`border-2 border-dashed rounded-lg p-3 transition-all ${
                        slot.activity
                          ? 'border-ocean-bright bg-ocean-bright/10'
                          : 'border-gray-300 hover:border-ocean-bright hover:bg-gray-50'
                      }`}
                    >
                      {slot.activity ? (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 font-bold">{slot.time}</p>
                            <p className="font-bold text-navy-text">{slot.activity.name}</p>
                            <p className="text-xs text-gray-600">{slot.activity.categories?.slice(0, 2).join(', ')}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveActivity(dayIndex, slotIndex)}
                            className="ml-2 text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center">{slot.time} - Drop activity here</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryBuilder;
