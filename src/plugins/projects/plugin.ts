/**
 * Projects plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  ProjectsConfig,
  type ProjectsConfig as ProjectsConfigType,
  type ProjectsData,
  fetchProjects,
} from "./source.ts";
import { renderProjects } from "./render.ts";

export const projectsPlugin: Plugin<ProjectsConfigType, ProjectsData> = {
  id: "projects",
  source: {
    id: "projects",
    configSchema: ProjectsConfig,
    async fetch(ctx, config) {
      return await fetchProjects(ctx.api, ctx.user, config.limit);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderProjects(data, config, ctx);
    },
  },
};
