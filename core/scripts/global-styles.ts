import { minifyCSS } from "../Utilities";

const globalStyles = (async () => {
  let styles = "";
  const styleSheets = document.adoptedStyleSheets;
  let cssText = "";
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  //fetch any stylesheets from links that don't exist in styleSheets array hrefs
  const fetches = links
    .filter(
      (link) =>
        !styleSheets.find(
          (sheet) => sheet.href === (link as HTMLLinkElement).href,
        ),
    )
    .map((link) =>
      fetch((link as HTMLLinkElement).href).then((res) => res.text()),
    );
  for (const sheet of styleSheets) {
    for (let i = 0; i < sheet.cssRules.length; i++) {
      cssText += sheet.cssRules[i].cssText + "\n";
    }
  }
  await Promise.all(fetches).then((texts) => {
    cssText += texts.join("\n");
    styles = minifyCSS(cssText);
  });
  return styles;
})();

export { globalStyles };
