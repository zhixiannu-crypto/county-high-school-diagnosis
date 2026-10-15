(function () {
  'use strict';

  const mechanismOptions = [
    { value: 'A', label: '已形成系统机制，并有实施记录或数据支持' },
    { value: 'B', label: '已开展相关工作，但尚未形成稳定机制' },
    { value: 'C', label: '暂未系统开展' },
    { value: 'D', label: '不清楚或缺乏相关信息' }
  ];

  const mechanism = (id, prompt) => ({ id, prompt, type: 'single', mechanism: true, options: mechanismOptions });
  const option = (value, label, exclusive) => ({ value, label, exclusive: Boolean(exclusive) });

  const dimensions = [
    {
      id: 'd1', name: '学情结构与分层培养', shortName: '分层培养',
      description: '考察学校能否识别不同学生群体的学情特点，并开展有针对性的培养和持续跟踪。',
      questions: [
        { id: 'Q01', prompt: '学校目前最希望优先改善哪类学生的升学表现？', type: 'single', mechanism: false,
          options: [option('A', '本科临界生'), option('B', '成绩中等、长期提升缓慢的学生'), option('C', '高分段及拔尖潜质学生'), option('D', '多类学生均需要重点关注'), option('E', '暂不明确')] },
        mechanism('Q02', '学校是否能够根据连续考试成绩，动态识别需要重点关注的学生群体？'),
        mechanism('Q03', '对成绩长期徘徊的学生，学校能否定位主要制约学科及具体薄弱环节？'),
        mechanism('Q04', '针对不同层次的学生，学校是否制定了差异化教学与辅导方案？'),
        mechanism('Q05', '学校是否持续跟踪重点学生群体的成绩变化，并据此调整培养措施？')
      ]
    },
    {
      id: 'd2', name: '外语学习与路径适配', shortName: '外语路径',
      description: '识别外语学习中的潜在瓶颈，评估学校是否建立了充分的学情分析与学习路径评估机制。',
      questions: [
        { id: 'Q06', prompt: '近两次考试中，是否存在其他学科成绩相对较好，但外语成绩持续明显偏弱的学生群体？', type: 'single', mechanism: false,
          options: [option('A', '存在，已有连续考试数据支持'), option('B', '观察到类似情况，但尚未系统统计'), option('C', '暂未发现明显的此类群体'), option('D', '不清楚')] },
        mechanism('Q07', '学校能否区分学生外语学习困难的主要原因，如基础知识、学习方法和学习投入等？'),
        mechanism('Q08', '针对外语薄弱学生，学校是否建立专项辅导和效果跟踪机制？'),
        mechanism('Q09', '学校是否了解高考其他外语语种的相关政策，以及高校专业可能存在的语种限制？'),
        mechanism('Q10', '学校是否建立过综合考虑学生学情、学习意愿、师资条件及升学要求的外语学习路径评估机制？')
      ]
    },
    {
      id: 'd3', name: '拔尖学生识别与培养', shortName: '拔尖培养',
      description: '判断学校是否充分识别基础学科优秀学生，并建立持续培养和资源支持机制。',
      questions: [
        { id: 'Q11', prompt: '学校是否存在数学、物理、化学等基础学科表现突出且具有持续学习兴趣的学生？', type: 'single', mechanism: false,
          options: [option('A', '存在，已有比较明确的学生群体'), option('B', '可能存在，但尚未系统识别'), option('C', '目前尚未发现'), option('D', '不清楚')] },
        mechanism('Q12', '学校是否建立了综合考虑学科表现、学习兴趣和发展潜力的拔尖学生识别标准？'),
        mechanism('Q13', '学校是否形成了贯穿高中不同年级的拔尖学生培养方案？'),
        mechanism('Q14', '学校是否能够为拔尖学生提供适当的拓展课程、教师指导及学习资源？'),
        mechanism('Q15', '学校是否定期评估拔尖学生的学习表现、兴趣变化和培养效果？')
      ]
    },
    {
      id: 'd4', name: '升学指导与政策应用', shortName: '升学指导',
      description: '判断学校是否能够及时掌握相关招生政策，并为不同学生提供有针对性的升学指导。',
      questions: [
        { id: 'Q16', prompt: '学校目前重点关注哪些升学路径？', help: '可多选', type: 'multi', mechanism: false,
          options: [option('general', '普通高考统招'), option('foundation', '强基计划'), option('comprehensive', '综合评价招生'), option('special', '高校专项计划等专项招生'), option('other_policy', '其他符合本省政策的升学路径'), option('unclear', '暂未形成明确重点', true)] },
        mechanism('Q17', '学校是否建立了定期跟进本省招生政策、高校招生要求的工作机制？'),
        mechanism('Q18', '学校是否有专人负责整理不同升学路径的报考条件、时间节点和相关要求？'),
        mechanism('Q19', '学校是否能够提前核查学生目标专业涉及的选考科目、外语语种等招生限制？'),
        mechanism('Q20', '学校是否根据学生成绩、兴趣和发展方向，提供有针对性的升学指导？')
      ]
    },
    {
      id: 'd5', name: '师资资源与教学支持', shortName: '资源支持',
      description: '判断学校是否具备实施差异化培养的资源条件，并形成必要的沟通与支持机制。',
      questions: [
        { id: 'Q21', prompt: '学校在推进差异化培养时，目前面临哪些主要资源制约？', help: '可多选', type: 'multi', mechanism: false,
          options: [option('teachers', '专业师资不足'), option('courses', '专项课程资源不足'), option('schedule', '教学时间安排困难'), option('coordination', '跨部门组织协调困难'), option('none', '暂未发现明显资源制约', true), option('unknown', '不清楚', true)] },
        mechanism('Q22', '学校是否具备外语分层教学所需的师资与课程支持条件？'),
        mechanism('Q23', '学校是否具备基础学科拓展教学、拔尖学生培养所需的师资资源？'),
        mechanism('Q24', '学校能否在落实国家课程要求的前提下，为不同培养需求安排适当的教学支持？'),
        mechanism('Q25', '在调整学生培养方案时，学校是否建立了学生意愿了解、家校沟通与跟踪反馈机制？')
      ]
    },
    {
      id: 'd6', name: '数据分析与持续改进', shortName: '数据改进',
      description: '判断学校是否能够通过持续的数据分析识别教学问题，并验证改进措施的效果。',
      questions: [
        { id: 'Q26', prompt: '过去一个学期，学校最希望重新评估哪类措施的实施效果？', help: '可多选', type: 'multi', mechanism: false,
          options: [option('borderline', '本科临界生专项帮扶'), option('language', '外语薄弱学生辅导'), option('talent', '拔尖学生培养'), option('guidance', '升学指导工作'), option('other', '其他教学改进措施'), option('unclear', '目前尚不明确', true)] },
        mechanism('Q27', '学校是否能够持续分析不同学生群体的成绩分布及变化趋势，而不只是关注平均分？'),
        mechanism('Q28', '学校是否定期评估重点教学措施实施前后的学生表现，并考虑其他可能影响结果的因素？'),
        mechanism('Q29', '每次学情分析后，学校是否明确改进措施、责任人及下一次检查节点？'),
        mechanism('Q30', '学校是否根据数据变化和师生反馈，及时调整原有教学及培养方案？')
      ]
    }
  ];

  window.DIAG_DATA = {
    version: '1.0.0', storageKey: 'qixiao_county_high_school_diagnosis_v1', dimensions,
    provinces: ['北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆','香港','澳门','台湾'],
    roles: ['校长','书记','教学副校长','教务主任','年级主任','其他学校管理人员','其他'],
    mechanismScore: { A: 100, B: 50, C: 0, D: null },
    futureContactSchema: { enabled: false, fields: ['schoolName', 'role', 'contact', 'discussionTopic'], consentRequired: true },
    cloudInterface: { enabled: false, note: 'V1.0 仅保存于当前设备，未上传云端。' }
  };
})();
