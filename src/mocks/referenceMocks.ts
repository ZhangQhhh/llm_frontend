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

const LONG_REFERENCE_CONTENTS: Record<string, string> = {
  '1': `对持旅游签证入境的旅客，查验重点不能只停留在“口头说法一致”这一层，而要把停留目的、停留时长、资金来源、住宿安排、回程计划放在同一张核验清单里交叉比对。旅客如果声称是短期旅游或探亲访友，应当能够说清楚首站城市、预定住宿、联系人基本信息、回程时间以及大致行程安排；如果这些信息表达含糊，或者与签证类型、随身材料明显不匹配，就需要提高警惕。

在实际处置中，还应关注材料之间是否互相印证。例如，机票时间是否与口述停留周期相符，住宿订单是否覆盖其计划停留区间，银行卡流水或现金携带数额是否足以支撑日常开销，联系人电话是否真实可核。对于“来看朋友但不知道住址”“旅游但说不清去哪些城市”这类表述，通常要补充询问具体访问目的，并记录其前后回答是否一致。

如果发现其旅行目的存在明显变化、补充材料迟迟无法提供，或者资金证明与出行计划严重不匹配，应考虑启动进一步审查程序，必要时要求补充财力证明、邀请关系说明或回程约束性材料。`,
  '2': `风险排查指引强调，旅客自称探访亲友时，至少应能提供受访对象的姓名、联系方式、所在城市、与本人关系、联系频率以及本次停留安排。若旅客无法说明基本地址，或者只会模糊描述“朋友会来接”“到时再联系”，通常说明其真实行程尚未确定，或者存在隐瞒停留目的的可能。

对于此类情况，执勤人员应围绕“关系真实性”和“停留合理性”两个维度继续核验。一方面，要核对双方是否存在稳定联系记录、邀请沟通记录或共同活动证明；另一方面，要评估其停留天数、住宿计划、日常消费能力与口头陈述是否相符。若旅客仅持短期签证却无法说明回程、住宿、资金和联系人信息，风险等级应适当上调。

同时，记录中应保留关键问答节点，包括首次陈述、补充问询内容、态度变化以及材料补交情况，以便后续复核时判断其是否存在超范围停留、非法就业或虚假陈述风险。`,
  '3': `申根短期签证通常适用 90/180 原则，即在任意连续 180 天内累计停留不得超过 90 天。核验时不能只看当前签证是否仍在有效期内，还要结合旅客既往出入境记录，计算其在回溯 180 天窗口中的累计停留天数，避免出现“签证未过期但停留额度已耗尽”的误判。

实务中应优先核对护照出入境验讫章、电子出入境记录以及旅客自述行程之间是否一致。若存在多次短停、多国流转或边境章不清晰的情况，应按照最保守原则进行辅助核算，并要求旅客对关键日期作出明确说明。对经常往返、停留节奏密集的人员，尤其要防止出现累计超限而本人并未充分意识到的情况。

如发现其计划入境后的预估停留时间将触发或接近上限，应及时提示相关限制，并将核算结果写入查验记录，作为是否允许入境、是否缩短停留期限的重要依据。`,
  '4': `国际航班口岸查验手册指出，当旅客提供的资金证明、订票记录、住宿安排与其申报行程明显不相符时，应将该情形视为重点复核触发条件。所谓“不相符”，既包括总金额明显不足，也包括资金来源不清、临时转入痕迹明显、账单与本人身份缺少关联等情形。

处理这类情形时，通常需要开展二次问询：先确认计划停留几天、每日预估支出、住宿方式和回程安排，再将这些信息与银行卡流水、现金、信用卡额度、酒店预订等材料逐项比对。如果旅客称要停留两周，却仅能出示极少现金且没有可验证支付能力，或声称住酒店但没有任何预订信息，就需要进一步判断其是否存在虚构行程或转向其他非法目的的可能。

此外，审查过程要完整记录，以便后续复盘时能够说明为何认定其资金保障不足，以及是否已经给予补充说明机会。`,
  '5': `对持短期签证入境的旅客，标准作业流程要求同步检查回程机票、住宿预订、旅行保险以及与停留目的相匹配的支持性材料。任何一个环节缺失都不必然直接等于高风险，但若多个环节同时模糊，就会显著削弱其行程可信度。

例如，旅客若称进行短期观光，应能说明抵达城市、主要停留地点、返程日期以及资金准备；若称访问亲友，则除基本联系方式外，还应说明由谁承担住宿、双方关系如何建立、预计共同活动内容等。系统判断时要避免机械地只看单一材料，而是评估“材料链是否闭合”。

当回程机票未订、住宿未明确、资金又不足以支撑临时安排时，通常说明旅客对本次行程缺乏可验证规划，应进一步追问其真实入境目的，并将关键核验点完整留档。`,
  '6': `业务规范汇编强调，签证类型与入境目的不一致，是查验中最典型也最容易被忽视的风险信号之一。旅客可能持旅游签证却准备从事商务活动、短期劳务或长期探亲，也可能在口头陈述中不断调整自己的说法，试图回避真实计划。

现场问询时，应先固定其首次陈述，再围绕“为什么来、住哪里、待多久、和谁接触、何时离开”展开补充核验。如果旅客对核心问题反复更改答案，或者给出的联系人、工作安排、住宿方式与签证用途明显不符，应结合其既往记录和随身物品作综合研判。

规范还要求，对此类异常情况应详细记录问询过程、证件信息、补充材料情况及最终判断理由。必要时可依法采取拒绝入境、缩短停留期限或转入进一步审查等措施。`,
  '7': `申根签证管理规定要求成员国统一执行短期停留额度规则。持有效申根短期签证虽然可以在申根区内流动，但并不意味着可以无限期或频繁滚动停留；判断标准始终是任意 180 天窗口内的累计停留时间。

在边检场景中，对频繁往返旅客尤其要关注“碎片化停留”问题。旅客往往认为自己每次都只待几天就不会超限，但多次入出境叠加后，仍可能在某个 180 天窗口中突破上限。因而，单看最近一次出境日期并不充分，必须结合完整区间重新计算。

若旅客对停留规则理解错误，且后续计划停留天数已经接近上限，应在处置时同步说明规则依据，并将测算过程和提醒情况纳入执法记录，降低后续争议风险。`,
  '8': `资金证明审核指引要求，旅客提交的财力材料应同时满足“真实性、可支配性、与行程匹配性”三项要求。并不是只要账户余额存在就足够，还要看资金是否为本人可实际调配、是否存在临时大额转入、是否能覆盖停留期间的交通、住宿、餐饮及应急支出。

对于计划短期停留的人员，可重点比对其行程天数、住宿标准、目的地消费水平与可支配金额之间是否合理。如果旅客仅能提供截图、他人账户信息，或余额虽高但没有稳定流水支撑，就不能简单认定其财力真实可靠。必要时应要求补充银行流水、信用卡额度证明、现金来源说明或资助关系材料。

审核过程中，还应关注旅客是否过度依赖“朋友到时付款”“现场再解决住宿”等模糊表述。这类说法通常会削弱其行程可验证性，需结合其他风险信号一并判断。`,
  '9': `非法就业风险识别手册指出，持旅游或短期访问签证入境却携带与工作密切相关的工具、样品、合同资料，或者对目的地工作场所、联系人安排描述清晰，却对旅游景点、住宿计划含糊其辞，往往是高风险信号。此类旅客有时会以“看朋友”“临时转机”作掩饰，但材料细节经不起交叉核验。

在问询中，应重点关注其职业背景、过往出入境频率、是否存在短期高频往返、是否有固定接应人员、是否能说明停留期间的日常安排。如果其资金准备不足、回程安排不明、联系人信息模糊，却又表现出对某一工作地点或业务事项异常熟悉，就需要警惕其真实目的是短期务工或从事未申报活动。

对可疑情形应结合随身物品、电子订单、聊天记录截图等辅助材料综合研判，并在执法记录中明确列出触发风险判断的具体事实。`,
  '10': `执法记录规范要求，对旅客开展问询、复核材料、作出处置判断的全过程应做到“可还原、可解释、可追溯”。记录不应只写最终结论，而应当覆盖首次陈述、补充问答、发现疑点、核验材料、风险研判及最终处置意见等关键节点。

尤其是对签证用途不符、资金不足、联系人信息缺失、停留计划不清等情形，如果现场没有形成完整记录，后续复盘时很难说明判断依据是否充分。规范建议将关键原话、重要时间点、材料名称及编号、补充说明机会是否给予等内容一并写明。

当最终结论涉及拒绝入境、限制停留或移交进一步审查时，更应保证记录结构清晰、逻辑闭环，以确保后续执法复核、申诉处理和经验总结均有据可查。`
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

export const getMockReferences = (): ReferenceSource[] =>
  BASE_REFERENCES.map((reference) =>
    cloneReference({
      ...reference,
      content: LONG_REFERENCE_CONTENTS[String(reference.id)] || reference.content
    })
  );

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

  // 兼容全局 mock 开关
  if (process.env.VUE_APP_ENABLE_MOCK === 'true') {
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

    // 兼容全局 mock 本地开关
    if (window.localStorage?.getItem('ENABLE_MOCK_DATA') === 'true') {
      cachedToggle = true;
      return true;
    }
  } catch {
    // 忽略 localStorage 访问异常
  }

  const params = new URLSearchParams(window.location.search);
  // 兼容 ?mock=1 与 ?mockReferences=1
  cachedToggle = params.get('mockReferences') === '1' || params.get('mock') === '1';
  return cachedToggle;
};
