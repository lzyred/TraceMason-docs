# Requirements & Scope / 需求与范围

**Status:** Proposed. Priority definitions: P0 = v0.1 acceptance-blocking; P1 = next iteration; P2 = future study.

## P0 功能需求

| ID | Capability | Observable requirement | Acceptance ref |
|---|---|---|---|
| R-01 | Gateway ingestion | 为每个经过网关的请求记录身份、模型、时间、结果、Token/成本（如可用）、策略版本与内容采集状态 | A-01 |
| R-02 | Input guardrail | 请求发送前按策略识别密钥/敏感数据并阻断或脱敏；审计保留决策而非秘密 | A-02 |
| R-03 | Output handling | 非流式输出可做发送前检查；流式模式须标识是 buffer、chunk-gated 还是 audit-only | A-03 |
| R-04 | Correlation | 将 request、session、task、agent event、verification evidence 关联；允许部分缺失 | A-04 |
| R-05 | Evidence provenance | 事件记录来源、发生时间、采集时间、信任级别、完整性/指纹及租户范围 | A-05 |
| R-06 | Task status | 输出 declared / observed / verified / rejected / unknown 等独立状态，不将模型自述视为 verified | A-06 |
| R-07 | Candidate mining | 提取用户纠错、重复失败、验证成功的候选经验并显示正反证据 | A-07 |
| R-08 | Skill lifecycle | Draft → Tested → Approved → Canary → Active → Deprecated/Revoked；保留每次变更及签署审计 | A-08 |
| R-09 | Regression evaluation | 对新旧 Skill 和无 Skill 基线运行同一固定任务集，可判定 pass/fail 和增量效应 | A-09 |
| R-10 | Scope & rollback | Skill 根据 tenant/project/agent/runtime 解析，能取消分发并回滚旧版本 | A-10 |
| R-11 | Isolation & deletion | 租户默认隔离；对原始与派生资产支持删除/隔离处理 | A-11 |
| R-12 | Failure behavior | 审计不可用时按照租户策略进入受控降级，不能无声丢失需要持久化的审计事件 | A-12 |

## P1 需求

- OpenTelemetry GenAI 语义约定的双向兼容与导出。
- 多模型版本/Agent/Skill 的质量对照仪表盘。
- Skill 权限声明、签名验证及组织级审批策略。
- MCP Registry / Git Sync / IDE adapters，多端一致的使用记录。
- 更细粒度的内容分类、政策模拟、规则冲突解释与误报反馈。
- 多租户细粒度 RBAC、SSO 与不可抵赖的审批链（由落地场景决定顺序）。

## P2 研究

- 在审计与隐私许可约束下进行联邦/组织级经验共享。
- 基于反馈的半自动候选合并、废弃及质量回归建议。
- 跨不同编程语言/任务环境的 Skill 可迁移性测量。
- 训练数据导出或微调优化——与当前产品定位独立。

## 非功能需求

**Security:** 默认最小化记录敏感内容；加密存储、传输加密、最小权限、每租户数据隔离；执行点做实际授权。

**Reliability:** 采集采用 at-least-once + idempotency；异步评估不得阻塞核心网关；事故后能重放未完成事件。

**Latency:** 明确区别 audit-only、阻断和输出缓冲模式，分别建立 P50/P95 额外开销基线；v0.1 不预设不可靠的性能数字。

**Correctness:** 任何状态必须可追溯到具体事件/验证器/策略版本；不确定性必须可表达。

**Operability:** 支持部署、健康检查、备份恢复、日志可观测、数据保留与删除演练。

## 不做什么

- 不要求所有客户端必须安装 Hook 才能使用基础网关审计；但没有 Hook 的任务不能被伪装为已验证。
- 不把所有模型输出默认永久存储。
- 不因为一个用户点赞就将经验提升为全租户通用 Skill。
- 不让学习流程拥有直接修改生产安全策略的权限。

## Definition of Done

所有 P0 必须通过 [acceptance](../03-delivery/acceptance.md) 里的对应测试；证据链应能从审计事件追溯到任务验证和 Skill 版本；错误路径与回滚必须测试。
