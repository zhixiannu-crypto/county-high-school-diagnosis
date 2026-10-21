# 高中多语种升学增量分析系统 V1.3

七校纵横·县中联盟的纯静态网站。学校成绩在浏览器本地解析。上传同一场考试、同一年级的成绩表后，学校填写本次考试的本科、重本参考线及可选的英语单科薄弱参考线，即可查看汇总报告、保存PDF，并在主动确认隐私提示后导出学生重点关注名单。省级高考分数线不参与本次考试达线计算。

公开网址：<https://zhixiannu-crypto.github.io/county-high-school-diagnosis/multilingual-admission-gain/>

本地预览需使用静态HTTP服务，不能直接用 `file://` 打开 `index.html`。运行自动测试：`npm test`（Node.js 20以上，无需安装运行时依赖）。测算规则见 [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md)；测试说明见 [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md)。GitHub Pages 从本仓库 `main` 分支发布，更新后沿用同一个公开网址。
