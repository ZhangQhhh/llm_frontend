import type { ReferenceSource } from '@/utils/chatApi';

export interface MockConversationContent {
  user: string;
  assistant: string;
}

export interface SubAnswer {
  sub_question: string;
  answer: string;
}

export interface SubQuestionsData {
  sub_questions: string[];
  count: number;
  sub_answers: SubAnswer[];
}

const BASE_REFERENCES: ReferenceSource[] = [
  {
    id: '1',
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
    id: '2',
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
    id: '3',
    fileName: '签证核验要点.xlsx',
    content: '申根短期签证通常对应 90/180 原则，核验时需确认护照上既往入境章，确保累计停留时间没有超限。',
    initialScore: 0.65,
    rerankedScore: 0.74,
    canAnswer: false,
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
    id: '4',
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
  },
  {
    id: '5',
    fileName: '入境审查标准操作流程.pdf',
    content: '对于持短期签证入境的旅客，应核查其返程机票、住宿预订以及足够的旅行资金，确保符合入境条件。',
    initialScore: 0.72,
    rerankedScore: 0.81,
    canAnswer: true,
    retrievalSources: ['vector'],
    vectorScore: 0.8123,
    vectorRank: 3,
    metadata: {
      retrieval_sources: ['vector'],
      vector_rank: 3,
      vector_score: 0.81
    }
  },
  {
    id: '6',
    fileName: '边检业务规范汇编.docx',
    content: '旅客入境时如发现签证类型与入境目的不符，应详细询问并记录，必要时可拒绝入境或限制停留期限。',
    initialScore: 0.68,
    rerankedScore: 0.75,
    canAnswer: false,
    retrievalSources: ['keyword'],
    bm25Score: 19.8765,
    bm25Rank: 2,
    matchedKeywords: ['签证类型', '入境目的', '询问'],
    metadata: {
      retrieval_sources: ['keyword'],
      bm25_rank: 2,
      bm25_score: 19.8
    }
  },
  {
    id: '7',
    fileName: '申根签证管理规定.pdf',
    content: '申根区成员国实行统一的签证政策，持申根签证可在申根区内自由流动，但需遵守90/180天的停留限制。',
    initialScore: 0.81,
    rerankedScore: 0.89,
    canAnswer: true,
    retrievalSources: ['vector', 'keyword'],
    vectorScore: 0.8934,
    bm25Score: 21.3456,
    vectorRank: 2,
    bm25Rank: 1,
    matchedKeywords: ['申根签证', '90/180', '停留限制'],
    metadata: {
      retrieval_sources: ['vector', 'keyword'],
      vector_rank: 2,
      vector_score: 0.89,
      bm25_rank: 1,
      bm25_score: 21.3
    }
  },
  {
    id: '8',
    fileName: '旅客资金证明审核指引.xlsx',
    content: '旅客应提供与停留期限相匹配的资金证明，一般要求每天不低于50欧元或等值货币，可通过现金、银行卡或旅行支票形式持有。',
    initialScore: 0.59,
    rerankedScore: 0.67,
    canAnswer: false,
    retrievalSources: ['vector'],
    vectorScore: 0.6734,
    vectorRank: 5,
    metadata: {
      retrieval_sources: ['vector'],
      vector_rank: 5,
      vector_score: 0.67
    }
  },
  {
    id: '9',
    fileName: '非法就业风险识别手册.pdf',
    content: '旅客持旅游签证入境但携带大量工作相关物品、无法说明详细行程或频繁短期往返时，应警惕非法就业风险。',
    initialScore: 0.76,
    rerankedScore: 0.84,
    canAnswer: true,
    retrievalSources: ['vector', 'keyword'],
    vectorScore: 0.8412,
    bm25Score: 17.6543,
    vectorRank: 3,
    bm25Rank: 4,
    matchedKeywords: ['旅游签证', '非法就业', '行程'],
    metadata: {
      retrieval_sources: ['vector', 'keyword'],
      vector_rank: 3,
      vector_score: 0.84,
      bm25_rank: 4,
      bm25_score: 17.6
    }
  },
  {
    id: '10',
    fileName: '边检执法记录规范.docx',
    content: '对旅客进行询问和检查时，应详细记录询问内容、旅客回答以及检查结果，确保执法过程有据可查。',
    initialScore: 0.48,
    rerankedScore: 0.53,
    canAnswer: false,
    retrievalSources: ['keyword'],
    bm25Score: 12.3456,
    bm25Rank: 7,
    matchedKeywords: ['询问', '检查', '记录'],
    metadata: {
      retrieval_sources: ['keyword'],
      bm25_rank: 7,
      bm25_score: 12.3
    }
  }
];

