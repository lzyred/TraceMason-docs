---
hide:
  - navigation
  - toc
---

<div class="tm-hero" markdown>

<span class="tm-eyebrow">OPEN SOURCE CONCEPT · PRODUCT DESIGN v0.1</span>

# From AI Traces to <span class="tm-accent">Trusted Skills.</span>

<div class="tm-lead" markdown>
TraceMason · 迹匠

让模型交互、安全审计、真实任务验收与经验演化形成一条可信的工程闭环。

**Audit what happened. Verify what worked. Reuse what is proven.**
</div>

<div class="tm-actions" markdown>
[体验交互 Demo →](demo/){ .md-button .md-button--primary }
[阅读产品设计](00-product/vision.md){ .md-button }
[查看系统架构 ↗](01-architecture/system.md){ .md-button }
</div>

<div class="tm-progress" markdown>
<span class="tm-stage">Observe</span>
<span class="tm-stage">Audit</span>
<span class="tm-stage">Evaluate</span>
<span class="tm-stage">Learn</span>
<span class="tm-stage">Validate</span>
<span class="tm-stage">Publish</span>
<span class="tm-stage">Re-evaluate</span>
</div>
</div>

<div class="tm-kicker">DESIGNED FOR TRUSTWORTHY AI OPERATIONS</div>

## 三个核心能力 · Three pillars

<div class="tm-feature-grid">
  <a class="tm-feature" href="01-architecture/security-governance/">
    <span class="tm-num">01 / GOVERNANCE</span>
    <h3>AI Governance</h3>
    <p>针对网关输入、模型输出与 Agent 执行边界建立差异化审计、脱敏与授权机制。</p>
    <span class="tm-more">安全与治理 →</span>
  </a>
  <a class="tm-feature" href="01-architecture/events-and-data/">
    <span class="tm-num">02 / EVIDENCE</span>
    <h3>Evidence-Backed Quality</h3>
    <p>以真实测试、工具证据及人工验收评价结果，而不是相信模型一句“任务完成”。</p>
    <span class="tm-more">证据数据模型 →</span>
  </a>
  <a class="tm-feature" href="01-architecture/experience-skill/">
    <span class="tm-num">03 / EVOLUTION</span>
    <h3>Skill Evolution</h3>
    <p>从纠错和经过验证的成功中提炼规则，并通过测试、审批、版本发布和回滚持续优化。</p>
    <span class="tm-more">Skill 演化机制 →</span>
  </a>
</div>

## 产品闭环 · The system loop

<div class="tm-loop">
  <div class="tm-loop-item">
    <span class="tm-loop-tag">INGEST</span>
    <strong>Inference + Agent Evidence</strong>
    <small>模型请求与响应 / Hook / CI / 用户反馈</small>
  </div>
  <div class="tm-loop-arrow">→</div>
  <div class="tm-loop-item">
    <span class="tm-loop-tag">QUALIFY</span>
    <strong>Audit + Outcome Verification</strong>
    <small>策略检查 / 关联证据 / 独立验收</small>
  </div>
  <div class="tm-loop-arrow">→</div>
  <div class="tm-loop-item">
    <span class="tm-loop-tag">EVOLVE</span>
    <strong>Instinct → Skill → Release</strong>
    <small>经验候选 / 回归评估 / 审批及回滚</small>
  </div>
</div>

!!! warning "重要边界 / Important boundary"
    **网关日志不等于完整的 Agent 执行记录。模型声明的成功不等于外部验证。** 这两条是 TraceMason 的核心设计原则。当前仓库是产品与架构设计文档，尚未发布可运行的 TraceMason 服务。

## 从哪里开始 · Explore the documentation

<div class="tm-shortcuts">
  <a href="00-product/requirements/"><span>01</span><div><strong>产品功能与边界</strong><small>需求、P0 范围、成功标准</small></div></a>
  <a href="00-product/console/"><span>02</span><div><strong>管理控制台</strong><small>七个页面的真实业务交互</small></div></a>
  <a href="01-architecture/system/"><span>03</span><div><strong>技术总体架构</strong><small>推理、证据与演化三条链路</small></div></a>
  <a href="02-interfaces/api-contracts/"><span>04</span><div><strong>API 与事件契约</strong><small>接口、身份、溯源、幂等</small></div></a>
  <a href="03-delivery/mvp-plan/"><span>05</span><div><strong>MVP 实施路线图</strong><small>M0–M3 纵向交付阶段</small></div></a>
  <a href="03-delivery/acceptance/"><span>06</span><div><strong>验收与评估</strong><small>12 个可以验证的验收项</small></div></a>
</div>

<div class="tm-footer-note">
  <strong>Build on verified evidence, not AI assertions.</strong>
  <span>TraceMason Docs v0.1 · 公开设计提案 / Open design proposal</span>
</div>
