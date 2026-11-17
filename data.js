// 內容資料：單字種子、閱讀題、錯誤類型、路線圖
// 文章與題目皆為原創練習題（仿多益 Part 7 / 雅思 Academic Reading 題型）

window.SEED_WORDS = [
  // 我的錯題：從自己的練習本整理出來的字
  { en: 'contaminated', pos: 'adj.', zh: '被汙染的', ex: 'The river was contaminated by waste from the factory.', tag: '我的錯題' },
  { en: 'strict', pos: 'adj.', zh: '嚴格的', ex: 'The company has strict rules about data security.', tag: '我的錯題' },
  { en: 'weird', pos: 'adj.', zh: '奇怪的', ex: 'The printer is making a weird noise again.', tag: '我的錯題' },
  { en: 'take ... for granted', pos: 'phr.', zh: '視……為理所當然', ex: 'We often take clean water for granted.', tag: '我的錯題' },
  { en: 'regard A as B', pos: 'phr.', zh: '把 A 視為 B（注意：regard 後接 as）', ex: 'She is regarded as the best designer on the team.', tag: '我的錯題' },
  { en: 'look upon A as B', pos: 'phr.', zh: '把 A 看作 B（接 as）', ex: 'Many people look upon reading as a waste of time.', tag: '我的錯題' },
  { en: 'consider A (to be) B', pos: 'phr.', zh: '認為 A 是 B（不接 as）', ex: 'He is considered (to be) an expert.', tag: '我的錯題' },
  { en: 'prior to', pos: 'prep.', zh: '在……之前（= earlier than）', ex: 'Please arrive ten minutes prior to the interview.', tag: '我的錯題' },
  { en: 'upon + V-ing', pos: 'phr.', zh: '一……就……', ex: 'Upon arriving at the hotel, please show your ID.', tag: '我的錯題' },
  { en: 'besides', pos: 'prep.', zh: '除了……之外（還有）', ex: 'Besides English, she also speaks Japanese.', tag: '我的錯題' },

  // 多益核心
  { en: 'relocate', pos: 'v.', zh: '搬遷；調職', ex: 'The office will relocate to the Riverside Building.', tag: '多益' },
  { en: 'facilities', pos: 'n.', zh: '設施；設備', ex: 'The hotel facilities include a gym and a pool.', tag: '多益' },
  { en: 'extension', pos: 'n.', zh: '（電話）分機；延期', ex: 'Please call me at extension 214.', tag: '多益' },
  { en: 'invoice', pos: 'n.', zh: '發票；請款單', ex: 'The invoice must be paid within 30 days.', tag: '多益' },
  { en: 'reimburse', pos: 'v.', zh: '核銷；退還（費用）', ex: 'The company will reimburse your travel costs.', tag: '多益' },
  { en: 'itinerary', pos: 'n.', zh: '行程表', ex: 'I have sent you the itinerary for the business trip.', tag: '多益' },
  { en: 'applicant', pos: 'n.', zh: '申請人；應徵者', ex: 'Each applicant must submit a résumé.', tag: '多益' },
  { en: 'inventory', pos: 'n.', zh: '庫存；存貨清單', ex: 'We check the inventory every Friday.', tag: '多益' },
  { en: 'postpone', pos: 'v.', zh: '延後', ex: 'The meeting has been postponed until Monday.', tag: '多益' },
  { en: 'agenda', pos: 'n.', zh: '議程', ex: 'The first item on the agenda is the budget.', tag: '多益' },
  { en: 'shipment', pos: 'n.', zh: '貨運；一批貨', ex: 'The shipment is expected to arrive tomorrow.', tag: '多益' },
  { en: 'warranty', pos: 'n.', zh: '保固', ex: 'The laptop comes with a two-year warranty.', tag: '多益' },
  { en: 'complimentary', pos: 'adj.', zh: '免費贈送的', ex: 'Guests receive a complimentary breakfast.', tag: '多益' },
  { en: 'mandatory', pos: 'adj.', zh: '強制的；必須的', ex: 'Attendance at the training is mandatory.', tag: '多益' },

  // 雅思學術
  { en: 'decline', pos: 'v./n.', zh: '下降；減少', ex: 'The number of wild bees has declined sharply.', tag: '雅思' },
  { en: 'density', pos: 'n.', zh: '密度', ex: 'Cities should limit the density of hives.', tag: '雅思' },
  { en: 'abandon', pos: 'v.', zh: '放棄；拋棄', ex: 'Few researchers recommend abandoning handwriting.', tag: '雅思' },
  { en: 'beneficial', pos: 'adj.', zh: '有益的', ex: 'Regular exercise is beneficial to mental health.', tag: '雅思' },
  { en: 'monitor', pos: 'v.', zh: '監測；監控', ex: 'Scientists monitor the colonies every week.', tag: '雅思' },
  { en: 'concept', pos: 'n.', zh: '概念', ex: 'The test checks whether students understand the concept.', tag: '雅思' },
  { en: 'conclude', pos: 'v.', zh: '下結論；推斷', ex: 'The researchers concluded that sleep improves memory.', tag: '雅思' },
  { en: 'significant', pos: 'adj.', zh: '顯著的；重要的', ex: 'There was a significant rise in prices.', tag: '雅思' },
  { en: 'alternative', pos: 'n./adj.', zh: '替代方案；替代的', ex: 'Solar power is an alternative to coal.', tag: '雅思' },
  { en: 'consequence', pos: 'n.', zh: '後果', ex: 'Climate change has serious consequences for farming.', tag: '雅思' },
  { en: 'evidence', pos: 'n.', zh: '證據', ex: 'There is little evidence that the method works.', tag: '雅思' },
  { en: 'contribute to', pos: 'phr.', zh: '促成；導致', ex: 'Stress can contribute to poor sleep.', tag: '雅思' },
  { en: 'native', pos: 'adj.', zh: '本地原生的', ex: 'Plant native flowers to support local insects.', tag: '雅思' },
  { en: 'phenomenon', pos: 'n.', zh: '現象', ex: 'Urban beekeeping is a recent phenomenon.', tag: '雅思' },
];

