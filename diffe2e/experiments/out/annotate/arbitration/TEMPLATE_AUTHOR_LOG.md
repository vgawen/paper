# 仲裁包时间与哈希记录（作者自留，勿随包外发）

## 1. 规则

- 本文件只保存在本地，不进入外发压缩包。
- 甲乙对应表与随机种子只保存在本地 `local/`，不对外发送；事后还原依赖该表。
- RQ3 不报 κ：本流程不计算、不输出 κ，保持既有统计口径。
- 现有 ANNOTATION_GUIDE、既有盲评包与任何 SHA256SUMS 冻结文件均未改动。

## 2. 生成记录

| 时间 | 动作 | 文件 | 字节 | SHA-256 |
|---|---|---|---|---|
| <YYYY-MM-DD HH:mm:ss> | template / pack | <文件名> | <字节> | <sha256> |

## 3. 甲乙对应

- 随机种子文件：`local/BLINDING_SEED.txt`
- 对应表：`local/BLINDING_MAP_<时间戳>.json`
- 对应表 SHA-256：`<sha256>`

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
node -e 'const m=require("./local/BLINDING_MAP_<时间戳>.json"); for (const [id,v] of Object.entries(m.cases)) console.log(id, "甲="+v.jia_source, "乙="+v.yi_source)'
```
