state: v0.7-release
current*goal: maintain a cloneable, private, Node 24 SSG template
plan: TODO.md
layout:
core:
config: core/config/{config.ts,validate-config.ts}
pipeline: core/pipeline/{generate.ts,apply-layout.ts,build-css.ts,generate-imports.ts,generate-robots.ts,generate-rss.ts,generate-sitemap.ts,module-runner.ts}
shared: core/shared/{logger.ts,date-utils.ts,path-and-file-utils.ts,web-path-utils.ts,module-config-api.ts}
internal: core/internal/{content-utils.ts,layout-placeholders.ts,error-utils.ts,html-minify.ts}
cli: core/cli/{build.ts,serve.ts}
types: core/types/{config.ts,module.ts,layout.ts,index.ts}
modules:
blog: modules/blog/{module.ts,config.ts,types.ts,README.md,pipeline/*,domain/_,utils/_,**tests**/_}
app:
content: content/pages + content/blog/posts
templates: templates/_
styles: styles/\_
client: client/\_
assets: assets/\*
config:
location: core/config/config.ts
tracked: true
modules: config.modules list
types:
core: CoreConfig = CoreSiteConfig + CorePathConfig + ThemeConfig + ModuleConfig
blog: modules/blog/types.ts::BlogModuleConfig (required only when 'blog' is enabled)
module_contract:
file: modules/<name>/module.ts
exports: default Module { run(context) => void | { generatedPaths: string[] }, directoryPairs?, validate?(config), beforeRun?(context), afterRun?(context) }
context: { config, ui.setSlot(slot, content), ui.appendSlot(slot, content) }
outputs:
core: public/index.html, public/robots.txt, public/404.html
blog: public/blog/\*\*, public/rss.xml, public/sitemap.xml
commands:
build: npm run build
test: npm test (cleans dist first)
check: npm run check (format check, lint, test, build)
lint: npm run lint
format: npm run format
notes:
core is standalone; modules extend it
shared utilities are for core+modules only
module docs are SSoT for module config
serve is local-dev only; deploy the contents of `public/`
generated URLs support domain/subdomain roots, not URL subdirectories
showcase demo posts live in content/blog/posts/demo-post-\*.md
expanded roadmap/todos: TODO.md
last_checks:
audit_date: 2026-07-23
node: 24.18.0
build: pass (47 files, 34 HTML pages)
test: pass (15 test files)
lint: pass
format: pass
generated_site:
internal_links: pass
root_canonical: pass
robots_404: pass
