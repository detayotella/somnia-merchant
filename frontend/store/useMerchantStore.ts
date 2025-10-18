"use client";

import { create } from "zustand";
import { MerchantViewModel } from "../components/MerchantCard";

type ActivityEntry = {
  id: string;
  message: string;
  timestamp: number;
};

interface MerchantState {
  merchants: MerchantViewModel[];
  activities: ActivityEntry[];
  setMerchants: (payload: MerchantViewModel[]) => void;
  addActivity: (entry: ActivityEntry) => void;
}

export const useMerchantStore = create<MerchantState>()((set) => ({
  merchants: [],
  activities: [],
  setMerchants: (payload) => set({ merchants: payload }),
  addActivity: (entry) =>
    set((state) => ({
      activities: [entry, ...state.activities].slice(0, 20)
    }))
}));
