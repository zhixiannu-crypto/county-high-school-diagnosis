# 高中多语种升学增量分析系统 V1.4

七校纵横·县中联盟的纯静态网站。学校成绩在浏览器本地解析；用户填写本次考试的本科、重本参考线及可选的英语薄弱参考线后，生成学校报告和可主动导出的学生名单。网站不使用省级高考分数线判断本次考试达线情况。

V1.4 报告分为升学增量总览、英语成绩整体画像、临界学生与改善空间，含六组直接标注数字和结论的图表。偏科分组只统计满足其他学科数据要求的学生；数据不足时会说明无法生成。网站的“查看示例报告”入口明确标注“模拟数据”。

公开网址：<https://zhixiannu-crypto.github.io/county-high-school-diagnosis/multilingual-admission-gain/>

## 使用

打开网址，上传同一场考试、同一年级的 `.xlsx`、`.xls` 或 `.csv` 成绩表。检查识别信息，填写本次考试参考线及满分，点击“开始分析并生成报告”。“保存为PDF”使用浏览器打印功能；“导出重点关注学生名单”会先显示隐私提示，再在浏览器本地生成 `.xlsx`。报告不含学生姓名和学号。刷新页面清除本次数据。

英语薄弱、偏科与冲线候选的完整规则见 [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md)。测试说明见 [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md)。

## 本地运行与构建

安装 Node.js 20 以上；项目不需要额外下载运行时依赖。

```sh
npm test
npm run build
npm start
```

`dist/` 是静态构建结果。GitHub 仓库的 `multilingual-admission-gain/` 目录是正式发布内容，使用相对路径兼容 GitHub Pages 子路径。不要直接双击 `index.html`，本地预览请通过 HTTP 服务打开。
