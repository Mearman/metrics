/**
 * Language detection from file extensions.
 *
 * Maps common file extensions to language names and colours.
 * Unknown extensions map to "Other" with a neutral colour.
 */

export interface LanguageDef {
  name: string;
  colour: string;
}

const extensions = new Map<string, LanguageDef>();

function add(ext: string, name: string, colour: string): void {
  extensions.set(ext, { name, colour });
}

// --- Common languages ---

add(".ts", "TypeScript", "#3178c6");
add(".tsx", "TypeScript", "#3178c6");
add(".js", "JavaScript", "#f1e05a");
add(".jsx", "JavaScript", "#f1e05a");
add(".mjs", "JavaScript", "#f1e05a");
add(".cjs", "JavaScript", "#f1e05a");

add(".py", "Python", "#3572a5");
add(".pyi", "Python", "#3572a5");

add(".rs", "Rust", "#dea584");
add(".go", "Go", "#00add8");
add(".rb", "Ruby", "#701516");
add(".java", "Java", "#b07219");
add(".kt", "Kotlin", "#a97bff");
add(".kts", "Kotlin", "#a97bff");
add(".scala", "Scala", "#c22d40");
add(".swift", "Swift", "#f05138");
add(".c", "C", "#555555");
add(".h", "C", "#555555");
add(".cpp", "C++", "#f34b7d");
add(".cc", "C++", "#f34b7d");
add(".cxx", "C++", "#f34b7d");
add(".hpp", "C++", "#f34b7d");
add(".cs", "C#", "#178600");
add(".m", "Objective-C", "#438eff");
add(".mm", "Objective-C++", "#6866fb");

add(".html", "HTML", "#e34c26");
add(".htm", "HTML", "#e34c26");
add(".css", "CSS", "#563d7c");
add(".scss", "SCSS", "#c6538c");
add(".sass", "Sass", "#a53b70");
add(".less", "Less", "#1e3c6c");
add(".svg", "SVG", "#ff9900");

add(".json", "JSON", "#292929");
add(".yaml", "YAML", "#cb171e");
add(".yml", "YAML", "#cb171e");
add(".toml", "TOML", "#9c4221");
add(".xml", "XML", "#0060ac");
add(".sql", "SQL", "#e38c00");

add(".sh", "Shell", "#89e051");
add(".bash", "Shell", "#89e051");
add(".zsh", "Shell", "#89e051");
add(".fish", "Shell", "#89e051");
add(".ps1", "PowerShell", "#012456");

add(".md", "Markdown", "#083fa1");
add(".rst", "reStructuredText", "#c7e030");
add(".tex", "TeX", "#3d6117");
add(".org", "Org", "#77aa99");

add(".lua", "Lua", "#000080");
add(".r", "R", "#198ce7");
add(".rkt", "Racket", "#3c5caa");
add(".hs", "Haskell", "#5e5086");
add(".elm", "Elm", "#60b5cc");
add(".erl", "Erlang", "#b83998");
add(".ex", "Elixir", "#6e4a7e");
add(".exs", "Elixir", "#6e4a7e");
add(".clj", "Clojure", "#db5855");
add(".cljs", "Clojure", "#db5855");
add(".dart", "Dart", "#00b4ab");
add(".zig", "Zig", "#ec915c");
add(".nim", "Nim", "#ffc200");
add(".v", "V", "#4f87c4");
add(".pl", "Perl", "#0298c3");
add(".pm", "Perl", "#0298c3");
add(".php", "PHP", "#4f5d95");
add(".t", "Perl", "#0298c3");

add(".vue", "Vue", "#41b883");
add(".svelte", "Svelte", "#ff3e00");

add(".cmake", "CMake", "#da3434");
add(".makefile", "Makefile", "#427819");
add(".dockerfile", "Dockerfile", "#384d54");

add(".proto", "Protocol Buffers", "#d8d8d8");
add(".graphql", "GraphQL", "#e10098");
add(".tf", "HCL", "#844fba");
add(".nix", "Nix", "#7e7eff");

// --- Binary / skip extensions ---

const skipExtensions = new Set([
  // Images
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".webp",
  ".bmp",
  ".tiff",
  ".svg",
  // Fonts
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  // Archives
  ".zip",
  ".gz",
  ".tar",
  ".rar",
  ".7z",
  ".bz2",
  ".xz",
  ".zst",
  // Binary data
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".sqlite",
  ".db",
  ".bin",
  ".dat",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".wasm",
  ".class",
  ".jar",
  ".war",
  // Lockfiles / generated
  ".lock",
  ".map",
  ".min.js",
  ".min.css",
]);

// --- Directories to skip ---

const skipDirs = new Set([
  ".git",
  "node_modules",
  "__pycache__",
  ".tox",
  "vendor",
  "dist",
  "build",
  "out",
  "target",
  ".gradle",
  ".mvn",
  ".next",
  ".nuxt",
  "coverage",
  ".cache",
  ".terraform",
  "bower_components",
]);

// --- Lookup ---

export function detectLanguage(filePath: string): LanguageDef {
  const dotIndex = filePath.lastIndexOf(".");
  if (dotIndex === -1) return { name: "Other", colour: "#8b949e" };

  const ext = filePath.slice(dotIndex).toLowerCase();
  const lang = extensions.get(ext);
  if (lang !== undefined) return lang;

  // Makefile / Dockerfile by basename
  const base = filePath
    .slice(Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\")) + 1)
    .toLowerCase();
  if (base === "makefile" || base === "gnumakefile")
    return { name: "Makefile", colour: "#427819" };
  if (base === "dockerfile") return { name: "Dockerfile", colour: "#384d54" };
  if (base === "cmakelists.txt") return { name: "CMake", colour: "#da3434" };

  return { name: "Other", colour: "#8b949e" };
}

export function shouldSkip(filePath: string): boolean {
  const dotIndex = filePath.lastIndexOf(".");
  if (dotIndex === -1) return false;
  return skipExtensions.has(filePath.slice(dotIndex).toLowerCase());
}

export function shouldSkipDir(dirName: string): boolean {
  return skipDirs.has(dirName);
}
