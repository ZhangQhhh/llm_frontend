import { type QALogListParams } from '@/utils/chatApi';
import { ensureUserCacheLoaded, getAllCachedUsers, type CachedUser } from '@/utils/userCache';

export type UserFilterStatus =
  | 'empty'
  | 'cache-empty'
  | 'id-match'
  | 'mapped'
  | 'ambiguous'
  | 'not-found';

export interface UserFilterResult {
  params: Pick<QALogListParams, 'user_id' | 'username'>;
  status: UserFilterStatus;
  keyword?: string;
  candidates?: CachedUser[];
}

export async function buildUserFilterParams(keyword: string): Promise<UserFilterResult> {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return { params: {}, status: 'empty' };
  }

  // Username filter requires backend support; user_id is local cache fallback.
  const params: Pick<QALogListParams, 'user_id' | 'username'> = {
    username: trimmed
  };

  await ensureUserCacheLoaded();
  const users = getAllCachedUsers();
  if (!users.length) {
    console.debug('[QALogs] user cache empty, skip name mapping');
    return { params, status: 'cache-empty', keyword: trimmed };
  }

  const exactIdMatch = users.find((user) => user.id === trimmed);
  if (exactIdMatch) {
    params.user_id = exactIdMatch.id;
    return {
      params,
      status: 'id-match',
      keyword: trimmed,
      candidates: [exactIdMatch]
    };
  }

  const normalized = trimmed.toLowerCase();
  const exactMatches = users.filter((user) => user.username?.toLowerCase() === normalized);
  const candidates = exactMatches.length
    ? exactMatches
    : users.filter((user) => user.username?.toLowerCase().includes(normalized));

  if (candidates.length === 1) {
    params.user_id = candidates[0].id;
    console.debug('[QALogs] name mapped to user_id', { keyword: trimmed, user_id: params.user_id });
    return {
      params,
      status: 'mapped',
      keyword: trimmed,
      candidates
    };
  }

  if (candidates.length > 1) {
    console.debug('[QALogs] multiple user matches', candidates.map((user) => ({
      id: user.id,
      username: user.username
    })));
    return {
      params,
      status: 'ambiguous',
      keyword: trimmed,
      candidates
    };
  }

  console.debug('[QALogs] no user match for keyword', trimmed);
  return {
    params,
    status: 'not-found',
    keyword: trimmed,
    candidates: []
  };
}
