import { t as require_jsx_runtime } from "./jsx-runtime-DNksDsTP.js";
//#region src/lib/assets.ts
var WORDMARK_URL = `./logo/bay-wordmark.png`;
//#endregion
//#region src/components/BrandMark.tsx
var import_jsx_runtime = require_jsx_runtime();
function BrandMark({ className = "w-24", label = "Bay" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: WORDMARK_URL,
		alt: label,
		className: `h-auto object-contain ${className}`
	});
}
//#endregion
export { BrandMark as t };
