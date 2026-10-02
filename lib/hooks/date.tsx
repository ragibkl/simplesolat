import {
  differenceInMilliseconds,
  getMonth,
  getDate,
  getYear,
  getHours,
  startOfMinute,
  addMinutes,
  getMinutes,
} from "date-fns";
import { useEffect, useState, useRef, useMemo } from "react";

function msUntilNextMinute() {
  const now = new Date();
  const next = addMinutes(startOfMinute(now), 1);
  return differenceInMilliseconds(next, now);
}

export function useCurrentDate() {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [time, setTime] = useState(startOfMinute(new Date()).getTime());
  const date = useMemo(() => new Date(time), [time]);

  useEffect(() => {
    function delayedTimeChange() {
      timer.current = setTimeout(() => {
        delayedTimeChange();
      }, msUntilNextMinute());

      setTime(startOfMinute(new Date()).getTime());
    }

    delayedTimeChange();
    return () => clearTimeout(timer.current);
  }, []);

  return {
    date,
    time,
    year: getYear(date),
    month: getMonth(date),
    day: getDate(date),
    hour: getHours(date),
    minute: getMinutes(date),
  };
}
