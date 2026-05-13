## [1.25.0](https://github.com/Mearman/metrics/compare/v1.24.0...v1.25.0) (2026-05-13)

### Features

* eliminate __PRIVACY__ placeholder for static GraphQL analysis ([28d9b08](https://github.com/Mearman/metrics/commit/28d9b081d3a2cae55d3e4aedc687c98b3f6d02ac))

## [1.24.0](https://github.com/Mearman/metrics/compare/v1.23.2...v1.24.0) (2026-05-13)

### Features

* add @graphql-eslint/eslint-plugin for static query validation ([a74f3c5](https://github.com/Mearman/metrics/commit/a74f3c5a356d94bf615ded97786b64f1a172f403))

### Chores

* update pnpm-lock.yaml for graphql-eslint dependencies ([9caa687](https://github.com/Mearman/metrics/commit/9caa6876010199e7b4a1d30b6c265d23d81dbff3))

## [1.23.2](https://github.com/Mearman/metrics/compare/v1.23.1...v1.23.2) (2026-05-13)

### Bug Fixes

* align plugin config schemas with source.ts canonical schemas ([74ec22e](https://github.com/Mearman/metrics/commit/74ec22efed3c21cc9811392e7b38b932c56cc00f))

## [1.23.1](https://github.com/Mearman/metrics/compare/v1.23.0...v1.23.1) (2026-05-13)

### Bug Fixes

* remove unused $since variable from reactions PRs query ([d8d2e74](https://github.com/Mearman/metrics/commit/d8d2e747df8b125eafcc442836b8f057296ca49b))

## [1.23.0](https://github.com/Mearman/metrics/compare/v1.22.2...v1.23.0) (2026-05-13)

### Features

* show informational text for empty plugins ([81ca2b9](https://github.com/Mearman/metrics/commit/81ca2b9d73910d50927e75ade8401eafaf4c7d24))

## [1.22.2](https://github.com/Mearman/metrics/compare/v1.22.1...v1.22.2) (2026-05-13)

### Bug Fixes

* strip output/ prefix from gallery page paths ([33a98fb](https://github.com/Mearman/metrics/commit/33a98fbc8728a330b6a30ee2e1ed50b07738492d))

## [1.22.1](https://github.com/Mearman/metrics/compare/v1.22.0...v1.22.1) (2026-05-13)

### Documentation

* fix gallery page URL ([98c1bb9](https://github.com/Mearman/metrics/commit/98c1bb9e7942a0e0e0336ecfbd7f523a65bef06a))

## [1.22.0](https://github.com/Mearman/metrics/compare/v1.21.0...v1.22.0) (2026-05-13)

### Features

* generate index.html gallery page for browsing outputs ([9d8352d](https://github.com/Mearman/metrics/commit/9d8352d1273f89fb3fc2d25bf283593829717ffc))

## [1.21.0](https://github.com/Mearman/metrics/compare/v1.20.1...v1.21.0) (2026-05-13)

### Features

* per-plugin SVGs and preset combinations in default config ([47c1935](https://github.com/Mearman/metrics/commit/47c193514564034493ec1b8b2afd54546583537c))

## [1.20.1](https://github.com/Mearman/metrics/compare/v1.20.0...v1.20.1) (2026-05-13)

### Documentation

* remove stale counts from readme ([696e8ef](https://github.com/Mearman/metrics/commit/696e8ef2550571880f176a95956acd990ea2839e))

## [1.20.0](https://github.com/Mearman/metrics/compare/v1.19.0...v1.20.0) (2026-05-13)

### Features

* fetch-aware data caching with zero type assertions ([444e329](https://github.com/Mearman/metrics/commit/444e3293a312dca54d155e09a786f67938cb802e))

## [1.19.0](https://github.com/Mearman/metrics/compare/v1.18.1...v1.19.0) (2026-05-13)

### Features

* multiple outputs with per-output template/colours and data caching ([066833c](https://github.com/Mearman/metrics/commit/066833c8c4adc12c891e6ee4014c78e8229ed15f))

## [1.18.1](https://github.com/Mearman/metrics/compare/v1.18.0...v1.18.1) (2026-05-12)

### Refactoring

* **plugins:** rss — eliminate all type assertions and any from xml parsing ([5ff19cd](https://github.com/Mearman/metrics/commit/5ff19cdf18e6b359528f7ebccf29362ef22b3098))

## [1.18.0](https://github.com/Mearman/metrics/compare/v1.17.0...v1.18.0) (2026-05-12)

### Features

* **plugins:** add ignored option to contributors and reactions ([fc75d44](https://github.com/Mearman/metrics/commit/fc75d442509dcbcaa77cfc66100a1d26ffd06c70))

### Refactoring

* **plugins:** type all renderer configs with z.input<typeof> ([e5c6793](https://github.com/Mearman/metrics/commit/e5c67932ddb74d2487fcbe8e33d1d8bac008d683))

### Tests

* add 24 config option tests across 13 plugins ([83c0b86](https://github.com/Mearman/metrics/commit/83c0b86550aaffbc06002a64f7e616307d9c023a))

## [1.17.0](https://github.com/Mearman/metrics/compare/v1.16.0...v1.17.0) (2026-05-12)

### Features

* global users_ignored option, notable contribution types, reactions display ([c922aa7](https://github.com/Mearman/metrics/commit/c922aa713763c541f0ecd1bbbaa15b271dec364d))
* **plugins:** add customisation options to reactions, notable, projects ([724ed94](https://github.com/Mearman/metrics/commit/724ed94e34e6638788970c0aa6e8d408ab286174))

## [1.16.0](https://github.com/Mearman/metrics/compare/v1.15.0...v1.16.0) (2026-05-12)

### Features

* **plugins:** expand customisation options across 8 plugins ([76746ba](https://github.com/Mearman/metrics/commit/76746bae038e421e2731d0239211b1570dbfaf2f))

## [1.15.0](https://github.com/Mearman/metrics/compare/v1.14.1...v1.15.0) (2026-05-12)

### Features

* **plugins:** rss — fetch and display rss/atom feed items ([803f22e](https://github.com/Mearman/metrics/commit/803f22ea73934685910c3c5badb8531db6eeedf1))

## [1.14.1](https://github.com/Mearman/metrics/compare/v1.14.0...v1.14.1) (2026-05-12)

### Bug Fixes

* **api:** retry transient errors with exponential backoff ([3580d12](https://github.com/Mearman/metrics/commit/3580d129528e7b973456c1e275a216b304552028))

## [1.14.0](https://github.com/Mearman/metrics/compare/v1.13.5...v1.14.0) (2026-05-12)

### Features

* **config:** colour overrides, accessibility title, integration tests ([124fa42](https://github.com/Mearman/metrics/commit/124fa42a305f69910237a9f9edec3e221a842562))
* **output:** png output via resvg-js ([991452c](https://github.com/Mearman/metrics/commit/991452c4985a8a954ec76c7847cf0a810fcf2b33))

### Refactoring

* rename unit test files to .unit.test.ts convention ([4e27e93](https://github.com/Mearman/metrics/commit/4e27e93a99e5f2064a53f5ecfcb96cc05e40a387))

### Chores

* remove old test files after rename to .unit.test.ts ([5ba9ede](https://github.com/Mearman/metrics/commit/5ba9ede58df9afd7b0a1250461f03cb65a9282a8))

## [1.13.5](https://github.com/Mearman/metrics/compare/v1.13.4...v1.13.5) (2026-05-12)

### Documentation

* add full plugin config reference to readme ([c27583b](https://github.com/Mearman/metrics/commit/c27583ba287366073c1c79849c0671bce0a9aba4))

## [1.13.4](https://github.com/Mearman/metrics/compare/v1.13.3...v1.13.4) (2026-05-12)

### Bug Fixes

* **plugins:** correct skyline rotation centre y coordinate ([b42077b](https://github.com/Mearman/metrics/commit/b42077b496691b8c38ced36b4d6d17e9d24b5bbd))

## [1.13.3](https://github.com/Mearman/metrics/compare/v1.13.2...v1.13.3) (2026-05-12)

### Bug Fixes

* **plugins:** skyline smil animation instead of css ([8731c92](https://github.com/Mearman/metrics/commit/8731c92b24848b3051d782016979ebb912224044))

## [1.13.2](https://github.com/Mearman/metrics/compare/v1.13.1...v1.13.2) (2026-05-12)

### Bug Fixes

* **output:** cdata wrapper for style elements ([31aa72f](https://github.com/Mearman/metrics/commit/31aa72f604481b830ae30c06f94f91cc4a9fa4f2))

## [1.13.1](https://github.com/Mearman/metrics/compare/v1.13.0...v1.13.1) (2026-05-12)

### Bug Fixes

* **plugins:** skyline year support, animation, light theme, docs, cleanup ([4c8e772](https://github.com/Mearman/metrics/commit/4c8e772b4042adc6703663482c51f58adc6f8c5b))

## [1.13.0](https://github.com/Mearman/metrics/compare/v1.12.1...v1.13.0) (2026-05-12)

### Features

* **plugins:** skyline — 3D isometric contribution cityscape ([60f471d](https://github.com/Mearman/metrics/commit/60f471d43067bfeec95324312d67ad3c096c4fa3))

### CI

* enable skyline plugin in CI config ([905007d](https://github.com/Mearman/metrics/commit/905007d2188219525114856c554717460f0bdf6f))

## [1.12.1](https://github.com/Mearman/metrics/compare/v1.12.0...v1.12.1) (2026-05-12)

### Bug Fixes

* **plugins:** introduction name size and README config fix ([8777e6b](https://github.com/Mearman/metrics/commit/8777e6b1e357679b67dd9ffe1d40f6bb77b585c9))

## [1.12.0](https://github.com/Mearman/metrics/compare/v1.11.1...v1.12.0) (2026-05-12)

### Features

* **ci:** fork sync workflow and remove sync config ([4bf9bb6](https://github.com/Mearman/metrics/commit/4bf9bb6b6d3f1f3970fddb6ee1be7303d43acbf6))

## [1.11.1](https://github.com/Mearman/metrics/compare/v1.11.0...v1.11.1) (2026-05-12)

### Refactoring

* **config:** single source of truth for plugin schemas ([4902ff3](https://github.com/Mearman/metrics/commit/4902ff3b03b96ae7b9919f4479caec5fd82d0334))

## [1.11.0](https://github.com/Mearman/metrics/compare/v1.10.0...v1.11.0) (2026-05-12)

### Features

* **plugins:** explicit section ordering via config ([4802cc9](https://github.com/Mearman/metrics/commit/4802cc94fc9207e70b4e5f26ad1a748f7ed68f83))

## [1.10.0](https://github.com/Mearman/metrics/compare/v1.9.1...v1.10.0) (2026-05-12)

### Features

* **action:** full input surface for zero-config fork mode ([b695916](https://github.com/Mearman/metrics/commit/b695916e9caea134c5ce794c08055f51c5113542))

## [1.9.1](https://github.com/Mearman/metrics/compare/v1.9.0...v1.9.1) (2026-05-12)

### Bug Fixes

* **plugins:** visual polish — second pass ([439bb37](https://github.com/Mearman/metrics/commit/439bb37a4dd88cc04428784be2ea98a8fb633a7e))

## [1.9.0](https://github.com/Mearman/metrics/compare/v1.8.0...v1.9.0) (2026-05-12)

### Features

* **ci:** add robots.txt to output for noindex ([b762205](https://github.com/Mearman/metrics/commit/b7622051624c49b4a5367c96115e1d3f52c9ab95))

## [1.8.0](https://github.com/Mearman/metrics/compare/v1.7.0...v1.8.0) (2026-05-12)

### Features

* **loc:** clone caching and opt-in CI config ([e888e93](https://github.com/Mearman/metrics/commit/e888e93c18a9db777a5b03397a7fb69811426b8f))

## [1.7.0](https://github.com/Mearman/metrics/compare/v1.6.4...v1.7.0) (2026-05-12)

### Features

* reactions plugin now queries both issues and pull requests ([a101194](https://github.com/Mearman/metrics/commit/a101194b19b272a587631b4fcfe3294a4ab0df43))
* visual polish — legends, centring, bar radius ([beaff7f](https://github.com/Mearman/metrics/commit/beaff7f9b04b5a18ae8d17087ea0854bd3e7ac98))

## [1.6.4](https://github.com/Mearman/metrics/compare/v1.6.3...v1.6.4) (2026-05-12)

### CI

* scope METRICS_TOKEN to environment restricted to main ([651a910](https://github.com/Mearman/metrics/commit/651a9100d6e2e078bd2916cee81471658cc7c54d))

## [1.6.3](https://github.com/Mearman/metrics/compare/v1.6.2...v1.6.3) (2026-05-12)

### Bug Fixes

* reactions and contributors GraphQL field errors ([d7bb1d2](https://github.com/Mearman/metrics/commit/d7bb1d25288fc073e508b9b51df86c600386309d))

## [1.6.2](https://github.com/Mearman/metrics/compare/v1.6.1...v1.6.2) (2026-05-12)

### Documentation

* add repository filtering section to README ([f8e3619](https://github.com/Mearman/metrics/commit/f8e36199e2c2382c687ca8e0bd1a4c037597dfc4))

## [1.6.1](https://github.com/Mearman/metrics/compare/v1.6.0...v1.6.1) (2026-05-12)

### Tests

* add private repo filtering test for stargazers renderer ([c3fff0e](https://github.com/Mearman/metrics/commit/c3fff0e2765b3c875c47bb07ba73f72d352df91c))

## [1.6.0](https://github.com/Mearman/metrics/compare/v1.5.0...v1.6.0) (2026-05-12)

### Features

* renderer-level repo filtering for list plugins ([92a6fb8](https://github.com/Mearman/metrics/commit/92a6fb8bec4b91ff1043b711f11aef35b9d31d74))

## [1.5.0](https://github.com/Mearman/metrics/compare/v1.4.0...v1.5.0) (2026-05-12)

### Features

* wire repo filter into all 13 plugins (query level) ([43b75e8](https://github.com/Mearman/metrics/commit/43b75e8be330d5d6698561d24b892912c169d2b3))

## [1.4.0](https://github.com/Mearman/metrics/compare/v1.3.0...v1.4.0) (2026-05-12)

### Features

* add repository filtering engine ([13517c7](https://github.com/Mearman/metrics/commit/13517c7b34b0e089bd537cdf6b5849a4fdb39fdd))

## [1.3.0](https://github.com/Mearman/metrics/compare/v1.2.0...v1.3.0) (2026-05-12)

### Features

* add sponsors, sponsorships, and traffic plugins (27 total) ([7e4a670](https://github.com/Mearman/metrics/commit/7e4a67077c527ef61d5cce5898b7efed7aac74bd))

## [1.2.0](https://github.com/Mearman/metrics/compare/v1.1.0...v1.2.0) (2026-05-12)

### Features

* add Projects plugin — GitHub Projects v2 boards ([c7e6caa](https://github.com/Mearman/metrics/commit/c7e6caac8e51a3ad51a80e9ab87e77076e12ca9a))

## [1.1.0](https://github.com/Mearman/metrics/compare/v1.0.7...v1.1.0) (2026-05-12)

### Features

* add LoC plugin — actual lines of code by shallow-cloning repos ([0493300](https://github.com/Mearman/metrics/commit/0493300228416d26e96d7551901969c988df00fa))

## [1.0.7](https://github.com/Mearman/metrics/compare/v1.0.6...v1.0.7) (2026-05-12)

### Bug Fixes

* lines plugin — proportional bars, language colours, label alignment ([f09f081](https://github.com/Mearman/metrics/commit/f09f081732888d6dd264c866474b7ef577c929d6))

## [1.0.6](https://github.com/Mearman/metrics/compare/v1.0.5...v1.0.6) (2026-05-12)

### Bug Fixes

* place follow-up bar labels below bars with proper clearance ([622e0a9](https://github.com/Mearman/metrics/commit/622e0a96034c215fd038999f59a563f9fe165d02))

## [1.0.5](https://github.com/Mearman/metrics/compare/v1.0.4...v1.0.5) (2026-05-12)

### Bug Fixes

* overlap PR bar segments by 1px to eliminate anti-aliasing seam ([043703d](https://github.com/Mearman/metrics/commit/043703d579bf282ada1eb71ac62f54b8f376c5c3))

## [1.0.4](https://github.com/Mearman/metrics/compare/v1.0.3...v1.0.4) (2026-05-12)

### Bug Fixes

* place clipPath defs inside group for correct coordinate system ([2a1492e](https://github.com/Mearman/metrics/commit/2a1492e0bdf6acbee8f8594119df4ecedfc4be29))

## [1.0.3](https://github.com/Mearman/metrics/compare/v1.0.2...v1.0.3) (2026-05-12)

### Bug Fixes

* eliminate gap between stacked bar segments in Follow-up PRs ([d19b740](https://github.com/Mearman/metrics/commit/d19b740b411c5d379f8f5bb579d5f0c233b6e85a))

## [1.0.2](https://github.com/Mearman/metrics/compare/v1.0.1...v1.0.2) (2026-05-12)

### Bug Fixes

* widen notable org label columns to 90px ([453a4e1](https://github.com/Mearman/metrics/commit/453a4e1e953bc29314d6c657640a3632dd4be5ce))

## [1.0.1](https://github.com/Mearman/metrics/compare/v1.0.0...v1.0.1) (2026-05-12)

### Bug Fixes

* compose transforms instead of overwriting in pipeline offset ([18a2aca](https://github.com/Mearman/metrics/commit/18a2aca097c4cf9934909c779a009a1c2b2acd7d))

## 1.0.0 (2026-05-12)

### Features

* add code plugin and configurable font embedding (20 plugins) ([0db8403](https://github.com/Mearman/metrics/commit/0db8403c1db94fb74e81abb27b18642af261d0ab))
* add discussions, notable, and calendar plugins (16 total) ([a3f5943](https://github.com/Mearman/metrics/commit/a3f59435ecb54ad10fb457b0fdde3000241b4060))
* add introduction, reactions, and contributors plugins (19 total) ([35b9895](https://github.com/Mearman/metrics/commit/35b989584b6aceb09a9a1136e5943502732d4517))
* add isocalendar, habits, achievements, and lines plugins ([33a0a05](https://github.com/Mearman/metrics/commit/33a0a05e5cfe62370a5af5616e2b026722cf0b84))
* add languages plugin with stacked bar chart renderer ([27cb25e](https://github.com/Mearman/metrics/commit/27cb25ea9a7e45928a1371921f16ab7f143c8bac))
* add repositories and activity plugins (8 plugins total) ([9e6e127](https://github.com/Mearman/metrics/commit/9e6e12751d368f46331a5efc5c8701b5a3b5fee6))
* add section dividers, font embedding, and fix SVGO config ([3572f8a](https://github.com/Mearman/metrics/commit/3572f8ae852b259c2dbe3d8f61e7db8b38a72561))
* add stargazers, people, and gists plugins (13 total) ([78a4652](https://github.com/Mearman/metrics/commit/78a46523f154d582f1da577e04f2025c0c35718b))
* add tokenScope metadata to plugins and expand workflow permissions ([809e738](https://github.com/Mearman/metrics/commit/809e738d13467e557430d312fa93c76f8ba54c22))
* add topics and licenses plugins (22 total) ([475dbd5](https://github.com/Mearman/metrics/commit/475dbd55429d0d3a6050eaad5b92b45d4186f920))
* **config:** use cosmiconfig for config file discovery and parsing ([142c560](https://github.com/Mearman/metrics/commit/142c560fbf0e5e2c5294ef4b2710e11cefd4c16c))
* implement core pipeline — config → fetch → render → write ([95fe03d](https://github.com/Mearman/metrics/commit/95fe03d08b1c21806124c9e74db03d0eba52270c))
* scaffold project tooling and source structure ([a121cc6](https://github.com/Mearman/metrics/commit/a121cc624828a1bfaf16a2ad6cbf7a38a9f04990))
* shared text truncation and word-wrap utilities ([875d53c](https://github.com/Mearman/metrics/commit/875d53c916fa3a388271b8ff0c220af02fb58c20))
* wire pipeline end-to-end with plugin registry and layout engine ([827a986](https://github.com/Mearman/metrics/commit/827a9869be21941084ecec1fc08867238b4fcb38))

### Bug Fixes

* gracefully skip plugins that fail due to token permissions ([b35c92a](https://github.com/Mearman/metrics/commit/b35c92aa8dc7aa599264586322e64744acf1e333))
* inline avatar images as base64, fix empty bio, improve readability ([f77a63c](https://github.com/Mearman/metrics/commit/f77a63cc0cfd731682778ab87214a2fbe7ba5bcd))
* isocalendar fits within SVG width, add SVGO optimisation ([602c9d8](https://github.com/Mearman/metrics/commit/602c9d895867d6c9805cbd13aa68b0ddd6d30b29))
* left-align notable org labels to prevent clipping ([d395804](https://github.com/Mearman/metrics/commit/d395804ae16b42cca0d93e0c47b7d0a89f05acd4))
* pass repository owner as user in workflow ([c94a45e](https://github.com/Mearman/metrics/commit/c94a45ecb81a18672b9384c21bde8f54ec6a29c3))
* remove duplicate background rect and fix layout double-spacing ([f942c68](https://github.com/Mearman/metrics/commit/f942c68f25ae4b70681e72004b569b1778f752c9))
* remove restricted GraphQL fields from achievements plugin ([614aa47](https://github.com/Mearman/metrics/commit/614aa477dc528efff915d7de56c398568a7ae6f2))
* remove stale .tsbuildinfo output from turbo typecheck task ([06cedea](https://github.com/Mearman/metrics/commit/06cedeafccd3a84440b8ac109868ceed39fa7a85))
* require METRICS_TOKEN secret instead of falling back to github.token ([d67564a](https://github.com/Mearman/metrics/commit/d67564a424356eaa2cc679f39ea8ec2af25bfef1))
* resolve user from token when not configured ([0496433](https://github.com/Mearman/metrics/commit/049643355bcd402dcfcefe197ecf66d6421abe62))
* revert invalid read:user workflow permission ([4eeae82](https://github.com/Mearman/metrics/commit/4eeae825830aeb7bea52d716db8236bf91b3c4f4))
* truncate notable org names, add pnpm setup to release workflow ([97094f0](https://github.com/Mearman/metrics/commit/97094f0443bc60d87b9f437356f34c6374c3f9b7))
* update all GitHub Actions to latest versions and fix Pages deployment ([67a17c0](https://github.com/Mearman/metrics/commit/67a17c0c27a4c0ebc4e9d018834496385782dae2))
* widen notable contributions label area to 80px ([47ac8e9](https://github.com/Mearman/metrics/commit/47ac8e9202faf06b199452a411367f7b0fa20ea4))

### Refactoring

* rename src/index.ts to src/cli.ts, add no-reexports ESLint rule ([f4c28da](https://github.com/Mearman/metrics/commit/f4c28da66a1e717420640ffbb5a71e291e7dfa3d))
* zod validation for all GraphQL data sources ([aa5bb13](https://github.com/Mearman/metrics/commit/aa5bb1379a93815645d0858fb253c826f401dce6))
* zod validation for REST and GraphQL responses ([27201f1](https://github.com/Mearman/metrics/commit/27201f1b78e032d801b67939e12cac9f38a34633))

### Performance

* enable incremental typechecking with .tsbuildinfo ([566659c](https://github.com/Mearman/metrics/commit/566659c7606d5eebf4bddd39d1978d35f67d7d41))
* request size-optimised avatars from GitHub CDN ([404a612](https://github.com/Mearman/metrics/commit/404a612e6315ec8f0776bed019465861782bf991))

### Documentation

* add README with architecture and usage documentation ([d4ba5e7](https://github.com/Mearman/metrics/commit/d4ba5e78dc3d55580a2891c00723644de395f303))
* rewrite README to reflect current state and remove tokenScope ([17cd808](https://github.com/Mearman/metrics/commit/17cd808b9d1516d665a6b87b61f97d2f77d00f8d))
* update plugin table (10 done, 19 remaining) ([ee60180](https://github.com/Mearman/metrics/commit/ee60180efb4b552467782c445826510a9436f5cd))
* update plugin table (13 done, 14 remaining) ([43ca99c](https://github.com/Mearman/metrics/commit/43ca99cb5585ede71dc1b1107146be27265101ae))
* update plugin table (16 done, 11 remaining) ([b9caf8d](https://github.com/Mearman/metrics/commit/b9caf8db54192bd740a2ed242647b4905db0c0c8))

### Styles

* standardise zod import to lowercase `z` ([5b2427c](https://github.com/Mearman/metrics/commit/5b2427c12bb811f4d537f816248c5a40221c5cb0))

### Tests

* add 20 tests for introduction, reactions, contributors renderers ([7998a55](https://github.com/Mearman/metrics/commit/7998a551419ffeb0062d0d0e6d7281a8d847b8c6))
* add 24 new tests — renderers, themes, icons, pipeline ([d87d577](https://github.com/Mearman/metrics/commit/d87d577fa93b7ae171f3708c45597f491fab5b9d))
* add 33 tests for 8 more renderers (122 total) ([fff2924](https://github.com/Mearman/metrics/commit/fff29249096796b3276374785dc383dc4066264b))
* add 39 tests for core infrastructure ([87f043f](https://github.com/Mearman/metrics/commit/87f043f5bf3bc84296ca02c7678440975035ddc4))
* add inline-images tests (5 cases) ([0ccb9ae](https://github.com/Mearman/metrics/commit/0ccb9ae280a7897df5e51245e24a470880b8badd))

### Chores

* gitignore generated SVG output ([7ac5264](https://github.com/Mearman/metrics/commit/7ac5264c7915f054ebcc5b641f7840e86f27ca1c))
