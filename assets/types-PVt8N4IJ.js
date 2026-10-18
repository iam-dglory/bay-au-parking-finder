//#region src/types.ts
var SIGN_TYPE_LABELS = {
	FREE_UNLIMITED: "Free, no time limit",
	TIME_LIMITED: "Free, time limited",
	PAID_METER: "Paid / ticket parking",
	PERMIT_ONLY: "Permit holders only",
	NO_STOPPING_CLEARWAY: "No stopping (clearway)",
	LOADING_ZONE: "Loading zone",
	INFORMAL_TOLERATED: "Informally tolerated (no fixed rule)",
	ACCESSIBLE_PERMIT: "Accessible permit holders only"
};
var CURRENCY_OPTIONS = [
	{
		code: "USD",
		symbol: "$",
		label: "USD ($)"
	},
	{
		code: "AUD",
		symbol: "A$",
		label: "AUD (A$)"
	},
	{
		code: "INR",
		symbol: "₹",
		label: "INR (₹)"
	},
	{
		code: "EUR",
		symbol: "€",
		label: "EUR (€)"
	},
	{
		code: "GBP",
		symbol: "£",
		label: "GBP (£)"
	}
];
//#endregion
export { SIGN_TYPE_LABELS as n, CURRENCY_OPTIONS as t };
