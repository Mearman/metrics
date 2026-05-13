/**
 * Mock data registry — maps plugin IDs to placeholder data.
 *
 * Used when the output config includes a plugin ID in its `mock` array.
 * The pipeline skips the fetch step and uses the registered mock data.
 *
 * Each plugin's mock data lives in mock-data.ts for co-location.
 * This registry maps plugin IDs to the correct export.
 */

import * as mock from "./mock-data.ts";

const registry = new Map<string, unknown>([
  ["base", mock.base],
  ["isocalendar", mock.isocalendar],
  ["languages", mock.languages],
  ["habits", mock.habits],
  ["achievements", mock.achievements],
  ["lines", mock.lines],
  ["repositories", mock.repositories],
  ["activity", mock.activity],
  ["stars", mock.stars],
  ["followup", mock.followup],
  ["stargazers", mock.stargazers],
  ["people", mock.people],
  ["gists", mock.gists],
  ["discussions", mock.discussions],
  ["notable", mock.notable],
  ["calendar", mock.calendar],
  ["introduction", mock.introduction],
  ["reactions", mock.reactions],
  ["contributors", mock.contributors],
  ["code", mock.code],
  ["topics", mock.topics],
  ["licenses", mock.licenses],
  ["loc", mock.loc],
  ["projects", mock.projects],
  ["sponsors", mock.sponsors],
  ["sponsorships", mock.sponsorships],
  ["traffic", mock.traffic],
  ["skyline", mock.skyline],
  ["rss", mock.rss],
]);

/**
 * Look up mock data for a plugin.
 * @returns mock data, or undefined if not registered
 */
export function getMockData(pluginId: string): unknown {
  return registry.get(pluginId);
}
