import { ref, computed } from 'vue';
import type { GameTrackService } from './GameTrackService';

type GamificationState = {
  points: number;
  streak: number; // consecutive days with at least 1 completion
  lastCompletedDate: string | null; // YYYY-MM-DD
  todayCount: number;
  funMode: boolean;
  sound: boolean;
  reducedMotion: boolean | null; // null = follow system
};

const STORAGE_KEY = 'gamification_state_v1';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function loadState(): GamificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // defaults
  return {
    points: 0,
    streak: 0,
    lastCompletedDate: null,
    todayCount: 0,
    funMode: true,
    sound: false,
    reducedMotion: null,
  };
}

function saveState(state: GamificationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export class GamificationService {
  private state = ref<GamificationState>(loadState());
  private tracker: GameTrackService | null = null;

  public points = computed(() => this.state.value.points);
  public streak = computed(() => this.state.value.streak);
  public todayCount = computed(() => this.state.value.todayCount);
  public funMode = computed(() => this.state.value.funMode);
  public sound = computed(() => this.state.value.sound);
  public reducedMotionOverride = computed(() => this.state.value.reducedMotion);
  public reducedMotion = computed(() => {
    const override = this.state.value.reducedMotion;
    if (override !== null) return override;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  setTracker(tracker: GameTrackService) {
    this.tracker = tracker;
  }

  onTaskCompleted() {
    const s = { ...this.state.value };
    const today = todayStr();

    // Streak logic
    if (s.lastCompletedDate === null) {
      s.streak = 1;
    } else if (s.lastCompletedDate === today) {
      // same day, keep streak
    } else {
      const prev = new Date(s.lastCompletedDate + 'T00:00:00Z');
      const t = new Date(today + 'T00:00:00Z');
      const diff = (t.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        s.streak += 1;
      } else if (diff > 1) {
        s.streak = 1; // reset
      }
    }

    // Update last completed date and today counter
    if (s.lastCompletedDate === today) {
      s.todayCount += 1;
    } else {
      s.lastCompletedDate = today;
      s.todayCount = 1;
    }

    // Points: simple +10 per completion with small bonus every 5th
    s.points += 10;
    if (s.todayCount % 5 === 0) s.points += 10;

    this.state.value = s;
    saveState(s);
  }

  /**
   * Award points only if this taskId hasn't been awarded before.
   * Returns true if points were awarded now; false if already tracked or tracker missing.
   */
  async onTaskCompletedIfEligible(taskId: string): Promise<boolean> {
    if (!taskId || !taskId.trim()) return false;
    if (!this.tracker) return false;
    const isNew = await this.tracker.add(taskId.trim());
    if (!isNew) return false;
    this.onTaskCompleted();
    return true;
  }

  setFunMode(enabled: boolean) {
    const s = { ...this.state.value, funMode: enabled };
    this.state.value = s; saveState(s);
  }

  setSound(enabled: boolean) {
    const s = { ...this.state.value, sound: enabled };
    this.state.value = s; saveState(s);
  }

  setReducedMotion(value: boolean | null) {
    const s = { ...this.state.value, reducedMotion: value };
    this.state.value = s; saveState(s);
  }
}

export const gamificationService = new GamificationService();
