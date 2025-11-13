import type { ReferenceMetadata, ReferenceSource } from '@/utils/chatApi';

export interface RetrievalTag {
  key: string;
  type: 'vector' | 'keyword' | 'other';
  label: string;
}

const SOURCE_LABELS: Record<string, string> = {
  vector: '向量检索',
  keyword: '关键词检索',
  bm25: '关键词检索'
};

const formatTagLabel = (name: string, rank?: number, score?: number): string => {
  const parts = [name];
  if (typeof rank === 'number') {
    parts.push(`第${rank}名`);
  }
  if (typeof score === 'number') {
    const precision = score >= 1 ? 2 : 4;
    parts.push(`分 ${score.toFixed(precision)}`);
  }
  return parts.join(' · ');
};

export const extractReferenceMetadata = (reference: ReferenceSource): ReferenceMetadata | undefined => {
  return reference.node?.metadata ?? reference.metadata;
};

export const buildRetrievalTags = (reference: ReferenceSource): RetrievalTag[] => {
  const metadata = extractReferenceMetadata(reference);
  if (!metadata) {
    return [];
  }

  const rawSources = metadata.retrieval_sources;
  const sources = Array.isArray(rawSources)
    ? rawSources
    : rawSources
      ? [rawSources]
      : [];

  return sources
    .map((source, index) => {
      if (!source) {
        return null;
      }
      const normalized = source.toString().toLowerCase();
      if (normalized === 'vector') {
        return {
          key: `vector-${reference.id}-${index}`,
          type: 'vector' as const,
          label: formatTagLabel(SOURCE_LABELS.vector, metadata.vector_rank, metadata.vector_score)
        };
      }
      if (normalized === 'keyword' || normalized === 'bm25') {
        return {
          key: `keyword-${reference.id}-${index}`,
          type: 'keyword' as const,
          label: formatTagLabel(SOURCE_LABELS.keyword, metadata.bm25_rank, metadata.bm25_score)
        };
      }
      const label = SOURCE_LABELS[normalized] || source.toString();
      return {
        key: `${normalized}-${reference.id}-${index}`,
        type: 'other' as const,
        label: formatTagLabel(label)
      };
    })
    .filter((tag): tag is RetrievalTag => Boolean(tag));
};

