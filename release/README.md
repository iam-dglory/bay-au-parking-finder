# BAY local Android release candidate

Prepared: 5 November 2026

| File | Version | SHA-256 |
|---|---|---|
| `BAY-1.2.1-vc4.aab` | `1.2.1` (`versionCode 4`) | `d4c3a6a643e96a757fe7bc6b7d91ed7b64e0d3ff6e23cc9de79d0ddb54b5e4af` |

Build sequence:

```bash
VITE_SKIP_PUBLIC_COPY=true npm run build
npx cap sync android
ANDROID_HOME=/Users/gopika/Library/Android/sdk \
ANDROID_SDK_ROOT=/Users/gopika/Library/Android/sdk \
./android/gradlew -p android bundleRelease --no-daemon
```

Verification completed:

- TypeScript and Vite production build passed.
- R8 minification and Android resource shrinking ran.
- `jarsigner -verify` reported `jar verified` and exited 0.
- Packaged manifest contains `au.com.bayparking.app` and `1.2.1`.
- Packaged launcher icon visually matches the official BAY wordmark.
- Runtime parking datasets are not embedded in the binary.

Before upload, verify that Google Play has not already consumed version code 4. If it has, increment `versionCode`, rebuild and replace the artifact and checksum. This bundle has not been uploaded or published.
