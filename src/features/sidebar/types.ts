export interface SessionSummary {
  id: string;
  title: string;
  projectId?: string | null;
  model: string;
  provider: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TimeBucket =
  | "Pinned"
  | "Today"
  | "Yesterday"
  | "Previous 7 Days"
  | "Previous 30 Days"
  | "Older";

export interface GroupedSessions {
  bucket: TimeBucket;
  sessions: SessionSummary[];
}

/**
 * Categorizes a timestamp (in ms) into ChatGPT-style time buckets.
 */
export function getTimeBucket(timestampMs: number, now = Date.now()): Exclude<TimeBucket, "Pinned"> {
  const nowDate = new Date(now);
  const targetDate = new Date(timestampMs);

  // Start of today (midnight)
  const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();

  // Start of yesterday
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  // 7 days ago
  const startOf7DaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

  // 30 days ago
  const startOf30DaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

  if (timestampMs >= startOfToday) {
    return "Today";
  }
  if (timestampMs >= startOfYesterday) {
    return "Yesterday";
  }
  if (timestampMs >= startOf7DaysAgo) {
    return "Previous 7 Days";
  }
  if (timestampMs >= startOf30DaysAgo) {
    return "Previous 30 Days";
  }
  return "Older";
}

/**
 * Groups sessions into Pinned + Time Buckets.
 */
export function groupSessionsByBucket(sessions: SessionSummary[], now = Date.now()): GroupedSessions[] {
  const pinnedList: SessionSummary[] = [];
  const todayList: SessionSummary[] = [];
  const yesterdayList: SessionSummary[] = [];
  const prev7DaysList: SessionSummary[] = [];
  const prev30DaysList: SessionSummary[] = [];
  const olderList: SessionSummary[] = [];

  for (const session of sessions) {
    if (session.pinned) {
      pinnedList.push(session);
    } else {
      const bucket = getTimeBucket(session.updatedAt, now);
      switch (bucket) {
        case "Today":
          todayList.push(session);
          break;
        case "Yesterday":
          yesterdayList.push(session);
          break;
        case "Previous 7 Days":
          prev7DaysList.push(session);
          break;
        case "Previous 30 Days":
          prev30DaysList.push(session);
          break;
        case "Older":
          olderList.push(session);
          break;
      }
    }
  }

  const result: GroupedSessions[] = [];
  if (pinnedList.length > 0) {
    result.push({ bucket: "Pinned", sessions: pinnedList });
  }
  if (todayList.length > 0) {
    result.push({ bucket: "Today", sessions: todayList });
  }
  if (yesterdayList.length > 0) {
    result.push({ bucket: "Yesterday", sessions: yesterdayList });
  }
  if (prev7DaysList.length > 0) {
    result.push({ bucket: "Previous 7 Days", sessions: prev7DaysList });
  }
  if (prev30DaysList.length > 0) {
    result.push({ bucket: "Previous 30 Days", sessions: prev30DaysList });
  }
  if (olderList.length > 0) {
    result.push({ bucket: "Older", sessions: olderList });
  }

  return result;
}
