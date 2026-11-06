---
hide:
  - navigation
  - toc
---

<div class="tm-landing" id="tm-landing">

  <section class="tm-universe" aria-labelledby="tm-hero-heading">
    <canvas id="tm-scene" class="tm-scene" aria-hidden="true"></canvas>
    <div class="tm-scene-fallback" aria-hidden="true"></div>
    <div class="tm-universe-mask" aria-hidden="true"></div>

    <div class="tm-hero-inner">
      <div class="tm-overline">
        <div class="tm-overline-left"><span class="tm-status-pulse" aria-hidden="true"></span> TraceMason <span class="tm-overline-sep">/</span> OPEN SOURCE RESEARCH PROJECT</div>
        <div class="tm-overline-links">
          <a href="00-product/vision/">Vision <span aria-hidden="true">↗</span></a>
          <a href="01-architecture/system/">Architecture <span aria-hidden="true">↗</span></a>
          <a href="https://github.com/lzyred/TraceMason-docs" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </div>
      </div>

      <div class="tm-hero-copy">
        <div class="tm-eyebrow-line"><span class="tm-eyebrow-mark" aria-hidden="true"></span> FROM AI TRACES TO TRUSTED SKILLS <span class="tm-version">V0.1 / EXPERIMENTAL</span></div>
        <h1 id="tm-hero-heading">AI should learn<br>from <span class="tm-hero-shine">evidence.</span><br>Not assumptions.</h1>
        <p class="tm-hero-cn">让 AI 从真实交付证据中学习，而不是从一句“任务完成”中自我肯定。</p>
        <p class="tm-hero-support">Capture interactions. Verify outcomes. Turn proven experience into reusable, governed Agent Skills.</p>

        <div class="tm-hero-buttons">
          <a href="runnable-demo/" class="tm-btn tm-btn-primary">Explore the working demo <span aria-hidden="true">↗</span></a>
          <a href="00-product/vision/" class="tm-btn tm-btn-secondary">Read the product vision <span aria-hidden="true">→</span></a>
        </div>

        <div class="tm-hero-metadata" aria-label="Project characteristics">
          <span><i class="tm-meta-dot" aria-hidden="true"></i> Open-source concept</span>
          <span><i class="tm-meta-diamond" aria-hidden="true"></i> Evidence-first</span>
          <span><i class="tm-meta-check" aria-hidden="true"></i> Runnable local prototype</span>
        </div>
      </div>

      <div class="tm-orbit-hud" aria-hidden="true">
        <div class="tm-hud-rule"></div>
        <span>ORBIT / 03</span>
        <strong>TRUSTED KNOWLEDGE</strong>
        <small>PROVENANCE → VALIDATION → SKILL</small>
      </div>

      <div class="tm-universe-foot">
        <div class="tm-universe-indicator"><span class="tm-indicator-line" aria-hidden="true"></span> OBSERVE <span class="tm-mid-dot">·</span> VERIFY <span class="tm-mid-dot">·</span> EVOLVE</div>
        <div class="tm-universe-controls">
          <button id="tm-motion-toggle" type="button" class="tm-motion-toggle" aria-label="Pause background animation" aria-pressed="false"><span class="tm-motion-icon" aria-hidden="true">Ⅱ</span><span class="tm-motion-label">PAUSE MOTION</span></button>
          <a href="#tm-how-it-works" class="tm-scroll-link">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </div>
    <div class="tm-universe-edge" aria-hidden="true"></div>
  </section>

  <section class="tm-rail" aria-label="TraceMason product process">
    <div class="tm-rail-content">
      <span class="tm-rail-index">THE CONTINUOUS LOOP <span class="tm-rail-number">/ 01</span></span>
      <div class="tm-rail-flow">
        <span><i>01</i> Observe</span><b aria-hidden="true">→</b>
        <span><i>02</i> Verify</span><b aria-hidden="true">→</b>
        <span><i>03</i> Learn</span><b aria-hidden="true">→</b>
        <span><i>04</i> Release</span><b aria-hidden="true">→</b>
        <span><i>05</i> Re-evaluate</span>
      </div>
    </div>
  </section>

  <section class="tm-section tm-introduction" id="tm-how-it-works">
    <div class="tm-section-kicker"><span class="tm-kicker-line" aria-hidden="true"></span> NOT ANOTHER AI DASHBOARD</div>
    <div class="tm-intro-layout">
      <h2>Stop collecting answers.<br><span>Start improving outcomes.</span></h2>
      <div class="tm-intro-description">
        <p>Most AI tools record what models <em>said</em>. TraceMason explores how to connect those records to what actually <em>worked</em> — tests, tool results, human acceptance, and reproducible evidence.</p>
        <p class="tm-zh">记录不等于理解，模型自评不等于验证。只有经过独立验收的经验，才值得成为下一个 Agent 可以复用的 Skill。</p>
      </div>
    </div>
  </section>

  <section class="tm-section tm-capabilities" aria-label="Core platform capabilities">
    <div class="tm-capability-card" style="--tm-card-n:0">
      <div class="tm-card-top"><span class="tm-card-num">01 / OBSERVE</span><span class="tm-card-icon" aria-hidden="true">◎</span></div>
      <h3>Capture the signals.</h3>
      <p>Bring gateway events, agent execution signals, and task evidence into one traceable view. Missing signals remain explicitly unknown.</p>
      <a href="01-architecture/events-and-data/">Explore the evidence model <span aria-hidden="true">↗</span></a>
      <div class="tm-card-graphic tm-graphic-trace" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    </div>
    <div class="tm-capability-card" style="--tm-card-n:1">
      <div class="tm-card-top"><span class="tm-card-num">02 / VERIFY</span><span class="tm-card-icon" aria-hidden="true">⌁</span></div>
      <h3>Prove the outcome.</h3>
      <p>Replace self-reported success with independent checks. Distinguish model claims, executed tests, incomplete evidence, and verified results.</p>
      <a href="03-delivery/acceptance/">See the verification gates <span aria-hidden="true">↗</span></a>
      <div class="tm-card-graphic tm-graphic-verify" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>
    <div class="tm-capability-card" style="--tm-card-n:2">
      <div class="tm-card-top"><span class="tm-card-num">03 / EVOLVE</span><span class="tm-card-icon" aria-hidden="true">⬡</span></div>
      <h3>Ship trusted Skills.</h3>
      <p>Extract candidates from failures and corrections, evaluate them, require approval, publish scoped versions, and preserve rollback.</p>
      <a href="01-architecture/experience-skill/">Discover Skill evolution <span aria-hidden="true">↗</span></a>
      <div class="tm-card-graphic tm-graphic-skill" aria-hidden="true"><span>TRACE</span><b>→</b><span>SKILL.md</span></div>
    </div>
  </section>

  <section class="tm-section tm-workbench" aria-labelledby="tm-workbench-title">
    <div class="tm-workbench-copy">
      <div class="tm-section-kicker"><span class="tm-kicker-line" aria-hidden="true"></span> BUILT TO BE TESTED</div>
      <h2 id="tm-workbench-title">A prototype you can<br><span>actually run.</span></h2>
      <p>The initial implementation is a local Python service with SQLite, actual unit-test execution, a deterministic completion gate, generated SKILL.md, and rollback. It is a technical proof of the evidence pipeline — not yet autonomous Agent improvement.</p>
      <div class="tm-workbench-actions">
        <a class="tm-btn tm-btn-dark" href="runnable-demo/">Run the local prototype <span aria-hidden="true">→</span></a>
        <a class="tm-workbench-textlink" href="demo/">See UI concept <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <div class="tm-terminal">
      <div class="tm-terminal-top">
        <div class="tm-terminal-dots" aria-hidden="true"><i></i><i></i><i></i></div>
        <span>QUICK START / TERMINAL</span>
        <button type="button" id="tm-copy-command" aria-label="Copy quick start commands">COPY <span aria-hidden="true">⧉</span></button>
      </div>
      <pre class="tm-terminal-code"><code><span class="tm-command-comment"># Clone & launch the runnable prototype</span>
