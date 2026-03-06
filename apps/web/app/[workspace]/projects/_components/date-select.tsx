import { format } from "date-fns";
import { Calendar as CalendarIcon, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function DateSelect({
  startDate,
  setStartDate,
  targetDate,
  setTargetDate,
}: {
  startDate: Date | undefined;
  setStartDate: (date: Date) => void;
  targetDate: Date | undefined;
  setTargetDate: (date: Date) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button className="gap-1.5" size="sm" type="button" variant="outline">
            {startDate ? (
              format(startDate, "MMM dd, yyyy")
            ) : (
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                <span>Start</span>
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            disabled={(date) =>
              date < new Date(Date.now() - 1000 * 60 * 60 * 24)
            }
            mode="single"
            onSelect={setStartDate}
            required
            selected={startDate}
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="gap-1.5"
            disabled={!startDate}
            size="sm"
            type="button"
            variant="outline"
          >
            {targetDate ? (
              format(targetDate, "MMM dd, yyyy")
            ) : (
              <div className="flex items-center gap-1.5">
                <Target className="size-3.5" />
                <span>Target</span>
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            disabled={(date) => {
              if (date < new Date("1900-01-01")) {
                return true;
              }
              if (startDate !== undefined && date <= startDate) {
                return true;
              }
              return false;
            }}
            mode="single"
            onSelect={setTargetDate}
            required
            selected={targetDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
