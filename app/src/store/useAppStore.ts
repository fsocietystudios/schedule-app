import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  AppSettings,
  Exemption,
  HistoryMonth,
  Schedule,
  ShiftRequest,
  TeamMember,
} from '@/types';

interface AppState {
  team: TeamMember[];
  exemptions: Exemption[];
  history: HistoryMonth[];
  schedules: Schedule[];
  requests: ShiftRequest[];
  settings: AppSettings;
  hasHydrated: boolean;

  addMember: (member: TeamMember) => void;
  removeMember: (id: string) => void;

  addExemption: (exemption: Exemption) => void;
  removeExemption: (id: string) => void;

  addHistoryMonth: (month: HistoryMonth) => void;
  removeHistoryMonth: (id: string) => void;

  upsertSchedule: (schedule: Schedule) => void;
  removeSchedule: (id: string) => void;

  addRequest: (request: ShiftRequest) => void;
  updateRequest: (id: string, patch: Partial<ShiftRequest>) => void;

  updateSettings: (patch: Partial<AppSettings>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      team: [],
      exemptions: [],
      history: [],
      schedules: [],
      requests: [],
      settings: {
        aiEngine: 'local',
        serverUrl: '',
        serverToken: '',
        minCoveragePerShift: 1,
      },
      hasHydrated: false,

      addMember: (member) => set((s) => ({ team: [...s.team, member] })),
      removeMember: (id) =>
        set((s) => ({
          team: s.team.filter((m) => m.id !== id),
          exemptions: s.exemptions.filter((e) => e.memberId !== id),
        })),

      addExemption: (exemption) => set((s) => ({ exemptions: [...s.exemptions, exemption] })),
      removeExemption: (id) =>
        set((s) => ({ exemptions: s.exemptions.filter((e) => e.id !== id) })),

      addHistoryMonth: (month) => set((s) => ({ history: [...s.history, month] })),
      removeHistoryMonth: (id) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),

      upsertSchedule: (schedule) =>
        set((s) => {
          const idx = s.schedules.findIndex((sc) => sc.id === schedule.id);
          if (idx === -1) return { schedules: [...s.schedules, schedule] };
          const next = [...s.schedules];
          next[idx] = schedule;
          return { schedules: next };
        }),
      removeSchedule: (id) =>
        set((s) => ({ schedules: s.schedules.filter((sc) => sc.id !== id) })),

      addRequest: (request) => set((s) => ({ requests: [...s.requests, request] })),
      updateRequest: (id, patch) =>
        set((s) => ({
          requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'shiftmind-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