<span class="tm-command-symbol">$</span> git clone https://github.com/lzyred/TraceMason-docs.git
<span class="tm-command-symbol">$</span> cd TraceMason-docs
<span class="tm-command-symbol">$</span> python3 prototype/tracemason.py

<span class="tm-command-comment"># Open the local interactive workbench</span>
<span class="tm-command-symbol">$</span> <span class="tm-command-accent">http://127.0.0.1:8765/</span></code></pre>
      <div class="tm-terminal-bottom"><span><i class="tm-terminal-led"></i> LOCAL ONLY</span><span>Python standard library · No API key required</span></div>
    </div>
  </section>

  <section class="tm-section tm-integrity" aria-label="Scope and honesty">
    <div><span class="tm-integrity-symbol" aria-hidden="true">✳</span><strong>Designed around evidence, not promises.</strong></div>
    <p>This repository contains a documented architecture and runnable local prototype. Real Codex / Claude / OpenCode integration and measured cross-Agent improvement are future validation milestones — not shipped claims.</p>
    <a href="05-decisions/open-questions/">Review open questions <span aria-hidden="true">↗</span></a>
  </section>

  <section class="tm-last-cta">
    <span>TRACE · VERIFY · EVOLVE</span>
    <h2>Make every verified outcome<br>count toward the next one.</h2>
    <div>
      <a href="00-product/vision/" class="tm-btn tm-btn-primary">Read the vision <span aria-hidden="true">↗</span></a>
      <a href="https://github.com/lzyred/TraceMason-docs" class="tm-btn tm-btn-outline" target="_blank" rel="noopener noreferrer">View on GitHub <span aria-hidden="true">↗</span></a>
    </div>
  </section>

  <footer class="tm-landing-footer">
    <strong>TraceMason <span>/</span> From AI Traces to Trusted Skills.</strong>
    <span>Open-source research preview · v0.1 · Design and implementation evolve independently</span>
  </footer>

</div>
