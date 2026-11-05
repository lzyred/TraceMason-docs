# GitHub Pages Deployment / 文档站部署

**Status:** Workflow implemented in repository; actual Pages activation must be verified in GitHub Settings.

## URL

Expected public URL after successful activation and deployment:

**https://lzyred.github.io/TraceMason-docs/**

Do not present the URL as live before GitHub Actions reports a successful deployment.

## One-time repository setup

1. Merge the documentation/site pull request into `main`.
2. Open **[Repository Settings → Pages](https://github.com/lzyred/TraceMason-docs/settings/pages)**.
3. Under **Build and deployment → Source**, select **GitHub Actions** (not “Deploy from a branch”).
4. Open **[Actions](https://github.com/lzyred/TraceMason-docs/actions/workflows/pages.yml)** and run **Documentation / GitHub Pages** via **Run workflow** if the initial push has already occurred.
5. Wait for the `build` and `deploy` jobs to succeed and use the deployment URL GitHub reports. If deployment fails, read the job logs; do not assume site is published.

GitHub Pages settings are repository-level and cannot be enabled solely by adding a workflow file.

## Development / 本地预览

~~~bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-docs.txt
mkdocs serve
~~~

Open `http://127.0.0.1:8000/`. For strict build validation:

~~~bash
mkdocs build --strict
~~~

The output `site/` is generated and gitignored; do not commit generated pages.

## CI/CD

- PRs touching docs/config trigger a **strict build validation**.
- Merged changes on `main` trigger a build and (when Pages is enabled) a deployment.
- The deployment job uses `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.
- The default branch is the single publishing source; drafts can be reviewed through PRs.
- The site is static and does not process model traffic or contain real user audit data.

## Content management

- The original Markdown under `docs/` is the **single source of truth**.
- Edit pages through PRs; navigation lives in `mkdocs.yml`.
- Global styling lives in `docs/stylesheets/extra.css`, the brand icon in `docs/assets/tracemason-mark.svg`.
- README remains repository orientation. The home page is `docs/index.md`.
- Update the site version label if the product baseline changes; do not confuse proposed functionality with shipped code.

## Failure handling

- **Missing Pages setting:** build may succeed but deployment cannot be asserted; set source to GitHub Actions.
- **Build warnings:** `mkdocs build --strict` fails, protecting nav/link consistency.
- **Broken nav:** check `mkdocs.yml` paths relative to `docs/`.
- **Security:** Never publish raw inference traces, private data, API keys, or customer artifacts into the public docs tree.
