state: stable
layout:
core:
config: core/config/{config.ts,example.config.ts,validate-config.ts}
pipeline: core/pipeline/{generate.ts,apply-layout.ts,build-css.ts,generate-imports.ts,generate-robots.ts,generate-rss.ts,generate-sitemap.ts,module-runner.ts}
shared: core/shared/{logger.ts,date-utils.ts,path-and-file-utils.ts}
internal: core/internal/{content-utils.ts,error-utils.ts,html-minify.ts}
cli: core/cli/{build.ts,serve.ts}
types: core/types/{config.ts,module.ts,layout.ts,index.ts}
modules:
blog: modules/blog/{module.ts,types.ts,README.md,pipeline/_,utils/_}
app:
content: content/pages + content/blog/posts
templates: templates/_
styles: styles/_
client: client/\_
assets: assets/\*
config:
location: core/config/config.ts
modules: config.modules list
types:
core: CoreConfig = CoreSiteConfig + CorePathConfig + ThemeConfig + ModuleConfig
blog: BlogModuleConfig (required only when 'blog' is enabled)
module_contract:
file: modules/<name>/module.ts
exports: default Module { run(context), directoryPairs?, validate?(config) }
context: { config, layoutData? }
outputs:
core: public/robots.txt, public/404.html
blog: public/blog/\*\*, public/rss.xml, public/sitemap.xml
commands:
build: npm run build
test: npm test (cleans dist first)
lint: npm run lint
format: npm run format
notes:
core is standalone; modules extend it
shared utilities are for core+modules only
module docs are SSoT for module config
last_checks:
build: pass
test: pass
lint: pass
format: pass