// 句子以 [段][句] 編號，evidence 用 "段-句" 指出答案出處
window.PASSAGES = [
  {
    id: 'toeic-1', exam: '多益', part: 'Part 7 單篇閱讀', title: 'Office Relocation Notice', minutes: 6,
    header: 'To: All staff, Harlow Design　From: Facilities Team　Subject: Move to the Riverside Building',
    paras: [
      [
        'As announced last month, Harlow Design will move to the Riverside Building on Monday, March 9.',
        'The new office is located on the fourth floor and offers more meeting rooms than our current space.',
        'To prepare for the move, all employees are asked to pack their personal items in the boxes provided by Thursday, March 5.',
        'Boxes should be labeled with your name and department.',
        'Computers and other equipment will be handled by the moving company, so please do not pack them yourself.',
      ],
      [
        'Please note that the office will be closed on Friday, March 6, while the movers complete their work.',
        'Employees who need to work that day may do so from home.',
        'Parking at the Riverside Building is limited, so we encourage staff to use public transportation; the building is a five-minute walk from Central Station.',
        'If you have any questions, please contact Mia Chen at extension 214.',
      ],
    ],
    questions: [
      { type: 'mc', q: 'What is the main purpose of the notice?', options: ['To announce a new employee', 'To give instructions about a move', 'To explain new parking fees', 'To invite staff to a meeting'], answer: 1, evidence: ['0-0', '0-2'], why: '主旨題：第一句說要搬家，後面全是搬家前要做的事。' },
      { type: 'mc', q: 'By when must employees pack their personal items?', options: ['March 5', 'March 6', 'March 9', 'March 4'], answer: 0, evidence: ['0-2'], why: '細節題：by Thursday, March 5。March 6 是辦公室關閉日，March 9 是搬家日，都是干擾選項。' },
      { type: 'mc', q: 'What are employees asked NOT to do?', options: ['Use public transportation', 'Label their boxes', 'Pack their own computers', 'Work from home'], answer: 2, evidence: ['0-4'], why: 'NOT 題：「設備由搬家公司處理，請勿自行打包」。看到 NOT 先把題目圈起來。' },
      { type: 'mc', q: 'What is suggested about the Riverside Building?', options: ['It has fewer meeting rooms', 'It is close to a train station', 'It has a large car park', 'It opens on a Friday'], answer: 1, evidence: ['1-2'], why: '同義改寫：a five-minute walk from Central Station ＝ close to a train station。Parking is limited 正好推翻 C。' },
    ],
  },
  {
    id: 'ielts-1', exam: '雅思', part: 'Academic Reading', title: 'The Rise of the Urban Beehive', minutes: 12,
    paras: [
      [
        'Over the past two decades, beekeeping has spread from the countryside into the centre of many large cities.',
        'In London, Paris and New York, hives can now be found on the roofs of hotels, office towers and even museums.',
        'Supporters argue that city bees enjoy a surprisingly varied diet, since parks, gardens and street trees flower at different times of the year.',
      ],
      [
        'However, some ecologists have begun to question whether the trend is as beneficial as it appears.',
        'Honeybees are managed insects, much like farm animals, and they compete with wild bees for the same limited supply of nectar and pollen.',
        'A 2019 study of Paris found that as the number of hives increased, the number of wild pollinators visiting nearby flowers declined.',
        'The researchers did not claim that honeybees were the only cause, but they recommended that cities limit the density of hives.',
      ],
      [
        'Another concern is disease.',
        'When many colonies are kept close together, viruses and parasites can pass more easily from one hive to another, and possibly to wild species as well.',
        'Experienced beekeepers therefore inspect their colonies regularly, although it is difficult to monitor the many hives kept by hobbyists.',
      ],
      [
        'None of this means that urban beekeeping should be abandoned.',
        'Instead, many experts now suggest that the best way to help pollinators is to plant a wider range of native flowers and to leave some areas of grass uncut.',
        'Such measures support honeybees and wild bees alike, and they cost far less than installing new hives.',
      ],
    ],
    questions: [
      { type: 'tfng', q: 'Beekeeping in cities has become more common in the last twenty years.', answer: 'TRUE', evidence: ['0-0'], why: '同義改寫：over the past two decades ＝ the last twenty years；spread into cities ＝ more common in cities。' },
      { type: 'tfng', q: 'Honey produced in cities is of higher quality than honey from the countryside.', answer: 'NOT GIVEN', evidence: ['0-2'], why: '陷阱：文中只說蜜蜂的食物「多樣」，完全沒比較蜂蜜品質。沒提到就是 NOT GIVEN，不要自己推論。' },
      { type: 'tfng', q: 'The Paris study proved that honeybees were the only reason for the decline in wild pollinators.', answer: 'FALSE', evidence: ['1-3'], why: '原文 did not claim that honeybees were the only cause，和題目「證明是唯一原因」直接矛盾，所以是 FALSE。' },
      { type: 'tfng', q: 'Hobbyist beekeepers are required by law to inspect their hives.', answer: 'NOT GIVEN', evidence: ['2-2'], why: '文中只說業餘者的蜂箱「難以監測」，沒有提到任何法律規定。' },
      { type: 'mc', q: 'According to the last paragraph, what do many experts now recommend?', options: ['Banning hives in city centres', 'Growing a wider variety of local plants', 'Moving hives back to the countryside', 'Cutting grass more often'], answer: 1, evidence: ['3-1'], why: 'native flowers ＝ local plants；a wider range ＝ a wider variety。D 剛好相反（leave grass uncut）。' },
      { type: 'mc', q: 'Which paragraph mentions the risk of illness spreading between colonies?', options: ['Paragraph A', 'Paragraph B', 'Paragraph C', 'Paragraph D'], answer: 2, evidence: ['2-0', '2-1'], why: 'disease、viruses and parasites ＝ illness。段落定位題先找關鍵字的同義詞。' },
    ],
  },
  {
    id: 'ielts-2', exam: '雅思', part: 'Academic Reading', title: 'Why Handwriting Still Matters', minutes: 10,
    paras: [
      [
        'Many schools have reduced the time spent teaching handwriting, arguing that pupils will mostly type in their adult lives.',
        'Yet a growing body of research suggests that writing by hand may offer benefits that typing does not.',
      ],
      [
        'In one well-known experiment, university students were asked to take notes during a lecture, either on laptops or with pen and paper.',
        "Those who typed recorded more words, often copying the lecturer's sentences almost exactly.",
        'Students who wrote by hand produced shorter notes, but they performed better on questions that required them to understand concepts rather than recall facts.',
        'The researchers concluded that because handwriting is slower, it forces learners to select and summarise information.',
      ],
      [
        'Brain-imaging studies have added to this picture.',
        'When children form letters by hand, areas linked to reading become more active than when they simply select letters on a keyboard.',
        'Some scientists believe this connection may help explain why young learners who practise handwriting tend to recognise letters more quickly.',
      ],
      [
        'Critics point out that many of these studies are small, and that the advantage may disappear once students learn to type more thoughtfully.',
        'Still, few researchers recommend abandoning handwriting altogether; most suggest that schools should combine both skills.',
      ],
    ],
    questions: [
      { type: 'tfng', q: 'Students who typed their notes wrote down more words.', answer: 'TRUE', evidence: ['1-1'], why: 'Those who typed recorded more words，幾乎原文照搬。' },
      { type: 'tfng', q: 'The researchers believed handwriting helps because it is faster than typing.', answer: 'FALSE', evidence: ['1-3'], why: '原文說 because handwriting is slower，和 faster 相反，所以是 FALSE。' },
      { type: 'tfng', q: 'The brain-imaging studies were carried out only on adults.', answer: 'FALSE', evidence: ['2-1'], why: '原文研究對象是 children，和 only on adults 矛盾。' },
      { type: 'tfng', q: 'Most schools around the world have stopped teaching handwriting.', answer: 'NOT GIVEN', evidence: ['0-0'], why: '原文是 many schools have reduced（減少時間），沒說「大多數」也沒說「停止」，也沒提全世界的資料。' },
      { type: 'mc', q: "What is the writer's overall conclusion?", options: ['Typing should replace handwriting', 'Handwriting should be the only skill taught', 'Schools should teach both skills', 'Further research is unnecessary'], answer: 2, evidence: ['3-1'], why: 'combine both skills ＝ teach both skills。作者結論通常在最後一段。' },
    ],
  },
];

