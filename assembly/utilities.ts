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

export function minifyCSS(css: string): string {
  let result = "";
  let inComment = false;

  for (let i = 0; i < css.length; i++) {
    const char = css.charAt(i);

    // Handle comments
    if (inComment) {
      if (char === "*" && css.charAt(i + 1) === "/") {
        inComment = false;
        i++; // Skip the '/'
      }
      continue;
    } else if (char === "/" && css.charAt(i + 1) === "*") {
      inComment = true;
      i++; // Skip the '*'
      continue;
    }

    // Handle spaces and symbols
    if (char === " " || char === "\n" || char === "\r" || char === "\t") {
      if (
        result.length > 0 &&
        " {}:;,.".includes(result.charAt(result.length - 1))
      ) {
        continue; // Skip unnecessary spaces
      }
      result += " ";
    } else {
      result += char;
    }
  }

  return result.trim();
}
