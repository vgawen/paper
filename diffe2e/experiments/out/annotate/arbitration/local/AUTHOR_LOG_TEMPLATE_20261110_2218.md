# 仲裁包时间与哈希记录（作者自留，勿随包外发）

## 1. 规则

- 本文件只保存在本地，不进入外发压缩包。
- 甲乙对应表与随机种子只保存在本地 `local/`，不对外发送；事后还原依赖该表。
- RQ3 不报 κ：本流程不计算、不输出 κ，保持既有统计口径。
- 现有 ANNOTATION_GUIDE、既有盲评包与任何 SHA256SUMS 冻结文件均未改动。

## 2. 生成记录

| 时间 | 动作 | 文件 | 字节 | SHA-256 |
|---|---|---|---|---|
| 2026-11-10 22:18:26 | template | make_arbitration_packet.mjs | 29397 | 2520fb095e4b308e5474ec51fee45a452b36d0b2ac493715c568a1e03b6b9db8 |
| 2026-11-10 22:18:26 | template | TEMPLATE_ARB_RQ2_adjudication.csv | 84 | 89cc75e737d67bfbf92f97eef3295a802b8dbd6afb3ee21db04b31c2e79dfb3a |
| 2026-11-10 22:18:26 | template | TEMPLATE_ARB_RQ2_worksheet.md | 1157 | d3f766fc7bc34bdc86db39527c6700a3de17ad259f94fc9854c7d255819bfbac |
| 2026-11-10 22:18:26 | template | TEMPLATE_ARB_RQ3_adjudication.csv | 84 | 89cc75e737d67bfbf92f97eef3295a802b8dbd6afb3ee21db04b31c2e79dfb3a |
| 2026-11-10 22:18:26 | template | TEMPLATE_ARB_RQ3_worksheet.md | 1658 | fe2bbc0895a93dd0cf9c703bd2179b7f16aec1cd3e33e24e7b36773b9b5b0ba9 |
| 2026-11-10 22:18:26 | template | TEMPLATE_S_README.md | 2004 | b300070d90801aca7c9c5cc10bcc6d024685a969bfda2fb0bc6a3e2f4f07c156 |
| 2026-11-10 22:18:26 | template | EMAIL_BODY_DRAFT.md | 863 | 35c9a76a517ff9ccc98a29a093b5ab08950a3d148f8c98049bcf365f5aca8d3b |
| 2026-11-10 22:18:26 | template | TEMPLATE_AUTHOR_LOG.md | 1432 | 68dd6b10d3c7caa7e3250a0df1f4995b3a05fcbe79be2c14da6860cea8da284d |

## 3. 甲乙对应

- 随机种子文件：`local/BLINDING_SEED.txt`
- 对应表：`（尚未生成；--pack 时写入）`
- 对应表 SHA-256：`（尚未生成）`

## 4. 回收记录（收到回表后填写）

| 收到时间 | 附件名 | 实算 SHA-256 | 邮件声明 SHA-256 | 是否一致 | 解包时间 | 备注 |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## 5. 回收核对命令

```bash
node make_arbitration_packet.mjs --hash ~/Downloads/arbitration_return_S_<YYYYMMDD>.zip
# 与第 2 节记录的压缩包 SHA-256 逐字比对；一致后再解包
unzip arbitration_return_S_<YYYYMMDD>.zip -d return_S_<YYYYMMDD>
```

## 6. 还原甲乙

```bash
node -e 'const m=require("./（尚未生成；--pack 时写入）"); for (const [id,v] of Object.entries(m.cases)) console.log(id, "甲="+v.jia_source, "乙="+v.yi_source)'
```


种子（本地）：`arb-20261110_2217`
