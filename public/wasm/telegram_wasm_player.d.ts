/* tslint:disable */
/* eslint-disable */

export class TelegramPro {
    free(): void;
    [Symbol.dispose](): void;
    connect(_api_id: number, _api_hash: string, _session_string: string): Promise<void>;
    download_chunk(_file_id: string, offset: number, limit: number): Promise<Uint8Array>;
    constructor();
}

export function start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_telegrampro_free: (a: number, b: number) => void;
    readonly start: () => void;
    readonly telegrampro_connect: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
    readonly telegrampro_download_chunk: (a: number, b: number, c: number, d: number, e: number) => any;
    readonly telegrampro_new: () => number;
    readonly wasm_bindgen__closure__destroy__h8020ea25e1d419b8: (a: number, b: number) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h52e09fbcd076dc54: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h6234a38b86f1f924: (a: number, b: number, c: any) => void;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
