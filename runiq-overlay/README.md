# RunIQ Overlay — standalone Android APK

Floating "IQ" bubble that sits on top of Spark. Tap it → type pay / miles / return miles / stops → get TAKE IT / MAYBE / PASS with $/mi and $/hr. Tap outside or ▾ to shrink it back. It never reads Spark's screen or taps anything.

Works offline (no website needed).

## Files
```
android/                      Android Studio project (open this folder)
android/app/src/main/java/com/dtesolutions/runiq/MainActivity.kt   home screen: targets + turn bubble on
android/app/src/main/java/com/dtesolutions/runiq/OverlayService.kt  the floating bubble + calculator
android/app/src/main/java/com/dtesolutions/runiq/Calc.kt            the math (tweak here)
```

## Build it
Open the `android` folder in **Android Studio** and let it sync, then **Build > Build APK(s)**. Or from a terminal inside `android/`:
```
./gradlew assembleDebug
```
The file lands in `android/app/build/outputs/apk/debug/app-debug.apk`.
- For selling, use **Build > Generate Signed App Bundle / APK > APK** and keep that keystore safe. You need the same key for every update.

## Install on your phone
1. Send the APK to your phone (Google Drive, email, USB) and tap it.
2. Allow "Install unknown apps" for the app you opened it from.
3. Open **RunIQ** (now under your Apps) → **Allow overlay** → toggle RunIQ on → back.
4. Set your min $/mi and $/hr → **Save** → **Turn on RunIQ bubble**.

## Tweaks
- Time estimate when you leave minutes blank: `Calc.kt` → `totalMiles * 1.8 + stops * 7`.
- Default targets: `$1.50/mi`, `$25/hr` in `Calc.kt`.
- Bubble color: `#16A34A` in `OverlayService.kt`.