const DEFAULT_ANSWER =
`针对该旅客情况，建议按以下步骤核查：

## 一、入境目的核查

1. **确认入境目的与签证类型是否一致**
   根据[业务规定 1]，对持旅游签证入境的旅客，需要重点核查停留目的、停留时间以及与申报计划的一致性。特别需要注意：
   - 访问亲友与旅游签证之间是否存在描述冲突
   - 核查旅客提供的邀请函、联系方式等证明材料
   - 如无法提供具体地址或联系方式，需进一步询问

2. **评估访问理由的合理性**
   参考[业务规定 2]的风险排查指引，当旅客宣称访问亲友但无法提供具体地址、联系方式或邀请函内容模糊时，需关注是否存在超范围停留或非法就业风险。应当：
   - 了解与被访者的关系及联系频率
   - 确认是否有既往访问记录
   - 核实被访者的身份信息

## 二、停留时间核查

3. **根据 90/180 原则核查护照上的出入境记录**
   依据[业务规定 7]，申根区成员国实行统一的签证政策，持申根签证可在申根区内自由流动，但需遵守90/180天的停留限制。核查时应：
   - 确保总停留期没有超限
   - 计算过去180天内的累计停留天数
   - 使用申根计算器辅助核算

4. **核对行程安排**
   按照[业务规定 5]的标准操作流程，对于持短期签证入境的旅客，应核查：
   - 返程机票预订情况
   - 住宿预订信息
   - 评估停留时间与申报目的是否匹配

## 三、资金证明核查

5. **评估旅客的资金准备情况**
   根据[业务规定 1]，必要时可要求补充财务证明。应当：
   - 核查银行流水或存款证明
   - 评估资金来源的合理性
   - 确认资金是否足以覆盖预计停留期间的开支

## 四、风险评估

6. **综合评估潜在风险**
   参考[业务规定 9]，旅客持旅游签证入境但无法说明详细行程时，应警惕非法就业风险。需要综合评估：
   - 超范围停留风险
   - 非法就业风险
   - 滞留不归风险
   - 其他违规风险

如发现明显异常，应按规定上报并采取相应措施。

---
**说明**：本回答引用了业务规定 1、2、5、7、9 共5条参考文献。`;

const DEFAULT_THINKING =
`<think>让我来分析这个问题...

首先，我需要理解问题的核心：一名旅客持申根旅游签证准备入境，声称要去看表哥，但无法提供具体地址，也没有详细行程。

步骤分解：
├─ 第一步：核对签证类型与申报目的是否一致
│   ├─ 旅游签证是否允许访问亲友？
│   ├─ 访问亲友需要哪些证明材料？
│   └─ 无法提供地址是否构成风险？
│
├─ 第二步：检索 90/180 最新政策
│   ├─ 申根签证的停留规则是什么？
│   ├─ 如何计算累计停留天数？
│   └─ 是否需要提醒旅客注意停留期限？
│
├─ 第三步：评估资金证明
│   ├─ 旅客是否提供了足够的资金证明？
│   ├─ 资金是否与行程安排匹配？
│   └─ 是否需要触发二次询问流程？
│
└─ 第四步：综合风险评估
    ├─ 是否存在超范围停留风险？
    ├─ 是否存在非法就业风险？
    └─ 是否需要上报或采取措施？

基于以上分析，我将给出详细的核查建议...</think>`;

const DEFAULT_SUB_QUESTIONS: SubQuestionsData = {
  sub_questions: [
    '旅游签证与访问亲友的目的是否匹配？',
    '如何核查申根签证的90/180停留原则？',
    '资金证明不足时应采取什么措施？'
  ],
  count: 3,
  sub_answers: [
    {
      sub_question: '旅游签证与访问亲友的目的是否匹配？',
      answer: '旅游签证通常允许访问亲友，但需要旅客提供具体的联系方式、地址或邀请函。如果旅客无法提供这些信息，可能存在目的不符或超范围停留的风险，需要进一步核查。'
    },
    {
      sub_question: '如何核查申根签证的90/180停留原则？',
      answer: '申根签证遵循90/180原则，即在任意180天内累计停留不超过90天。核查时需检查护照上的既往入境章，计算累计停留天数，确保没有超过限制。可以使用申根计算器辅助核算。'
    },
    {
      sub_question: '资金证明不足时应采取什么措施？',
      answer: '当旅客的资金证明与行程安排明显不匹配时，应参考《资金不足核查流程》，包括：1) 进行二次询问，了解详细的资金来源；2) 要求提供银行流水或其他财务证明；3) 评估是否存在非法就业或滞留风险。'
    }
  ]
};

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

export const getMockSubQuestions = (): SubQuestionsData => JSON.parse(JSON.stringify(DEFAULT_SUB_QUESTIONS));

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
