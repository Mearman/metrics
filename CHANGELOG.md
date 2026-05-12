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
