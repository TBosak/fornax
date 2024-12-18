// Namespace: Utilities

  export function toKebabCase(str: string): string {
    let result = "";
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      if (char >= "A" && char <= "Z") {
        if (i > 0) result += "-"; // Add dash before uppercase letter
        result += char.toLowerCase();
      } else {
        result += char;
      }
    }
    return result;
  }

  export function toCamelCase(str: string): string {
    let result = "";
    let capitalizeNext = false;
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      if (char == "-") {
        capitalizeNext = true;
      } else {
        result += capitalizeNext ? char.toUpperCase() : char;
        capitalizeNext = false;
      }
    }
    return result;
  }