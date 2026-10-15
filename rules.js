(function () {
  'use strict';

  const D = window.DIAG_DATA;
  const get = (answers, id) => answers[id];
  const list = value => Array.isArray(value) ? value : [];
  const knownValue = value => value !== undefined && value !== null && value !== '';
  const mean = values => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;

  const issueLibrary = [
    {
      id: 'P1', dimensionId: 'd1', title: '重点学生群体精细化培养', shortTitle: '分层培养',
      mechanismIds: ['Q02','Q03','Q04','Q05','Q27'],
      signal(answers) {
        const v = get(answers, 'Q01');
        if (['A','B','D'].includes(v)) return { state: 'present', text: v === 'A' ? '学校将本科临界生列为优先改善群体' : v === 'B' ? '学校关注长期提升缓慢的中等生群体' : '学校反馈多类学生均需重点关注' };
        if (v === 'C') return { state: 'limited', text: '当前主要关注高分段及拔尖潜质学生，其他分层需求需结合数据核实' };
        return { state: 'unknown', text: '学校尚未明确最需要优先改善的学生群体' };
      },
      impact: '若重点学生群体的识别、归因与跟踪不连贯，教学资源可能难以准确投向主要制约环节，措施成效也不易验证。',
      verify: ['最近两次考试的学生分层名单及进退变化','目标学生的薄弱学科与具体知识环节','现有辅导措施、参与记录及阶段效果'],
      firstAction: '选取最近两次考试，按学生群体整理成绩变化与薄弱学科分布，形成一页专项学情分析表。',
      later: '在明确目标群体后，为每类学生建立差异化措施、责任教师和复盘节点，避免仅按一次考试结果固定分层。',
      plans: [
        ['教务处会同年级组确定一个优先研究的学生群体，并统一识别口径。','教务主任、年级主任','目标学生群体定义及初步名单'],
        ['整理最近两次考试的群体成绩分布、进退变化及薄弱学科。','年级组、备课组','专项学情分析表'],
        ['抽取典型学生开展教师会商，形成分层辅导措施和跟踪指标。','年级主任、班主任、任课教师','差异化辅导清单'],
        ['复核措施责任人、执行频次和下一次检查节点。','教学副校长、教务处','30—60天跟踪安排']
      ]
    },
    {
      id: 'P2', dimensionId: 'd2', title: '外语学习学情分析与路径评估', shortTitle: '外语路径',
      mechanismIds: ['Q07','Q08','Q09','Q10','Q22','Q27'],
      signal(answers) {
        const v = get(answers, 'Q06');
        if (v === 'A') return { state: 'present', text: '连续考试数据提示存在其他学科相对较好、外语持续偏弱的学生群体' };
        if (v === 'B') return { state: 'present', text: '学校已观察到外语持续偏弱的学生群体，但尚未系统统计' };
        if (v === 'C') return { state: 'absent', text: '目前未发现明显的外语持续偏弱群体' };
        return { state: 'unknown', text: '是否存在外语持续偏弱群体尚不清楚' };
      },
      impact: '若未区分基础、方法、投入等不同原因，专项辅导或学习路径调整可能缺少依据，也难以判断现有支持是否有效。',
      verify: ['最近两次考试外语成绩分布及稳定偏弱学生名单','相关学生其他学科表现和外语困难原因','现有外语辅导的参与记录与前后变化','本省政策、高校专业语种限制及校内师资条件'],
      firstAction: '由年级组与外语教研组对目标学生开展一次专项学情分析，先核实困难原因和现有辅导效果。',
      later: '优先改进现有教学与辅导措施；只有在政策、学生意愿、师资和专业限制均核实后，才研究其他适用路径，不直接作语种调整结论。',
      plans: [
        ['从连续两次考试中筛选外语持续偏弱且其他学科相对稳定的学生样本。','年级组、外语教研组','目标学生样本及筛选口径'],
        ['通过试卷分析、教师会商和学生访谈区分主要困难原因。','外语教研组、班主任','外语困难原因分类表'],
        ['核对现有辅导方式、参与情况与阶段变化，提出一项小范围调整。','外语教研组','辅导措施复盘及调整方案'],
        ['如需研究其他学习路径，补充核验政策、专业限制、学生意愿和师资条件。','教务处、升学指导教师','路径评估核验清单']
      ]
    },
    {
      id: 'P3', dimensionId: 'd3', title: '基础学科拔尖学生持续培养', shortTitle: '拔尖培养',
      mechanismIds: ['Q12','Q13','Q14','Q15','Q23'],
      signal(answers) {
        const v = get(answers, 'Q11');
        if (v === 'A') return { state: 'present', text: '学校已有比较明确的基础学科优秀且有持续兴趣的学生群体' };
        if (v === 'B') return { state: 'present', text: '学校判断可能存在拔尖潜质学生，但尚未系统识别' };
        if (v === 'C') return { state: 'absent', text: '当前尚未发现明确的拔尖学生群体' };
        return { state: 'unknown', text: '拔尖潜质学生群体情况尚不清楚' };
      },
      impact: '若识别标准、跨年级培养和资源支持脱节，学生的学科兴趣与发展潜力可能难以得到连续观察和适切支持。',
      verify: ['近一学年基础学科表现及稳定性','学生持续学习兴趣和教师观察记录','现有拓展课程、导师与时间资源','不同年级培养安排及阶段评估记录'],
      firstAction: '梳理基础学科表现突出且具有持续学习兴趣的学生，形成初步培养需求与校内资源条件清单。',
      later: '先建立校内识别、培养与复盘机制，再结合真实招生政策判断个别学生的适用路径，不预设特定高校项目结论。',
      plans: [
        ['由学科组提出“学科表现＋持续兴趣＋发展潜力”的初步识别口径。','教务处、基础学科教研组','拔尖潜质学生识别口径'],
        ['梳理候选学生及其学习需求，避免仅按单次成绩筛选。','年级组、学科教师','候选学生观察清单'],
        ['盘点校内教师、课程、时间和学习资源，匹配小范围支持方案。','教学副校长、教务处','资源条件与支持方案清单'],
        ['确定学生反馈、阶段表现和兴趣变化的复盘节点。','年级主任、指导教师','培养跟踪记录模板']
      ]
    },
    {
      id: 'P4', dimensionId: 'd4', title: '升学指导与政策应用机制', shortTitle: '升学指导',
      mechanismIds: ['Q17','Q18','Q19','Q20'],
      signal(answers) {
        const values = list(get(answers, 'Q16'));
        if (values.includes('unclear') || !values.length) return { state: 'unknown', text: '学校尚未形成明确的升学路径关注重点' };
        if (values.length >= 3) return { state: 'present', text: '学校同时关注多类升学路径，对政策整理与适配指导提出更高要求' };
        return { state: 'present', text: '学校已明确关注的升学路径，需要持续核验政策和学生适配条件' };
      },
      impact: '若政策更新、条件核查和个别化指导缺少稳定分工，学生可能错过关键节点，或在选科、语种和专业限制上出现信息偏差。',
      verify: ['本省当年招生政策与权威发布渠道','学校关注路径的条件、时间节点和材料要求','学生目标专业的选科与语种限制','升学指导分工和服务记录'],
      firstAction: '建立一份由专人维护的升学政策台账，标明信息来源、适用对象、关键节点和最近核验日期。',
      later: '将政策台账与学生成绩、兴趣和发展方向结合，形成分层分类的指导清单；具体认定以当年权威政策为准。',
      plans: [
        ['确定权威政策信息来源和校内维护责任人。','教务处、升学指导负责人','政策信息源与责任分工表'],
        ['梳理当前重点路径的条件、节点、材料和限制。','升学指导教师','升学政策台账'],
        ['抽查目标学生的选科、语种及目标专业限制匹配情况。','年级组、升学指导教师','学生适配核查清单'],
        ['形成政策更新频率、提醒方式和答疑记录要求。','教务主任','升学指导工作规范初稿']
      ]
    },
    {
      id: 'P5', dimensionId: 'd5', title: '师资资源与教学支持配置', shortTitle: '资源支持',
      mechanismIds: ['Q22','Q23','Q24','Q25'],
      signal(answers) {
        const values = list(get(answers, 'Q21'));
        const constraints = values.filter(v => !['none','unknown'].includes(v));
        if (constraints.length) return { state: 'present', text: `学校反馈存在${constraints.length}类主要资源制约` };
        if (values.includes('none')) return { state: 'absent', text: '学校暂未发现明显资源制约' };
        return { state: 'unknown', text: '当前资源制约情况尚不清楚' };
      },
      impact: '资源约束与管理机制缺口需要区分处理。若未盘点可用师资、课程和时间，差异化培养方案可能难以稳定执行。',
      verify: ['相关学科教师数量、专长与可投入时段','现有课程资源及复用可能性','年级教学时间和跨部门协同难点','学生意愿、家校沟通和反馈记录'],
      firstAction: '围绕已识别的培养需求，完成一次师资、课程、时间与协同条件盘点，区分“资源不足”和“配置方式待优化”。',
      later: '优先通过校内课程统筹、教师协作和小范围试行优化配置；确需新增资源时，再依据明确需求审慎决策。',
      plans: [
        ['将已反馈的资源制约按师资、课程、时间和协同四类复核。','教学副校长、教务处','资源制约核实清单'],
        ['盘点可用教师专长、课程材料、场地与可安排时段。','教务处、教研组','校内资源台账'],
        ['选择一项优先需求，设计不依赖新增采购的小范围支持方案。','教务主任、年级主任','资源配置试行方案'],
        ['同步明确学生意愿了解、家校沟通和反馈节点。','年级组、班主任','沟通与反馈安排']
      ]
    },
    {
      id: 'P6', dimensionId: 'd6', title: '数据分析与改进闭环', shortTitle: '数据改进',
      mechanismIds: ['Q27','Q28','Q29','Q30'],
      signal(answers) {
        const values = list(get(answers, 'Q26'));
        if (values.includes('unclear') || !values.length) return { state: 'unknown', text: '学校尚未明确最需要重新评估效果的教学措施' };
        return { state: 'present', text: `学校希望重新评估${values.length}类教学改进措施的实施效果` };
      },
      impact: '若分析停留在平均分或单次结果，且缺少责任人和复盘节点，学校将难以判断变化来自措施本身还是其他因素。',
      verify: ['不同学生群体的成绩分布与变化趋势','重点措施实施前后的可比数据','措施执行记录及可能的其他影响因素','责任人、检查节点与师生反馈'],
      firstAction: '选择一项正在实施的重点措施，补齐目标群体、基线数据、执行记录、责任人和下一次检查节点。',
      later: '逐步形成“问题识别—措施实施—数据复核—反馈调整”的短周期闭环，避免用单一指标作因果判断。',
      plans: [
        ['选择一项最需要复盘的教学措施，并明确目标学生群体。','教学副校长、教务处','措施复盘任务单'],
        ['整理措施前后的群体分布数据、执行记录和其他影响因素。','年级组、数据分析教师','效果评估基础数据表'],
        ['组织一次基于证据的复盘会，区分已知结果与待核实解释。','教务处、相关教研组','措施复盘纪要'],
        ['确定调整动作、责任人、执行周期和下一检查节点。','教学副校长','改进闭环跟踪表']
      ]
    }
  ];

  function calculateDimensions(answers) {
    return D.dimensions.map(dimension => {
      const ids = dimension.questions.filter(q => q.mechanism).map(q => q.id);
      const scores = ids.map(id => D.mechanismScore[get(answers, id)]).filter(value => value !== null && value !== undefined);
      const known = scores.length;
      return {
        id: dimension.id, name: dimension.name, shortName: dimension.shortName,
        index: known >= 3 ? mean(scores) : null,
        provisionalIndex: scores.length ? mean(scores) : null,
        known, unknown: 4 - known, completeness: known * 25,
        judgment: known < 3 ? '信息不足' : mean(scores) >= 75 ? '已有一定基础' : mean(scores) >= 50 ? '建议持续优化' : '优先核实'
      };
    });
  }

  function mechanismSnapshot(answers, ids) {
    const values = ids.map(id => ({ id, answer: get(answers, id), score: D.mechanismScore[get(answers, id)] }))
      .filter(item => item.score !== null && item.score !== undefined);
    const avg = mean(values.map(item => item.score));
    return {
      valid: values.length, total: ids.length, completeness: Math.round(values.length / ids.length * 100), avg,
      gaps: values.filter(item => item.answer === 'C').map(item => item.id),
      developing: values.filter(item => item.answer === 'B').map(item => item.id),
      established: values.filter(item => item.answer === 'A').map(item => item.id)
    };
  }

  function evaluateIssue(config, answers) {
    const signal = config.signal(answers);
    const mechanism = mechanismSnapshot(answers, config.mechanismIds);
    let status;
    if (mechanism.completeness < 60 || (signal.state === 'unknown' && mechanism.completeness < 80)) status = 'insufficient';
    else if (signal.state === 'present' && mechanism.avg < 60) status = 'priority';
    else if (signal.state === 'present' && mechanism.avg < 80) status = 'optimize';
    else if (mechanism.avg < 50) status = 'optimize';
    else if (signal.state === 'unknown') status = 'insufficient';
    else if (mechanism.avg >= 75) status = 'foundation';
    else status = 'optimize';

    const rank = { priority: 400, optimize: 300, insufficient: 220, foundation: 100 }[status]
      + (signal.state === 'present' ? 30 : 0) + mechanism.gaps.length * 4 + mechanism.developing.length;
    const label = { priority: '优先核实', optimize: '建议持续优化', foundation: '已有一定基础', insufficient: '信息不足' }[status];
    const finding = status === 'insufficient'
      ? `${signal.text}；相关机制题的有效信息尚不足，暂不形成明确成熟度判断。`
      : status === 'priority'
        ? `${signal.text}，但与之相关的识别、实施或跟踪机制仍有明显待完善环节。`
        : status === 'optimize'
          ? `${signal.text}；学校已开展部分工作，建议进一步稳定流程并验证措施效果。`
          : `${signal.text}；相关机制已呈现一定基础，下一步重点是检验执行质量和持续改进。`;
    const evidence = [signal.text];
    if (mechanism.gaps.length) evidence.push(`${mechanism.gaps.length}项相关机制反馈为“暂未系统开展”`);
    if (mechanism.developing.length) evidence.push(`${mechanism.developing.length}项相关工作已开展但尚未稳定`);
    if (mechanism.established.length) evidence.push(`${mechanism.established.length}项相关机制已有记录或数据支持`);
    if (mechanism.total - mechanism.valid > 0) evidence.push(`${mechanism.total - mechanism.valid}项相关信息回答为“不清楚”`);
    return { ...config, signal, mechanism, status, label, rank, finding, evidence };
  }

  function selectFocus(evaluations) {
    const sorted = [...evaluations].sort((a, b) => b.rank - a.rank);
    const urgent = sorted.filter(item => item.status === 'priority');
    if (urgent.length >= 2) return urgent.slice(0, 3);
    if (urgent.length === 1) return [urgent[0], ...sorted.filter(item => item.id !== urgent[0].id && item.status !== 'foundation').slice(0, 2)].slice(0, 3);
    const actionable = sorted.filter(item => ['optimize','insufficient'].includes(item.status));
    if (actionable.length) return actionable.slice(0, Math.min(3, Math.max(2, actionable.length)));
    return sorted.slice(0, 2);
  }

  function makeSummary(dimensions) {
    const strong = dimensions.filter(d => d.index !== null && d.index >= 75).map(d => d.name);
    const study = dimensions.filter(d => d.index !== null && d.index < 50).map(d => d.name);
    const insufficient = dimensions.filter(d => d.index === null).map(d => d.name);
    return {
      strongText: strong.length ? `相对完善的方面：${strong.join('、')}呈现出较稳定的机制基础。` : '相对完善的方面：本次回答尚未呈现出指数达到较高区间且信息充分的维度，建议结合实际记录进一步核实。',
      studyText: study.length ? `值得进一步研究的方面：${study.join('、')}的机制建设自评指数相对较低，应先核实具体环节和执行记录。` : '值得进一步研究的方面：未发现信息充分且机制指数明显偏低的维度，可继续关注措施实施效果与迭代质量。',
      limitationText: insufficient.length ? `数据局限：${insufficient.join('、')}有效回答不足3项，暂不形成明确判断。` : '数据局限：所有维度均达到形成初步判断所需的信息量，但结论仍基于填写者自评，尚未经过外部核验。'
    };
  }

  function makePlan(focus) {
    const selected = focus.length ? focus : issueLibrary.slice(0, 1);
    return [0,1,2,3].map((weekIndex) => {
      const issue = selected[weekIndex % selected.length];
      const plan = issue.plans[weekIndex];
      return { time: `第${weekIndex + 1}周`, focus: issue.shortTitle, action: plan[0], owner: plan[1], output: plan[2] };
    });
  }

  function analyze(answers) {
    const dimensions = calculateDimensions(answers);
    const issues = issueLibrary.map(config => evaluateIssue(config, answers));
    const focus = selectFocus(issues);
    const summary = makeSummary(dimensions);
    const priorityCount = issues.filter(i => i.status === 'priority').length;
    const insufficientCount = dimensions.filter(d => d.index === null).length;
    const conclusion = insufficientCount >= 3
      ? '本次自评中较多维度的信息尚不充分，现阶段最重要的不是判断机制优劣，而是补齐关键数据、执行记录和责任分工信息，再开展校内研讨。'
      : priorityCount
        ? `本次自评识别出${priorityCount}个需要优先核实的方向。建议从最小范围的数据复核和流程梳理开始，先验证问题、再调整措施，避免把自评结果直接等同于学校质量评价。`
        : '学校相关机制总体呈现一定基础，未识别出必须强行定义为严重问题的方向。建议把工作重点放在措施效果验证、信息更新和持续改进上。';
    return { dimensions, issues, focus, summary, plan: makePlan(focus), conclusion };
  }

  window.DIAG_RULES = { analyze, calculateDimensions, issueLibrary };
})();
