export interface FeedbackListItem {
  feedbackId: number;
  feedbackType: string;
  question: string;
  answer?: string;
  modelId: string;
  createAt: string;
  reporterName?: string;
  reporterUnit?: string;
  reason?: string;
}

export interface FeedbackListCache {
  pageNum: number;
  pageSize: number;
  feedbackType: string;
  total: number;
  pages: number;
  records: FeedbackListItem[];
  scrollTop: number;
  lastClickedId: number | null;
  restoreOnNextEnter: boolean;
  updatedAt: number;
}

const DEFAULT_CACHE: FeedbackListCache = {
  pageNum: 1,
  pageSize: 10,
  feedbackType: '',
  total: 0,
  pages: 0,
  records: [],
  scrollTop: 0,
  lastClickedId: null,
  restoreOnNextEnter: false,
  updatedAt: 0,
};

let cache: FeedbackListCache | null = null;

export const getFeedbackListCache = (): FeedbackListCache | null => cache;

export const updateFeedbackListCache = (partial: Partial<FeedbackListCache>): FeedbackListCache => {
  cache = {
    ...(cache ?? DEFAULT_CACHE),
    ...partial,
    updatedAt: Date.now(),
  };
  return cache;
};

export const clearFeedbackListCache = (): void => {
  cache = null;
};
