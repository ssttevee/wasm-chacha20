#!/bin/bash

FUNCTIONS=(
    'crypto_chacha20_init'
    'crypto_chacha20_x_init'
    'crypto_chacha20_encrypt'
    'crypto_chacha20_stream'
    'crypto_chacha20_set_ctr'
    'sizeof_crypto_chacha_ctx'
)

for f in "${FUNCTIONS[@]}"; do
    COMBINED="$COMBINED,'_$f'"
done

OUT_DIR=$(dirname "$0")
emcc -s "EXPORTED_FUNCTIONS=[${COMBINED: 1}]" -Os "$OUT_DIR/monocypher.c" "$OUT_DIR/sizes.c" -o "$OUT_DIR/monocypher.wasm"
