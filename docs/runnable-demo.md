# Runnable TraceMason Demo / 可执行产品验证

> **A working local service, not the static GitHub Pages mock.**  
> 真正运行的本地 HTTP + SQLite + unittest + Skill 评估、发布、回滚系统。

## Start / 两条命令启动

从 [TraceMason-docs 仓库](https://github.com/lzyred/TraceMason-docs) 克隆后：

```bash
git clone https://github.com/lzyred/TraceMason-docs.git
cd TraceMason-docs
python3 prototype/tracemason.py
```

访问 **[http://127.0.0.1:8765/](http://127.0.0.1:8765/)**（请在运行服务器的电脑上打开）。

该服务只绑定 localhost；GitHub Pages 无法直接运行 Python 后端，不能把静态原型误当成真实服务。

## What the demo actually does / 真正发生的事情

| Step | Actual behavior | Proof |
|---|---|---|
| Run failing fixture | Python 在临时目录执行真实 `unittest` | 原始进程输出、失败数量、SHA-256 |
| Run passing control | 同一测试套件执行已修复版本 | 真实退出码 0、测试结果 |
| Derive candidate | 从 SQLite 中检索失败 + 完成声明冲突 | 来源 Run ID、Skill Draft |
| Evaluate | 真实执行确定性的 Completion Gate 测试 | baseline / rule 对照及每个案例判定 |
| Approve + publish | 更新数据库状态并写出 `SKILL.md` | `prototype/data/skills/verified-code-delivery/SKILL.md` |
| Check claim | 发布前后 HTTP API 实际调用不同判定器 | `accept` → `reject`（失败任务） |
| Rollback | 实际停用规则并删除已发布的本地文件 | 判定恢复基线；SQLite 保留演化历史 |

!!! warning "Honest limitation"
    - 失败任务中的“Agent 已完成”**是可重复的模拟输入**，并非一个真实 Codex 模型产生的结果；真正的测试结果来自执行 `unittest`。
    - Evaluation 证明的是**完成声明门控规则正确工作**，不证明大模型因此变聪明或者 Skill 改善了真实任务成功率。
    - OpenAI 兼容接口支持非流式代理/审计；默认使用明确标记的 mock provider。只有配置你自己的上游地址和 API key 才执行真实推理。
    - 尚无权限体系、生产级内容检测、通用 Agent Hook 或安全多租户隔离；不要接入真实敏感数据或公开暴露此服务。

## Try real gateway requests / 尝试真实网关请求

```bash
curl -s http://127.0.0.1:8765/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"demo","messages":[{"role":"user","content":"Hello"}]}'
```

返回 JSON 中的 `tracemason.not_real_inference=true` 明确说明这不是大模型推理。请求哈希和脱敏预览会写入 SQLite。

在你拥有且授权使用的实际 OpenAI 兼容网关前置运行：

```bash
export TRACEMASON_UPSTREAM_URL='https://your-authorized-gateway.example/v1/chat/completions'
export TRACEMASON_UPSTREAM_KEY='YOUR_SECRET'
python3 prototype/tracemason.py
```

仅支持非流式 Chat Completions，**不承诺兼容所有 Codex / Claude API 协议。**

## Automated verification / 自动化验证

```bash
python3 -m unittest discover -s prototype/tests -v
```

CI 将验证：失败测试与成功测试真实执行、证据不足不能推导、跳级审批失败、可重复评估、实际文件发布、决策变化与回滚、HTTP API、基本凭据拦截及脱敏存储。

完整 API、边界和操作指南见 [prototype/README.md](https://github.com/lzyred/TraceMason-docs/blob/main/prototype/README.md)。

## Next milestone / 下一阶段

在此闭环验证稳定后，集成 **一个真实 Agent Runtime 的 Hook 事件**，用真实工具调用和 CI 结果替代当前刻意模拟的 Agent completion claim，然后使用固定任务集验证 Skill 对真实 Agent 交付表现是否有可测量改善。
