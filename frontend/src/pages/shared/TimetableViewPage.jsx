import { useEffect, useState } from "react";
import { api, extractError } from "../../lib/api";
import { PageHeader, ErrorBanner, Loading, EmptyState } from "../../components/ui";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TimetableViewPage({ title = "Published Timetable" }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/timetable/views/master")
      .then(({ data }) => setEntries(data.data || []))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  const grouped = entries.reduce((acc, e) => {
    acc[e.day_of_week] = acc[e.day_of_week] || [];
    acc[e.day_of_week].push(e);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title={title} description="Published timetable" />
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      {loading ? <Loading /> : entries.length === 0 ? (
        <div className="card"><EmptyState title="No published timetable" description="Ask your DOS to publish a timetable" /></div>
      ) : (
        <div className="space-y-6">
          {Object.keys(grouped).sort().map((day) => (
            <div key={day} className="card p-0 overflow-hidden">
              <h3 className="px-4 py-3 bg-gray-50 border-b font-medium">{DAYS[day]}</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {grouped[day].sort((a, b) => a.period_number - b.period_number).map((e, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-500 w-24">{e.period_number}</td>
                      <td className="px-4 py-2 text-gray-500 w-32">{e.start_time}-{e.end_time}</td>
                      <td className="px-4 py-2 font-medium">{e.module_code} - {e.module_name}</td>
                      <td className="px-4 py-2 text-gray-600">{e.class_name}</td>
                      <td className="px-4 py-2 text-gray-600">{e.trainer_name}</td>
                      <td className="px-4 py-2 text-gray-500">{e.room_name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
