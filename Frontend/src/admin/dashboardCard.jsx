import { ArrowRight, PiIcon } from "lucide-react";

const DashboardCard = ({ title, description, bgColor, textColor, onClick }) => (
  <button
    onClick={onClick}
    className="text-left w-full p-6 rounded-xl shadow-sm border border-gray-200 transition-shadow duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${bgColor} border-2 ${textColor}`}>
      <PiIcon size={24} className={`${textColor}`} />
    </div>
    <h3 className="mt-4 text-xl font-semibold text-gray-800">{title}</h3>
    <p className="mt-2 text-sm text-gray-500">{description}</p>
    <div className="mt-4 flex items-center text-sm font-medium text-indigo-600">
      Go to page <ArrowRight className="ml-2 h-4 w-4" />
    </div>
  </button>
);
export default DashboardCard