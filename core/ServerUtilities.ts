export function mapTypeScriptTypeToOpenApi(object: any): any {
  if (object === String) return { type: "string" };
  if (object === Number) return { type: "number" };
  if (object === Boolean) return { type: "boolean" };

  if (Array.isArray(object)) {
    const itemType = object[0];
    return {
      type: "array",
      items: mapTypeScriptTypeToOpenApi(itemType),
    };
  }
  return object;
}
