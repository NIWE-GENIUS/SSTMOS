import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui";
export default function TrainerDashboard() {
  return (
    <div>
      <PageHeader title="Trainer Dashboard" description="Your teaching schedule" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/trainer/timetable" className="card hover:shadow-md"><h3 className="font-semibold">My Timetable</h3><p className="text-sm text-gray-500 mt-1">View your published schedule</p></Link>
      </div>
    </div>
  );
}
