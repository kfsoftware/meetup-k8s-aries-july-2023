import * as wasm from "./anoncreds_bg.wasm";
import { __wbg_set_wasm } from "./anoncreds_bg.js";
__wbg_set_wasm(wasm);
export * from "./anoncreds_bg.js";
