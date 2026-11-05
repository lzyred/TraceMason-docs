# Glossary / 术语与证据语义

| Term | Meaning / 定义 |
|---|---|
| Gateway | 模型请求路由层；只对经过自身的数据面具备可见性 |
| Trace | 相关调用/跨度集合，不自动等同完整 Agent 执行 |
| Inference Event | 模型请求、响应及策略处理事件 |
| Agent Event | Agent 工具调用、执行结果或生命周期事件 |
| Task | 具有目标和可声明验收条件的工作单元；可能包含多轮推理 |
| Observation | 可追溯的观察事实，例如用户纠错、测试失败或策略命中 |
| Instinct | 对多个 Observation 归纳出的原子行为建议，尚不代表已验证 |
| Skill | 可分发给 Agent 的版本化工作指令及可选资源 |
| Skill Registry | 保存 Skill 版本、范围、审批、评估和部署状态的登记层 |
| Evidence | 支持或反驳事实声明的可访问、可验证对象 |
| Provenance | 来源、采集方式、时间、主体、完整性和验证级别信息 |
| Model Claim | 模型自述，例如“任务完成”；不是独立结果 |
| User Feedback | 用户评价或纠错；是观察信号，不自动证明修订结论 |
| Tool Observed | 从 Hook/工具返回观察到的结果；仍须判断真实性和完整性 |
| Externally Verified | 由独立的 CI、测试、业务验收或授权人员确认 |
| Approved | 治理授权状态；与实证是否正确是两个维度 |
| Complete / Partial / Unknown | 证据覆盖程度，不是好坏判断 |
| Preventive Guardrail | 在允许外发/执行前进行控制的机制 |
| Detective Audit | 事后检测与记录，不能撤回已泄露的内容 |
| Canary | 小范围发布、观测并具备回退路径 |
| Artifact Digest | Skill 内容的不可变哈希标识 |
| Regression | 更新模型、Skill 或策略后出现的表现下降 |
| Data Lineage | 原始证据到派生经验/Skill 的可追溯依赖链 |
| Baseline | 在同等任务与环境下不启用候选 Skill 的对照条件 |
| Verification Coverage | 可独立验收任务占全部适用任务的比例 |

## Evidence classification: avoid category errors

- **Observed:** 发生过的可追溯事件，但不代表相关解释正确。
- **Inferred:** 根据事件得到的推断或建议。
- **Verified:** 与明确验收条件匹配的独立外部证据已通过。
- **Approved:** 授权人批准了该知识或 Skill 的治理状态。

Examples:

- "Model said done" → model claim, not verification.
- "CI passed" in model text → model claim, not CI event.
- "Real CI job passed, signed by integration" → externally verified for *that specific test*, not necessarily the entire task.
- "Skill approved by reviewer" → governance state; future usefulness still needs measurement.
