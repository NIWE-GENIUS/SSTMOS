import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui";
export default function HtDashboard() {
  return (
    <div>
      <PageHeader title="Head Teacher Dashboard" description="School-wide oversight" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/ht/timetable" className="card hover:shadow-md"><h3 className="font-semibold">Published Timetable</h3><p className="text-sm text-gray-500 mt-1">Master school timetable</p></Link>
        <Link to="/ht/reports" className="card hover:shadow-md"><h3 className="font-semibold">Reports</h3><p className="text-sm text-gray-500 mt-1">Workload and coverage</p></Link>
      </div>
    </div>
  );
}
