/**
 * Identity template tag for GraphQL queries.
 *
 * Used so that `@graphql-eslint` can extract and validate inline
 * queries from TypeScript source files. The tag is a no-op at
 * runtime — it returns the raw template string unchanged.
 *
 * @example
 * ```typescript
 * const query = gql`
 *   query($login: String!) {
 *     user(login: $login) { name }
 *   }
 * `;
 * ```
 */
function gql(strings: TemplateStringsArray): string {
  // TemplateStringsArray always has at least one element.
  // The indexed access returns string | undefined due to
  // noUncheckedIndexedAccess, but the value is guaranteed.
  const value: string | undefined = strings[0];
  if (value === undefined) {
    throw new Error("gql tag received empty template");
  }
  return value;
}
export { gql };
