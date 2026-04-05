import React from 'react';
import { Clock, Bell, Calendar } from 'lucide-react';

interface HistoryItem {
  text: string;
  at: Date;
}

interface HistoryTabProps {
  history: HistoryItem[];
}

const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  const formatTime = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group history by date
  const groupedHistory = history.reduce((groups, item) => {
    const dateKey = item.at.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notification History</h2>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No notifications yet
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            When new articles are found, notifications will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateKey => (
            <div key={dateKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                {formatDate(new Date(dateKey))}
              </h3>
              
              <div className="space-y-3">
                {groupedHistory[dateKey].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {formatTime(item.at)}
                      </div>
                      <div className="text-gray-900 dark:text-white">
                        {item.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;