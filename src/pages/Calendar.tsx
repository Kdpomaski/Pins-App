import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Download } from "lucide-react";
import { usePinsStore } from "@/lib/store";
import { siteLabel } from "@/lib/body-map-data";
import { ScheduleExportModal } from "@/components/ScheduleExportModal";

export default function CalendarView() {
  const { data } = usePinsStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [exportOpen, setExportOpen] = useState(false);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const today = () => setCurrentDate(new Date());

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 pt-6 px-4 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1">

        <header className="flex justify-between items-center mb-8">
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium border border-border bg-card px-3 py-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Export schedule"
          >
            <Download size={16} />
            Export
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <button
            onClick={today}
            className="text-sm text-primary font-medium bg-primary/10 border border-border px-3 py-1 rounded-full"
          >
            Today
          </button>
        </header>

        <div className="flex items-center justify-between bg-card border border-border p-2 rounded-2xl mb-8">
          <button onClick={prevWeek} className="p-2 hover:bg-secondary rounded-xl text-muted-foreground transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="font-semibold text-sm">
            {format(startDate, "MMM d")} - {format(addDays(startDate, 6), "MMM d, yyyy")}
          </div>
          <button onClick={nextWeek} className="p-2 hover:bg-secondary rounded-xl text-muted-foreground transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="space-y-6 relative">
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-border z-0" />

          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            const dayIndex = day.getDay();

            const daysDoses = data.schedule.filter((s) => s.active && s.days.includes(dayIndex));
            const daysLogs = data.logs.filter((l) => isSameDay(new Date(l.timestamp), day));

            const hasActivity = daysDoses.length > 0 || daysLogs.length > 0;
            const allComplete =
              daysDoses.length > 0 &&
              daysDoses.every((dose) => daysLogs.some((log) => log.compound === dose.compound));

            return (
              <div
                key={day.toISOString()}
                className={`relative z-10 flex gap-6 ${isToday ? "opacity-100" : "opacity-80"}`}
              >
                <div className="flex flex-col items-center w-14 shrink-0 bg-background py-1">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isToday ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "EEE")}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 text-sm font-bold ${
                      isToday
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : hasActivity
                          ? "bg-card border border-border"
                          : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>

                <div className="flex-1 pt-1 pb-4">
                  {!hasActivity ? (
                    <div className="h-full flex items-center border-b border-dashed border-border/50 text-xs text-muted-foreground/50 pb-4">
                      Rest day
                    </div>
                  ) : (
                    <div
                      className={`bg-card border rounded-2xl p-4 shadow-sm ${
                        isToday ? "border-primary shadow-primary/5" : "border-border"
                      }`}
                    >
                      {allComplete && daysDoses.length > 0 && (
                        <div className="flex items-center gap-1.5 text-green-700 text-xs font-bold uppercase tracking-wider mb-3 bg-green-100 border border-border w-fit px-2 py-1 rounded-md">
                          <CheckCircle2 size={14} /> Completed
                        </div>
                      )}

                      <div className="space-y-3">
                        {daysDoses.map((dose) => {
                          const log = daysLogs.find((l) => l.compound === dose.compound);

                          return (
                            <div key={dose.id} className="flex items-start gap-3">
                              <div className="mt-0.5 text-muted-foreground">
                                {log ? (
                                  <CheckCircle2 size={18} className="text-primary" />
                                ) : (
                                  <Circle size={18} />
                                )}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {dose.compound}
                                  <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                                    {dose.dose} {dose.unit}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                                  <span>{dose.time}</span>
                                  {log && (
                                    <>
                                      <span className="text-primary">
                                        • Logged at {format(new Date(log.timestamp), "HH:mm")}
                                      </span>
                                      <span>• {siteLabel(log.siteId)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {daysLogs
                          .filter((l) => !daysDoses.some((d) => d.compound === l.compound))
                          .map((log) => (
                            <div key={log.id} className="flex items-start gap-3 opacity-80">
                              <div className="mt-0.5 text-muted-foreground">
                                <CheckCircle2 size={18} className="text-primary" />
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {log.compound}
                                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-semibold">
                                    Ad-hoc
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {log.dose} {log.unit} • {format(new Date(log.timestamp), "HH:mm")} •{" "}
                                  {siteLabel(log.siteId)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ScheduleExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}