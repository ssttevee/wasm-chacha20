const fs = require('fs');
const {default: chacha20} = require('../index');

function random(length) {
    return Uint8Array.from(new Array(length), () => Math.floor(Math.random() * 256))
}

(async function() {
    const wasm = fs.readFileSync('./wasm/monocypher.wasm');
    const module = await WebAssembly.compile(wasm);
    const { Chacha20 } = chacha20(module);
    
    function crypt(key, nonce, ...values) {
        // crypt is the inverse function of itself,
        // given the same key and nonce
        const chacha20 = new Chacha20(key, nonce);
        try {
            let out = new Uint8Array();
            for (let i = 0; i < values.length; i++) {
                const prev = out;
                const merge = chacha20.encrypt(values[i]);
                out = new Uint8Array(prev.length + merge.length);
                out.set(prev);
                out.set(merge, prev.length);
            }
            return out;
        } finally {
            chacha20.close();
        }
    }

    const key = random(32);

    const nonce = random(8); // or random(24)

    const plaintext1 = new Uint8Array('hello'.split('').map((c) => c.charCodeAt(0)));
    const plaintext2 = new Uint8Array('world'.split('').map((c) => c.charCodeAt(0)));
    console.log(plaintext1, plaintext2);
    const ciphertext = crypt(key, nonce, plaintext1, plaintext2);
    console.log(ciphertext);
    const decrypted = crypt(key, nonce, ciphertext);
    console.log(decrypted, Array.from(decrypted).map((b) => String.fromCharCode(b)).join(''));
})().catch(console.error);
