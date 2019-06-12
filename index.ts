import Memory, { CopySource } from 'wasm-common/memory';

export default function(Chacha20Wasm: WebAssembly.Module) {
    const mem = new Memory({ initial: 256, maximum: 256 });
    
    const instance = new WebAssembly.Instance(Chacha20Wasm, {
        module: {},
        env: {
            memory: mem.memory,
        },
    });

    const SIZE_OF_CONTEXT = instance.exports._sizeof_crypto_chacha_ctx();
    
    class Chacha20 {
        private _context: number;
        private _freed: boolean;
    
        public constructor(key: CopySource, nonce: CopySource) {
            const keyLength = (key as string).length || (key as BufferSource).byteLength;
            const nonceLength = (nonce as string).length || (nonce as BufferSource).byteLength;
            if (keyLength !== 32) {
                throw new Error('key must be 32 bytes');
            } else if (nonceLength !== 8 && nonceLength !== 24) {
                throw new Error('nonce must be either 8 or 24 bytes');
            }

            this._context = mem.alloc(SIZE_OF_CONTEXT);
            const keyPtr = mem.copyIn(key);
            const noncePtr = mem.copyIn(nonce);

            try {
                if (nonceLength === 8) {
                    instance.exports._crypto_chacha20_init(this._context, keyPtr, noncePtr);
                } else {
                    instance.exports._crypto_chacha20_x_init(this._context, keyPtr, noncePtr);
                }
            } finally {
                mem.free(keyPtr);
                mem.free(noncePtr);
            }
        }
    
        public encrypt(data: CopySource): Uint8Array {
            this._assert();

            const length = data.length;
            const plaintext = mem.copyIn(data);
            const ciphertext = mem.alloc(length);
            try {
                instance.exports._crypto_chacha20_encrypt(this._context, ciphertext, plaintext, data.length);
                return mem.copyOut(ciphertext, length);
            } finally {
                mem.free(plaintext);
                mem.free(ciphertext);
            }
        }
    
        public close(): void {
            this._assert();
            this._freed = true;
            mem.free(this._context);
        }
    
        private _assert(): void {
            if (this._freed) {
                throw new Error('Chacha20 may not be used after it has been closed');
            }
        }
    }

    return { Chacha20 };
}
