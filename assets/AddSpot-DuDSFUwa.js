import { a as __toESM, n as createLucideIcon, r as require_react, t as require_jsx_runtime } from "./jsx-runtime-DNksDsTP.js";
import { n as RotateCcw, t as MapView } from "./MapView-DLwO5otf.js";
import { t as X } from "./x-BoaH4iK3.js";
import { n as supabase } from "./supabaseClient-q-CJkvTi.js";
import { t as detectCountry } from "./geocoding-0qqHm9ht.js";
import { i as registerPlugin, n as CapacitorException, r as WebPlugin } from "./dist-D4wSOMdX.js";
import { n as getSignOptionsForCountry, r as hasLocalPreset, t as getDefaultCurrency } from "./countrySignPresets-C4Tn47vk.js";
import { t as CURRENCY_OPTIONS } from "./types-PVt8N4IJ.js";
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/camera.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "camera",
	size: 24,
	node: [["path", {
		d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",
		key: "18u6gg"
	}], ["circle", {
		cx: "12",
		cy: "13",
		r: "3",
		key: "1vg3eu"
	}]]
};
__iconData.node;
var Camera$2 = createLucideIcon(__iconData);
//#endregion
//#region ../bay-audit-4/node_modules/@capacitor/camera/dist/esm/definitions.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* @deprecated This enum is only meant to be used for deprecated `getPhoto` method.
* It will be removed in a future major version of the plugin, along with `getPhoto`.
*/
var CameraSource;
(function(CameraSource) {
	/**
	* Prompts the user to select either the photo album or take a photo.
	*/
	CameraSource["Prompt"] = "PROMPT";
	/**
	* Take a new photo using the camera.
	*/
	CameraSource["Camera"] = "CAMERA";
	/**
	* Pick an existing photo from the gallery or photo album.
	*/
	CameraSource["Photos"] = "PHOTOS";
})(CameraSource || (CameraSource = {}));
var CameraDirection;
(function(CameraDirection) {
	CameraDirection["Rear"] = "REAR";
	CameraDirection["Front"] = "FRONT";
})(CameraDirection || (CameraDirection = {}));
/**
* @deprecated This enum is only meant to be used for `ImageOptions` in deprecated `getPhoto` method.
* It will be removed in a future major version of the plugin, along with `getPhoto`.
*/
var CameraResultType;
(function(CameraResultType) {
	CameraResultType["Uri"] = "uri";
	CameraResultType["Base64"] = "base64";
	CameraResultType["DataUrl"] = "dataUrl";
})(CameraResultType || (CameraResultType = {}));
var MediaType;
(function(MediaType) {
	MediaType[MediaType["Photo"] = 0] = "Photo";
	MediaType[MediaType["Video"] = 1] = "Video";
})(MediaType || (MediaType = {}));
var MediaTypeSelection;
(function(MediaTypeSelection) {
	MediaTypeSelection[MediaTypeSelection["Photo"] = 0] = "Photo";
	MediaTypeSelection[MediaTypeSelection["Video"] = 1] = "Video";
	MediaTypeSelection[MediaTypeSelection["All"] = 2] = "All";
})(MediaTypeSelection || (MediaTypeSelection = {}));
var EncodingType;
(function(EncodingType) {
	EncodingType[EncodingType["JPEG"] = 0] = "JPEG";
	EncodingType[EncodingType["PNG"] = 1] = "PNG";
})(EncodingType || (EncodingType = {}));
/**
* Error codes returned by the Camera plugin.
* These values match the `code` field on rejected promises.
*
* @since 8.2.0
*/
var CameraErrorCode;
(function(CameraErrorCode) {
	/**
	* Camera access was denied by the user.
	*/
	CameraErrorCode["CameraPermissionDenied"] = "OS-PLUG-CAMR-0003";
	/**
	* Photo library / gallery access was denied by the user.
	*/
	CameraErrorCode["GalleryPermissionDenied"] = "OS-PLUG-CAMR-0005";
	/**
	* No camera hardware is available on the device.
	*/
	CameraErrorCode["NoCameraAvailable"] = "OS-PLUG-CAMR-0007";
	/**
	* The user cancelled the take photo action.
	*/
	CameraErrorCode["TakePhotoCancelled"] = "OS-PLUG-CAMR-0006";
	/**
	* Failed to take photo.
	*/
	CameraErrorCode["TakePhotoFailed"] = "OS-PLUG-CAMR-0010";
	/**
	* The take photo action received invalid arguments.
	* @platform ios
	*/
	CameraErrorCode["TakePhotoInvalidArguments"] = "OS-PLUG-CAMR-0014";
	/**
	* The selected file contains invalid image data.
	* @platform ios
	*/
	CameraErrorCode["InvalidImageData"] = "OS-PLUG-CAMR-0008";
	/**
	* Failed to edit image.
	*/
	CameraErrorCode["EditPhotoFailed"] = "OS-PLUG-CAMR-0009";
	/**
	* The user cancelled the edit photo action.
	*/
	CameraErrorCode["EditPhotoCancelled"] = "OS-PLUG-CAMR-0013";
	/**
	* The URI parameter for editing is empty.
	* @platform android
	*/
	CameraErrorCode["EditPhotoEmptyUri"] = "OS-PLUG-CAMR-0024";
	/**
	* Failed to retrieve an image from the gallery.
	*/
	CameraErrorCode["ImageNotFound"] = "OS-PLUG-CAMR-0011";
	/**
	* Failed to process the selected image.
	*/
	CameraErrorCode["ProcessImageFailed"] = "OS-PLUG-CAMR-0012";
	/**
	* Failed to choose media from the gallery.
	*/
	CameraErrorCode["ChooseMediaFailed"] = "OS-PLUG-CAMR-0018";
	/**
	* The user cancelled choosing media from the gallery.
	*/
	CameraErrorCode["ChooseMediaCancelled"] = "OS-PLUG-CAMR-0020";
	/**
	* Failed to retrieve the media file path.
	* @platform android
	*/
	CameraErrorCode["MediaPathError"] = "OS-PLUG-CAMR-0021";
	/**
	* Failed to retrieve an image from the provided URI.
	*/
	CameraErrorCode["FetchImageFromUriFailed"] = "OS-PLUG-CAMR-0028";
	/**
	* Failed to record video.
	*/
	CameraErrorCode["RecordVideoFailed"] = "OS-PLUG-CAMR-0016";
	/**
	* The user cancelled the video recording.
	*/
	CameraErrorCode["RecordVideoCancelled"] = "OS-PLUG-CAMR-0017";
	/**
	* Failed to retrieve a video from the gallery.
	* @platform ios
	*/
	CameraErrorCode["VideoNotFound"] = "OS-PLUG-CAMR-0025";
	/**
	* Failed to play video.
	*/
	CameraErrorCode["PlayVideoFailed"] = "OS-PLUG-CAMR-0023";
	/**
	* Failed to encode the media result.
	* @platform ios
	*/
	CameraErrorCode["EncodeResultFailed"] = "OS-PLUG-CAMR-0019";
	/**
	* The selected file does not exist.
	*/
	CameraErrorCode["FileNotFound"] = "OS-PLUG-CAMR-0027";
	/**
	* Invalid argument provided to a plugin method.
	* @platform android
	*/
	CameraErrorCode["InvalidArgument"] = "OS-PLUG-CAMR-0031";
	/**
	* A general plugin error occurred.
	* @platform ios
	*/
	CameraErrorCode["GeneralError"] = "OS-PLUG-CAMR-0026";
})(CameraErrorCode || (CameraErrorCode = {}));
//#endregion
//#region ../bay-audit-4/node_modules/@capacitor/camera/dist/esm/web.js
var CameraWeb = class extends WebPlugin {
	async takePhoto(options) {
		return new Promise(async (resolve, reject) => {
			if (options.webUseInput) this.takePhotoCameraInputExperience(options, resolve, reject);
			else this.takePhotoCameraExperience(options, resolve, reject);
		});
	}
	async recordVideo(_options) {
		throw this.unimplemented("recordVideo is not implemented on Web.");
	}
	async playVideo(_options) {
		throw this.unimplemented("playVideo is not implemented on Web.");
	}
	async chooseFromGallery(options) {
		return new Promise(async (resolve, reject) => {
			this.galleryInputExperience(options, resolve, reject);
		});
	}
	async editPhoto(_options) {
		throw this.unimplemented("editPhoto is not implemented on Web.");
	}
	async editURIPhoto(_options) {
		throw this.unimplemented("editURIPhoto is not implemented on Web.");
	}
	async getPhoto(options) {
		return new Promise(async (resolve, reject) => {
			if (options.webUseInput || options.source === CameraSource.Photos) this.fileInputExperience(options, resolve, reject);
			else if (options.source === CameraSource.Prompt) {
				let actionSheet = document.querySelector("pwa-action-sheet");
				if (!actionSheet) {
					actionSheet = document.createElement("pwa-action-sheet");
					document.body.appendChild(actionSheet);
				}
				actionSheet.header = options.promptLabelHeader || "Photo";
				actionSheet.cancelable = false;
				actionSheet.options = [{ title: options.promptLabelPhoto || "From Photos" }, { title: options.promptLabelPicture || "Take Picture" }];
				actionSheet.addEventListener("onSelection", async (e) => {
					if (e.detail === 0) this.fileInputExperience(options, resolve, reject);
					else this.cameraExperience(options, resolve, reject);
				});
			} else this.cameraExperience(options, resolve, reject);
		});
	}
	async pickImages(_options) {
		return new Promise(async (resolve, reject) => {
			this.multipleFileInputExperience(resolve, reject);
		});
	}
	async cameraExperience(options, resolve, reject) {
		await this._setupPWACameraModal(options.direction, (photo) => this._getCameraPhoto(photo, options), () => this.fileInputExperience(options, resolve, reject), resolve, reject);
	}
	fileInputExperience(options, resolve, reject) {
		let input = document.querySelector("#_capacitor-camera-input");
		const cleanup = () => {
			var _a;
			(_a = input.parentNode) === null || _a === void 0 || _a.removeChild(input);
		};
		if (!input) {
			input = document.createElement("input");
			input.id = "_capacitor-camera-input";
			input.type = "file";
			input.hidden = true;
			document.body.appendChild(input);
			input.addEventListener("change", (_e) => {
				const file = input.files[0];
				let format = "jpeg";
				if (file.type === "image/png") format = "png";
				else if (file.type === "image/gif") format = "gif";
				if (options.resultType === "dataUrl" || options.resultType === "base64") {
					const reader = new FileReader();
					reader.addEventListener("load", () => {
						if (options.resultType === "dataUrl") resolve({
							dataUrl: reader.result,
							format
						});
						else if (options.resultType === "base64") {
							const b64 = reader.result.split(",")[1];
							resolve({
								base64String: b64,
								format
							});
						}
						cleanup();
					});
					reader.readAsDataURL(file);
				} else {
					resolve({
						webPath: URL.createObjectURL(file),
						format
					});
					cleanup();
				}
			});
			input.addEventListener("cancel", (_e) => {
				reject(new CapacitorException("User cancelled photos app"));
				cleanup();
			});
		}
		input.accept = "image/*";
		input.capture = true;
		if (options.source === CameraSource.Photos || options.source === CameraSource.Prompt) input.removeAttribute("capture");
		else if (options.direction === CameraDirection.Front) input.capture = "user";
		else if (options.direction === CameraDirection.Rear) input.capture = "environment";
		input.click();
	}
	multipleFileInputExperience(resolve, reject) {
		let input = document.querySelector("#_capacitor-camera-input-multiple");
		const cleanup = () => {
			var _a;
			(_a = input.parentNode) === null || _a === void 0 || _a.removeChild(input);
		};
		if (!input) {
			input = document.createElement("input");
			input.id = "_capacitor-camera-input-multiple";
			input.type = "file";
			input.hidden = true;
			input.multiple = true;
			document.body.appendChild(input);
			input.addEventListener("change", (_e) => {
				const photos = [];
				for (let i = 0; i < input.files.length; i++) {
					const file = input.files[i];
					let format = "jpeg";
					if (file.type === "image/png") format = "png";
					else if (file.type === "image/gif") format = "gif";
					photos.push({
						webPath: URL.createObjectURL(file),
						format
					});
				}
				resolve({ photos });
				cleanup();
			});
			input.addEventListener("cancel", (_e) => {
				reject(new CapacitorException("User cancelled photos app"));
				cleanup();
			});
		}
		input.accept = "image/*";
		input.click();
	}
	_getCameraPhoto(photo, options) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			const format = this._getFileFormat(photo);
			if (options.resultType === "uri") resolve({
				webPath: URL.createObjectURL(photo),
				format,
				saved: false
			});
			else {
				reader.readAsDataURL(photo);
				reader.onloadend = () => {
					const r = reader.result;
					if (options.resultType === "dataUrl") resolve({
						dataUrl: r,
						format,
						saved: false
					});
					else resolve({
						base64String: r.split(",")[1],
						format,
						saved: false
					});
				};
				reader.onerror = (e) => {
					reject(e);
				};
			}
		});
	}
	async takePhotoCameraExperience(options, resolve, reject) {
		await this._setupPWACameraModal(options.cameraDirection, (photo) => {
			var _a;
			return this._buildPhotoMediaResult(photo, (_a = options.includeMetadata) !== null && _a !== void 0 ? _a : false);
		}, () => this.takePhotoCameraInputExperience(options, resolve, reject), resolve, reject);
	}
	takePhotoCameraInputExperience(options, resolve, reject) {
		const input = this._createFileInput("_capacitor-camera-input-takephoto");
		const cleanup = () => {
			var _a;
			(_a = input.parentNode) === null || _a === void 0 || _a.removeChild(input);
		};
		input.onchange = async (_e) => {
			var _a;
			if (!this._validateFileInput(input, reject, cleanup)) return;
			const file = input.files[0];
			resolve(await this._buildPhotoMediaResult(file, (_a = options.includeMetadata) !== null && _a !== void 0 ? _a : false));
			cleanup();
		};
		input.oncancel = () => {
			reject(new CapacitorException("User cancelled photos app"));
			cleanup();
		};
		input.accept = "image/*";
		if (options.cameraDirection === CameraDirection.Front) input.capture = "user";
		else input.capture = "environment";
		input.click();
	}
	galleryInputExperience(options, resolve, reject) {
		var _a, _b;
		const input = this._createFileInput("_capacitor-camera-input-gallery");
		input.multiple = (_a = options.allowMultipleSelection) !== null && _a !== void 0 ? _a : false;
		const cleanup = () => {
			var _a;
			(_a = input.parentNode) === null || _a === void 0 || _a.removeChild(input);
		};
		input.onchange = async (_e) => {
			var _a;
			if (!this._validateFileInput(input, reject, cleanup)) return;
			const results = [];
			for (let i = 0; i < input.files.length; i++) {
				const file = input.files[i];
				if (file.type.startsWith("image/")) results.push(await this._buildPhotoMediaResult(file, (_a = options.includeMetadata) !== null && _a !== void 0 ? _a : false));
				else if (file.type.startsWith("video/")) {
					const format = this._getFileFormat(file);
					let thumbnail;
					let resolution;
					let duration;
					try {
						const videoInfo = await this._getVideoMetadata(file);
						thumbnail = videoInfo.thumbnail;
						if (options.includeMetadata) {
							resolution = videoInfo.resolution;
							duration = videoInfo.duration;
						}
					} catch (e) {
						console.warn("Failed to get video metadata:", e);
					}
					const result = {
						type: MediaType.Video,
						thumbnail,
						webPath: URL.createObjectURL(file),
						saved: false
					};
					if (options.includeMetadata) result.metadata = {
						format,
						resolution,
						size: file.size,
						creationDate: new Date(file.lastModified).toISOString(),
						duration
					};
					results.push(result);
				}
			}
			resolve({ results });
			cleanup();
		};
		input.oncancel = () => {
			reject(new CapacitorException("User cancelled photos app"));
			cleanup();
		};
		const mediaType = (_b = options.mediaType) !== null && _b !== void 0 ? _b : MediaTypeSelection.Photo;
		if (mediaType === MediaTypeSelection.Photo) input.accept = "image/*";
		else if (mediaType === MediaTypeSelection.Video) input.accept = "video/*";
		else input.accept = "image/*,video/*";
		input.click();
	}
	_getFileFormat(file) {
		if (file.type === "image/png") return "png";
		else if (file.type === "image/gif") return "gif";
		else if (file.type.startsWith("video/")) return file.type.split("/")[1];
		else if (file.type.startsWith("image/")) return "jpeg";
		return file.type.split("/")[1] || "jpeg";
	}
	async _buildPhotoMediaResult(file, includeMetadata) {
		const format = this._getFileFormat(file);
		const thumbnail = await this._getBase64FromFile(file);
		const result = {
			type: MediaType.Photo,
			thumbnail,
			webPath: URL.createObjectURL(file),
			saved: false
		};
		if (includeMetadata) result.metadata = {
			format,
			resolution: await this._getImageResolution(file),
			size: file.size,
			creationDate: "lastModified" in file ? new Date(file.lastModified).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
		};
		return result;
	}
	_validateFileInput(input, reject, cleanup) {
		if (!input.files || input.files.length === 0) {
			const message = input.multiple ? "No files selected" : "No file selected";
			reject(new CapacitorException(message));
			cleanup();
			return false;
		}
		return true;
	}
	async _setupPWACameraModal(cameraDirection, onPhotoCallback, fallbackCallback, resolve, reject) {
		if (customElements.get("pwa-camera-modal")) {
			const cameraModal = document.createElement("pwa-camera-modal");
			cameraModal.facingMode = cameraDirection === CameraDirection.Front ? "user" : "environment";
			document.body.appendChild(cameraModal);
			try {
				await cameraModal.componentOnReady();
				cameraModal.addEventListener("onPhoto", async (e) => {
					const photo = e.detail;
					if (photo === null) reject(new CapacitorException("User cancelled photos app"));
					else if (photo instanceof Error) reject(photo);
					else resolve(await onPhotoCallback(photo));
					cameraModal.dismiss();
					document.body.removeChild(cameraModal);
				});
				cameraModal.present();
			} catch (e) {
				fallbackCallback();
			}
		} else {
			console.error(`Unable to load PWA Element 'pwa-camera-modal'. See the docs: https://capacitorjs.com/docs/web/pwa-elements.`);
			fallbackCallback();
		}
	}
	_createFileInput(id) {
		let input = document.querySelector(`#${id}`);
		if (!input) {
			input = document.createElement("input");
			input.id = id;
			input.type = "file";
			input.hidden = true;
			document.body.appendChild(input);
		}
		return input;
	}
	async _getImageResolution(image) {
		try {
			const bitmap = await createImageBitmap(image);
			const resolution = `${bitmap.width}x${bitmap.height}`;
			bitmap.close();
			return resolution;
		} catch (e) {
			console.warn("Failed to get image resolution:", e);
			return;
		}
	}
	_getBase64FromFile(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64 = reader.result.split(",")[1];
				resolve(base64);
			};
			reader.onerror = (e) => {
				reject(e);
			};
			reader.readAsDataURL(file);
		});
	}
	_getVideoMetadata(videoFile) {
		return new Promise((resolve) => {
			const video = document.createElement("video");
			video.preload = "metadata";
			video.muted = true;
			video.onloadedmetadata = () => {
				const seekTime = Math.min(1, video.duration * .1);
				video.currentTime = seekTime;
			};
			video.onseeked = () => {
				const result = {
					resolution: `${video.videoWidth}x${video.videoHeight}`,
					duration: video.duration
				};
				try {
					const canvas = document.createElement("canvas");
					canvas.width = video.videoWidth;
					canvas.height = video.videoHeight;
					const ctx = canvas.getContext("2d");
					if (ctx) {
						ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
						result.thumbnail = canvas.toDataURL("image/jpeg", .8).split(",")[1];
					}
				} catch (e) {
					console.warn("Failed to generate video thumbnail:", e);
				}
				URL.revokeObjectURL(video.src);
				resolve(result);
			};
			video.onerror = () => {
				URL.revokeObjectURL(video.src);
				resolve({});
			};
			video.src = URL.createObjectURL(videoFile);
		});
	}
	async checkPermissions() {
		if (typeof navigator === "undefined" || !navigator.permissions) throw this.unavailable("Permissions API not available in this browser");
		try {
			return {
				camera: (await window.navigator.permissions.query({ name: "camera" })).state,
				photos: "granted"
			};
		} catch (_a) {
			throw this.unavailable("Camera permissions are not available in this browser");
		}
	}
	async requestPermissions() {
		throw this.unimplemented("Not implemented on web.");
	}
	async pickLimitedLibraryPhotos() {
		throw this.unavailable("Not implemented on web.");
	}
	async getLimitedLibraryPhotos() {
		throw this.unavailable("Not implemented on web.");
	}
};
new CameraWeb();
//#endregion
//#region ../bay-audit-4/node_modules/@capacitor/camera/dist/esm/index.js
var Camera = registerPlugin("Camera", { web: () => new CameraWeb() });
//#endregion
//#region src/lib/photos.ts
/** Opens the device camera (or, on web, the browser's file/camera picker) and
* returns the captured image ready to preview and upload. Returns null if the
* user cancels, which is not an error, just "didn't take a photo yet". */
async function captureSignPhoto(promptHeader = "Photo of the sign") {
	try {
		const photo = await Camera.getPhoto({
			resultType: CameraResultType.DataUrl,
			source: CameraSource.Prompt,
			quality: 70,
			promptLabelHeader: promptHeader,
			promptLabelPhoto: "Choose from gallery",
			promptLabelPicture: "Take photo"
		});
		if (!photo.dataUrl) return null;
		const blob = await (await fetch(photo.dataUrl)).blob();
		return {
			previewUrl: photo.dataUrl,
			blob
		};
	} catch {
		return null;
	}
}
/** Uploads a captured sign photo and returns its public URL. */
async function uploadSignPhoto(photo) {
	const path = `${crypto.randomUUID()}.jpg`;
	const { error } = await supabase.storage.from("sign-photos").upload(path, photo.blob, { contentType: "image/jpeg" });
	if (error) throw error;
	return supabase.storage.from("sign-photos").getPublicUrl(path).data.publicUrl;
}
//#endregion
//#region src/components/ReportSpotForm.tsx
var import_jsx_runtime = require_jsx_runtime();
var DAYS = [
	{
		value: 1,
		label: "Mon"
	},
	{
		value: 2,
		label: "Tue"
	},
	{
		value: 3,
		label: "Wed"
	},
	{
		value: 4,
		label: "Thu"
	},
	{
		value: 5,
		label: "Fri"
	},
	{
		value: 6,
		label: "Sat"
	},
	{
		value: 0,
		label: "Sun"
	}
];
/** Common Australian max-stay durations — signs go as short as "15 MIN" outside shops. */
var MAX_STAY_PRESETS_HOURS = [
	.25,
	.5,
	1,
	2,
	4
];
var KNOWN_COUNTRIES = [
	"Australia",
	"India",
	"United States",
	"United Kingdom"
];
var ALWAYS_FREE_TYPES = ["FREE_UNLIMITED", "INFORMAL_TOLERATED"];
function formatMaxStay(hours) {
	if (hours < 1) return `${hours * 60} min`;
	return hours === 1 ? "1h" : `${hours}h`;
}
function summarizeRule(rule, label) {
	return `${label} · ${rule.daysActive.length === 7 ? "every day" : DAYS.filter((d) => rule.daysActive.includes(d.value)).map((d) => d.label).join(" ")}${rule.timeFrom && rule.timeTo && !(rule.timeFrom === "00:00" && rule.timeTo === "23:59") ? ` ${rule.timeFrom}–${rule.timeTo}` : ""}${rule.maxStayMinutes ? ` · max ${formatMaxStay(rule.maxStayMinutes / 60)}` : ""}`;
}
function ReportSpotForm({ country, onCountryChange, onSubmit, submitting }) {
	const [addressText, setAddressText] = (0, import_react.useState)("");
	const [signType, setSignType] = (0, import_react.useState)(null);
	const [hasMaxStay, setHasMaxStay] = (0, import_react.useState)(false);
	const [maxStayHours, setMaxStayHours] = (0, import_react.useState)(2);
	const [daysActive, setDaysActive] = (0, import_react.useState)([
		1,
		2,
		3,
		4,
		5
	]);
	const [timeFrom, setTimeFrom] = (0, import_react.useState)("08:30");
	const [timeTo, setTimeTo] = (0, import_react.useState)("18:00");
	const [pricePerHour, setPricePerHour] = (0, import_react.useState)(5);
	const [currency, setCurrency] = (0, import_react.useState)(() => getDefaultCurrency(country));
	const [allDay, setAllDay] = (0, import_react.useState)(false);
	const [notes, setNotes] = (0, import_react.useState)("");
	const [savedRules, setSavedRules] = (0, import_react.useState)([]);
	const [photo, setPhoto] = (0, import_react.useState)(null);
	const [capturingPhoto, setCapturingPhoto] = (0, import_react.useState)(false);
	async function handleCapturePhoto() {
		setCapturingPhoto(true);
		const captured = await captureSignPhoto();
		if (captured) setPhoto(captured);
		setCapturingPhoto(false);
	}
	(0, import_react.useEffect)(() => {
		setCurrency(getDefaultCurrency(country));
	}, [country]);
	const signOptions = getSignOptionsForCountry(country);
	const isAlwaysFree = signType ? ALWAYS_FREE_TYPES.includes(signType) : false;
	const needsTimeWindow = signType && !isAlwaysFree;
	const maxStayRequired = signType === "TIME_LIMITED";
	const maxStayOptional = signType === "PAID_METER";
	const showMaxStayInput = maxStayRequired || maxStayOptional && hasMaxStay;
	const needsPrice = signType === "PAID_METER";
	function toggleDay(d) {
		setDaysActive((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
	}
	function resetRuleFields() {
		setSignType(null);
		setHasMaxStay(false);
		setMaxStayHours(2);
		setDaysActive([
			1,
			2,
			3,
			4,
			5
		]);
		setTimeFrom("08:30");
		setTimeTo("18:00");
		setPricePerHour(5);
		setAllDay(false);
		setNotes("");
	}
	function currentRuleAsInput() {
		if (!signType) return null;
		return {
			signType,
			maxStayMinutes: showMaxStayInput ? maxStayHours * 60 : null,
			daysActive: isAlwaysFree || allDay ? [
				0,
				1,
				2,
				3,
				4,
				5,
				6
			] : daysActive,
			timeFrom: needsTimeWindow && !allDay ? timeFrom : isAlwaysFree ? null : "00:00",
			timeTo: needsTimeWindow && !allDay ? timeTo : isAlwaysFree ? null : "23:59",
			pricePerHour: needsPrice ? pricePerHour : null,
			currency: needsPrice ? currency : null,
			notes: notes || null
		};
	}
	function handleAddAnotherPeriod() {
		const rule = currentRuleAsInput();
		if (!rule) return;
		setSavedRules((prev) => [...prev, rule]);
		resetRuleFields();
	}
	function removeSavedRule(index) {
		setSavedRules((prev) => prev.filter((_, i) => i !== index));
	}
	function handleSubmit() {
		const current = currentRuleAsInput();
		const rules = current ? [...savedRules, current] : savedRules;
		if (!addressText.trim() || rules.length === 0 || !photo) return;
		onSubmit({
			addressText: addressText.trim(),
			rules,
			photo
		});
	}
	const canSave = addressText.trim() && (savedRules.length > 0 || signType) && photo;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl space-y-6 p-4 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-sm font-medium text-slate-700",
				children: "Street address"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: addressText,
				onChange: (e) => setAddressText(e.target.value),
				placeholder: "e.g. 483 George St",
				className: "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-sm font-medium text-slate-700",
					children: "Country"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					list: "known-countries",
					value: country ?? "",
					onChange: (e) => onCountryChange(e.target.value),
					placeholder: "Detecting from map pin…",
					className: "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
					id: "known-countries",
					children: KNOWN_COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: c }, c))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-slate-400",
					children: hasLocalPreset(country) ? `Showing sign types that match how parking is usually signed in ${country}.` : "Showing a generic set. This country doesn't have a tailored list yet, but reporting still works fine."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-sm font-medium text-slate-700",
					children: "Photo of the sign (required)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-slate-400",
					children: "Every report is checked against its photo before it's shown to other people. This keeps the map trustworthy."
				}),
				photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: photo.previewUrl,
						alt: "Captured parking sign",
						className: "h-40 w-full rounded-lg object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: handleCapturePhoto,
						disabled: capturingPhoto,
						className: "flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
							className: "h-3.5 w-3.5",
							strokeWidth: 2
						}), " Retake photo"]
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleCapturePhoto,
					disabled: capturingPhoto,
					className: "mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 py-5 text-sm font-semibold text-blue-700 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera$2, {
							className: "h-4 w-4",
							strokeWidth: 2
						}),
						" ",
						capturingPhoto ? "Opening camera…" : "Take a photo of the sign"
					]
				})
			] }),
			savedRules.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-sm font-medium text-slate-700",
				children: "Time periods added so far"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 space-y-1.5",
				children: savedRules.map((r, i) => {
					const label = signOptions.find((o) => o.type === r.signType)?.label ?? r.signType;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: summarizeRule(r, label) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => removeSavedRule(i),
							"aria-label": "Remove this time period",
							className: "shrink-0 text-slate-400 hover:text-slate-600",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								className: "h-3.5 w-3.5",
								strokeWidth: 2
							})
						})]
					}, i);
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-sm font-medium text-slate-700",
					children: savedRules.length > 0 ? "Add another time period for this sign" : "What does the sign say?"
				}),
				savedRules.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-slate-400",
					children: "Many Australian signs stack several plates, e.g. \"2P Mon–Fri\", \"1P Sat\", \"Free Sun\". Add each one separately."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 grid grid-cols-2 gap-2",
					children: signOptions.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setSignType(opt.type);
							setHasMaxStay(false);
						},
						className: `rounded-xl border p-3 text-left text-sm transition ${signType === opt.type ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/15" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: opt.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `text-xs ${signType === opt.type ? "text-slate-300" : "text-slate-400"}`,
							children: opt.hint
						})]
					}, opt.type))
				})
			] }),
			maxStayOptional && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-sm text-slate-700",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: hasMaxStay,
					onChange: (e) => setHasMaxStay(e.target.checked)
				}), "Also has a max stay limit (e.g. \"2P Ticket\")"]
			}),
			showMaxStayInput && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-sm font-medium text-slate-700",
					children: "Max stay"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1.5 flex flex-wrap gap-1.5",
					children: MAX_STAY_PRESETS_HOURS.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setMaxStayHours(h),
						className: `rounded-full px-2.5 py-1 text-xs font-medium ${maxStayHours === h ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`,
						children: formatMaxStay(h)
					}, h))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "number",
					min: .25,
					step: .25,
					value: maxStayHours,
					onChange: (e) => setMaxStayHours(Number(e.target.value)),
					className: "mt-2 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-2 text-xs text-slate-400",
					children: "hours"
				})
			] }),
			needsPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-sm font-medium text-slate-700",
					children: "Currency"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: currency,
					onChange: (e) => setCurrency(e.target.value),
					className: "mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none",
					children: CURRENCY_OPTIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: c.code,
						children: c.label
					}, c.code))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-sm font-medium text-slate-700",
					children: "Price per hour"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "number",
					min: 0,
					step: .5,
					value: pricePerHour,
					onChange: (e) => setPricePerHour(Number(e.target.value)),
					className: "mt-1 w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
				})] })]
			}),
			needsTimeWindow && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2 text-sm text-slate-700",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: allDay,
						onChange: (e) => setAllDay(e.target.checked)
					}), "Applies all day, every day"]
				}), !allDay && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-sm font-medium text-slate-700",
					children: "Which days?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: DAYS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => toggleDay(d.value),
						className: `rounded-full px-2.5 py-1 text-xs font-medium ${daysActive.includes(d.value) ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`,
						children: d.label
					}, d.value))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-medium text-slate-700",
						children: "From"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "time",
						value: timeFrom,
						onChange: (e) => setTimeFrom(e.target.value),
						className: "mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-medium text-slate-700",
						children: "To"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "time",
						value: timeTo,
						onChange: (e) => setTimeTo(e.target.value),
						className: "mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
					})] })]
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-sm font-medium text-slate-700",
				children: "Notes (optional)"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: notes,
				onChange: (e) => setNotes(e.target.value),
				rows: 2,
				className: "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
			})] }),
			signType && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: handleAddAnotherPeriod,
				className: "w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50",
				children: "+ Save this period & add another (e.g. different days/hours)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: handleSubmit,
				disabled: !canSave || submitting,
				className: "w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40",
				children: submitting ? "Saving…" : "Save parking sign"
			})
		]
	});
}
//#endregion
//#region src/pages/AddSpot.tsx
function AddSpot({ center, onDone }) {
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [country, setCountry] = (0, import_react.useState)(null);
	const [detecting, setDetecting] = (0, import_react.useState)(false);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function handlePick(lat, lng) {
		setPicked({
			lat,
			lng
		});
		setDetecting(true);
		const detected = await detectCountry(lat, lng);
		setCountry(detected);
		setDetecting(false);
	}
	async function handleSubmit(value) {
		if (!picked) {
			setError("Tap the map to drop a pin at the sign location first.");
			return;
		}
		setSubmitting(true);
		setError(null);
		let photoUrl;
		try {
			photoUrl = await uploadSignPhoto(value.photo);
		} catch {
			setError("Could not upload the photo. Check your connection and try again.");
			setSubmitting(false);
			return;
		}
		const { data: userData } = await supabase.auth.getUser();
		const userId = userData.user?.id;
		const { data: spot, error: spotError } = await supabase.from("parking_spots").insert({
			lat: picked.lat,
			lng: picked.lng,
			address_text: value.addressText,
			country,
			photo_url: photoUrl,
			created_by: userId
		}).select("id").single();
		if (spotError || !spot) {
			setError(spotError?.message ?? "Could not save spot");
			setSubmitting(false);
			return;
		}
		const { error: ruleError } = await supabase.from("parking_rules").insert(value.rules.map((rule) => ({
			spot_id: spot.id,
			sign_type: rule.signType,
			max_stay_minutes: rule.maxStayMinutes,
			days_active: rule.daysActive,
			time_from: rule.timeFrom,
			time_to: rule.timeTo,
			price_per_hour: rule.pricePerHour,
			currency: rule.currency,
			notes: rule.notes,
			created_by: userId
		})));
		setSubmitting(false);
		if (ruleError) {
			setError(ruleError.message);
			return;
		}
		onDone();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col overflow-y-auto bg-[#f6f8fc]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-[#e3eaf3] bg-white px-5 py-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold uppercase tracking-[.14em] text-[#1769ff]",
						children: "Community map"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-2xl font-bold tracking-tight text-[#0b1730]",
							children: "Add a parking sign"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-[#64748b]",
							children: "Help someone understand a real sign."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1769ff]",
							children: [
								"Step ",
								picked ? "2" : "1",
								" of 2"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 flex-1 rounded-full bg-[#1769ff]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 flex-1 rounded-full ${picked ? "bg-[#1769ff]" : "bg-slate-200"}` })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-48 shrink-0 border-b border-slate-200 bg-white p-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full overflow-hidden rounded-2xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapView, {
						center,
						spots: [],
						pickMode: true,
						pickedLocation: picked,
						onPickLocation: handlePick
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-4 mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-center text-xs font-medium text-blue-700",
				children: !picked ? "Tap the map to mark exactly where the sign is" : detecting ? "Pin placed. Detecting your country..." : "Pin placed. Fill in the sign details below."
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-4 mt-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-xs text-rose-700",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportSpotForm, {
					country,
					onCountryChange: setCountry,
					onSubmit: handleSubmit,
					submitting
				})
			})
		]
	});
}
//#endregion
export { AddSpot };
