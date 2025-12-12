import { AllProgress, DifficultySet, LevelProgress } from "../types";

/**
 * Ebbinghaus Forgetting Curve intervals customized for this app:
 * Stage 0: New
 * Stage 1: Review after 20 mins
 * Stage 2: Review after 1 hour
 * Stage 3: Review after 9 hours
 * Stage 4: Review after 1 day
 * Stage 5: Review after 2 days
 * Stage 6: Review after 6 days
 */
const REVIEW_INTERVALS_MINUTES = [
  20,      // Stage 0 -> 1 (Wait 20m)
  60,      // Stage 1 -> 2 (Wait 1h)
  540,     // Stage 2 -> 3 (Wait 9h)
  1440,    // Stage 3 -> 4 (Wait 1d)
  2880,    // Stage 4 -> 5 (Wait 2d)
  8640     // Stage 5 -> 6 (Wait 6d)
];

const STORAGE_KEY = 'smart_speed_reading_progress';

const getInitialProgress = (): AllProgress => ({
  A: { level: 'A', lastPlayed: 0, stage: 0, history: [] },
  B: { level: 'B', lastPlayed: 0, stage: 0, history: [] },
  C: { level: 'C', lastPlayed: 0, stage: 0, history: [] }
});

export const getProgress = (): AllProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getInitialProgress();
  } catch (e) {
    return getInitialProgress();
  }
};

export const saveLevelProgress = (level: DifficultySet) => {
  const all = getProgress();
  const current = all[level];
  const now = Date.now();
  
  // Logic to determine if we should increment the stage
  // We require the user to have waited at least 50% of the target interval 
  // to count it as a successful "spaced repetition" review.
  let newStage = current.stage;
  
  if (current.stage === 0) {
    newStage = 1;
  } else {
    // Get the interval relevant to the current stage (previous review)
    // safe guard index
    const intervalIndex = Math.min(current.stage - 1, REVIEW_INTERVALS_MINUTES.length - 1);
    const targetIntervalMinutes = REVIEW_INTERVALS_MINUTES[intervalIndex];
    const minutesSinceLast = (now - current.lastPlayed) / (1000 * 60);

    // If enough time has passed (at least half the required interval), advance stage
    // Otherwise, they are just practicing within the same stage
    if (minutesSinceLast >= targetIntervalMinutes * 0.5) {
      newStage = Math.min(current.stage + 1, REVIEW_INTERVALS_MINUTES.length);
    }
  }

  all[level] = {
    ...current,
    lastPlayed: now,
    stage: newStage,
    history: [...current.history, now]
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

export const resetProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getNextReviewIntervalLabel = (stage: number): string => {
  // If stage is 0 (just finished first time), target is index 0 (20m)
  const index = Math.min(Math.max(0, stage), REVIEW_INTERVALS_MINUTES.length - 1);
  const mins = REVIEW_INTERVALS_MINUTES[index];
  
  if (mins < 60) return `${mins}分鐘`;
  if (mins < 1440) return `${Math.floor(mins/60)}小時`;
  return `${Math.floor(mins/1440)}天`;
};

export const getNextReviewDate = (stage: number): Date => {
  const now = new Date();
  const index = Math.min(Math.max(0, stage), REVIEW_INTERVALS_MINUTES.length - 1);
  const minutesToAdd = REVIEW_INTERVALS_MINUTES[index];
  return new Date(now.getTime() + minutesToAdd * 60000);
};

/**
 * Generates an .ics file content for Calendar integration
 */
export const downloadCalendarReminder = (wordSet: string, stage: number) => {
  // Use stage (current progress) to determine next interval.
  // E.g. If stage is 0, we want to remind for Stage 1 (20 mins later)
  const reviewDate = getNextReviewDate(stage);
  const label = getNextReviewIntervalLabel(stage);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
  };

  const start = formatDate(reviewDate);
  const endDate = new Date(reviewDate.getTime() + 15 * 60000);
  const end = formatDate(endDate);

  const title = `溫習速讀: 等級 ${wordSet} (${label}後)`;
  const description = `根據遺忘曲線，現在是時候溫習等級 ${wordSet} 的生字了！保持記憶清晰！\n目標: ${label}後複習。`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SmartSpeedReading//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@smartspeedreading.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT5M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `review_reminder_${wordSet}_${label}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};