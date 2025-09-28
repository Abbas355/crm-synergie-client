import { Link } from "wouter";
import { cn, getStatusColor } from "@/lib/utils";
import { User, CalendarDays } from "lucide-react";

export interface Activity {
  id: string;
  title: string;
  type: string;
  userName: string;
  date: string;
}

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <div className="mt-8">
      <h2 className="text-lg leading-6 font-medium text-gray-900">Activités Récentes</h2>
      <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <li key={activity.id}>
              <div className="block hover:bg-gray-50 cursor-pointer" onClick={() => {}}>
                <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-medium text-primary truncate max-w-[75%] sm:max-w-[85%]">
                      {activity.title}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={cn("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", getStatusColor(activity.type))}>
                        {activity.type}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col sm:flex-row sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-xs sm:text-sm text-gray-500">
                        <User className="flex-shrink-0 mr-1 sm:mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        {activity.userName}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center text-xs sm:text-sm text-gray-500 sm:mt-0">
                      <CalendarDays className="flex-shrink-0 mr-1 sm:mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <span>{activity.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
