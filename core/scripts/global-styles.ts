import { minifyCSS } from "../Utilities";

const globalStyles: Promise<string> = (async () => {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  const cssContents = await Promise.all(
    links.map((link) =>
      fetch((link as HTMLLinkElement).href).then((r) => r.text()),
    ),
  );
  const cssResult = minifyCSS(cssContents.join("\n"));
  return cssResult;
})();

export { globalStyles };
