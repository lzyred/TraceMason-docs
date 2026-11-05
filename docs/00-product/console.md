# Web Console Information Architecture / 产品页面与交互

**Status:** Proposed. Seven top-level pages; do not bury major workflows under nested submenu toggles.

## 全局设计原则

- 使用同一 tenant/project、时间范围、模型与 Agent 过滤上下文；页面切换保持过滤器。
- 审计事件、质量评估、经验候选、Skill 版本提供可以互相跳转的稳定 ID。
- 每个结论必须展示证据来源及置信状态，未知项显示 unknown。
- 管理员看到策略配置，不代表可以访问未经授权的原始对话。
- 所有会影响模型调用、安全策略或下游 Agent 的操作必须展示变更和回滚路径。

## 1. Overview

**Purpose:** 在一个页面判断 AI 使用量、真实质量、主要风险和 Skill 效益。

页面组成：统计卡片（调用量、策略阻断数、verified task coverage、accepted task cost、Skill canary 效果）；时间趋势；最近重大告警；质量回退与高影响候选经验。

**Interactions:** 选择异常指标 → 带相同过滤条件跳转 Audit / Quality / Experience；不能只显示“准确率”而不给样本分母。

## 2. Audit

**Purpose:** 一次真实请求与一次 Agent 任务的证据链回放。

主表：时间、tenant/project、caller、model、request ID、policy result、content collection mode、风险、task outcome。详情按时间线显示输入检查、模型请求、模型响应、输出检查、Agent 事件、验证事件和审批。

**Interactions:** 过滤 → 查看事件 → 打开脱敏的输入输出（若有权限）→ 查看命中策略与关联证据 → 申报误报 / 导出脱敏证据。

**Guardrails:** 不允许在页面中显示被掩码的 API Key 原文；缺失 Hook 时必须显著标记 execution visibility = incomplete。

## 3. Quality

**Purpose:** 判断工作成果，而非仅判断模型文风。

主视图：任务维度的 outcome matrix（model/version、skill/version、verification coverage、success、rework、cost）。详情按 acceptance criterion 展示测试、构建、Diff、人工确认和未执行项。

**Interactions:** 点击失败或未知任务 → 审计时间线；创建回归评估用例；按固定测试集对比两个模型或 Skill 版本。

## 4. Experience

**Purpose:** 将证据整理为可审核的原子经验。

候选表：trigger、failure pattern、proposed rule、positive/negative evidence counts、evidence status、scope、conflict。详情需要提供生成依据、重复样本、反例、隐私状态与证据失效风险。

**Interactions:** 过滤 → 查看证据 → approve/reject/edit candidate → 创建 Skill Draft；任何一次修改都保留 revision 与 reviewer。

## 5. Skill Registry

**Purpose:** 管理跨 Agent Skill 全生命周期。

列表：name/version/scope/status、来源证据、评估结果、部署/使用情况。详情：文件树、SKILL.md、manifest、测试套件、与前一版本 Diff、适用客户端、回滚。

**Interactions:** 创建草稿 → 执行测试 → 审批 → 灰度发布 → 检查结果 → Active/rollback。审批和实际发布是两个独立动作。

## 6. Policies

**Purpose:** 检查与控制请求、响应、外部执行的策略。

策略表：scope、stage、condition、action、priority、version、owner、last evaluated。支持在脱敏样本上模拟策略，呈现命中理由与假阳性风险。

**Interactions:** 草拟 → 模拟测试 → 审核 → 版本发布 → 监测命中；不接受由 Skill 自动改变安全策略。

## 7. Integrations

**Purpose:** 接入网关、Hook、MCP 和分发适配器，并能明确知道覆盖范围。

接入表：类型、授权范围、健康状态、事件覆盖率、最近事件时间、版本/兼容性。配置详细展示网关 callback、agent hook、Git/CI verification、Skill sync 状态。

**Interactions:** 验证连接 → 发送合成测试事件 → 查看标准化事件 → 回滚/禁用；禁止将含明文 token 的配置复制到日志中。

## 三条导航闭环

1. Audit suspicious request → policy finding → policy simulator → publish rule version → audit verification.
2. Quality failed task → audit evidence → Experience candidate → Skill draft.
3. Skill test → approval → canary → quality comparison → full release or rollback.

## 角色权限草案

Viewer: see allowed aggregated metrics and redacted evidence; Auditor: inspect authorized audit case; Skill Maintainer: draft/evaluate; Approver: approve; Publisher: release/rollback; Security Admin: policy changes. These permissions should be separable.