window.ERROR_TYPES = ['單字不認識', '同義改寫沒看出', '定位失敗', 'FALSE / NOT GIVEN 混淆', '題目看錯', '時間不夠', '粗心'];

// 多益 440 → 雅思 6.5 的分段路線（約略對照，實際以模考成績調整）
window.ROADMAP = [
  { stage: '01', title: '打底：多益 550', goal: '文法基本詞類、時態、子句重新整理；核心單字 1,500', weeks: '第 1–8 週' },
  { stage: '02', title: '多益 650 ／ 雅思閱讀 5.0', goal: '每天 1 篇 Part 7；學會同義改寫與定位', weeks: '第 9–16 週' },
  { stage: '03', title: '雅思閱讀 5.5–6.0', goal: '每週 2 篇學術文章計時；TRUE / FALSE / NOT GIVEN 正確率 70%', weeks: '第 17–28 週' },
  { stage: '04', title: '雅思 6.5（第一個考試目標）', goal: '學術字彙 4,000+；整份閱讀 60 分鐘內完成，答對 27/40', weeks: '第 29–40 週' },
  { stage: '05', title: '多益 860 ／ 雅思 7.5', goal: '字彙 7,000+；閱讀答對 33/40；寫作能用複雜句又不出錯', weeks: '第 2 年上半' },
  { stage: '06', title: '多益 990 ／ 雅思 9.0（長期目標）', goal: '字彙 10,000+；Part 7 與學術文章零失分；口說與寫作接近母語者的準確度', weeks: '第 2–3 年' },
];

// 雅思學術閱讀 答對題數 → 分數（常用對照）
window.IELTS_BANDS = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 0]];
