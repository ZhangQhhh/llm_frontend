import type { ReferenceSource } from '@/utils/chatApi';

interface MockConversationContent {
  user: string;
  assistant: string;
}

const BASE_REFERENCES: ReferenceSource[] = [
  {
    id: 'DOC-001',
    fileName: '边检政策手册-2024.pdf',
    content: '对持旅游签证入境的旅客，需要重点核查停留目的、停留时间以及与申报计划的一致性，必要时可要求补充财务证明。',
    initialScore: 0.86,
    rerankedScore: 0.92,
    canAnswer: true,
    retrievalSources: ['vector', 'keyword'],
    vectorScore: 0.9234,
    bm25Score: 18.4567,
    vectorRank: 1,
    bm25Rank: 3,
    matchedKeywords: ['旅游签证', '入境', '核查', '财务证明'],
    metadata: {
      retrieval_sources: ['vector', 'keyword'],
      vector_rank: 1,
      vector_score: 0.92,
      bm25_rank: 3,
      bm25_score: 18.4
    }
  },
  {
    id: 'DOC-017',
    fileName: '出入境风险排查指南.docx',
    content: '旅客宣称访问亲友但无法提供具体地址、联系方式或邀请函内容模糊时，需关注是否存在超范围停留或非法就业风险。',
    initialScore: 0.78,
    rerankedScore: 0.88,
    canAnswer: true,
    retrievalSources: ['vector'],
    vectorScore: 0.8845,
    vectorRank: 2,
    metadata: {
      retrieval_sources: ['vector'],
      vector_rank: 2,
      vector_score: 0.88
    }
  },
  {
    id: 'DOC-032',
    fileName: '签证核验要点.xlsx',
    content: '申根短期签证通常对应 90/180 原则，核验时需确认护照上既往入境章，确保累计停留时间没有超限。',
    initialScore: 0.65,
    rerankedScore: 0.74,
    canAnswer: true,
    retrievalSources: ['keyword'],
    bm25Score: 23.1234,
    bm25Rank: 1,
    matchedKeywords: ['签证', '申根', '90/180', '停留时间'],
    metadata: {
      retrieval_sources: ['keyword'],
      bm25_rank: 1,
      bm25_score: 23.1
    }
  },
  {
    id: 'DOC-044',
    fileName: '国际航班口岸检查手册.pdf',
    content: '当旅客提供的资金证明与其行程安排明显不匹配时，可参考"资金不足核查流程"，包括二次询问和银行流水核验。',
    initialScore: 0.54,
    rerankedScore: 0.61,
    canAnswer: false,
    retrievalSources: ['vector', 'keyword'],
    vectorScore: 0.6123,
    bm25Score: 15.2345,
    vectorRank: 6,
    bm25Rank: 5,
    matchedKeywords: ['资金证明', '行程', '核查'],
    metadata: {
      retrieval_sources: ['vector', 'keyword'],
      vector_rank: 6,
      vector_score: 0.61,
      bm25_rank: 5,
      bm25_score: 15.2
    }
  }
];

const DEFAULT_ANSWER =
`针对该旅客情况，建议按以下步骤核查：
1. 先确认入境目的与签证类型是否一致，特别是访问亲友与旅游签证之间是否存在描述冲突；
2. 根据 90/180 原则核查护照上一次出入境记录，确保总停留期没有超限；
3. 结合现有资金证明，参照《资金不足核查流程》评估其停留安排是否可信。`;

const DEFAULT_THINKING =
`<think>步骤分解：
├─核对签证类型与申报目的是否一致；
├─检索 90/180 最新政策，确认是否需要提醒；
└─根据资金证明判断是否需要触发二次询问。</think>`;

const CONVERSATION_HISTORY: MockConversationContent = {
  user: '一名旅客持申根旅游签证准备入境，说是去看表哥，但无法提供具体地址，也拿不出详细行程。我们该关注哪些风险点？',
  assistant: '可以从三个方面着手：首先确认其访问理由是否与旅游签证匹配，其次结合护照记录核查 90/180 原则，最后评估资金证明是否覆盖申报行程，并视情况启动补充询问流程。'
};

let cachedToggle: boolean | null = null;

const cloneReference = (reference: ReferenceSource): ReferenceSource => {
  const metadata = reference.metadata ? { ...reference.metadata } : undefined;
  const nodeMetadata = reference.node?.metadata ? { ...reference.node.metadata } : undefined;

  return {
    ...reference,
    metadata,
    node: reference.node
      ? {
          ...reference.node,
          metadata: nodeMetadata
        }
      : undefined
  };
};

export const getMockReferences = (): ReferenceSource[] => BASE_REFERENCES.map(cloneReference);

export const getMockAnswer = (): string => DEFAULT_ANSWER;

export const getMockThinking = (): string => DEFAULT_THINKING;

export const getMockConversation = (): MockConversationContent => ({ ...CONVERSATION_HISTORY });

export const shouldUseReferenceMocks = (): boolean => {
  if (cachedToggle !== null) {
    return cachedToggle;
  }

  const envFlag = process.env.VUE_APP_ENABLE_REFERENCE_MOCKS === 'true';
  if (envFlag) {
    cachedToggle = true;
    return true;
  }

  if (typeof window === 'undefined') {
    cachedToggle = false;
    return false;
  }

  try {
    if (window.localStorage?.getItem('ENABLE_REFERENCE_MOCKS') === 'true') {
      cachedToggle = true;
      return true;
    }
  } catch {
    // 忽略 localStorage 访问异常
  }

  const params = new URLSearchParams(window.location.search);
  cachedToggle = params.get('mockReferences') === '1';
  return cachedToggle;
};
