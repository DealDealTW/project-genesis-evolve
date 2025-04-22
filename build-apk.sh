#!/bin/bash

# 設置工作目錄
WORKSPACE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ANDROID_DIR="$WORKSPACE_DIR/android"

# 顯示當前目錄
echo "當前工作目錄: $WORKSPACE_DIR"
echo "Android目錄: $ANDROID_DIR"

# 清理舊的構建
cd "$ANDROID_DIR" && ./gradlew clean

# 構建新的APK
cd "$ANDROID_DIR" && ./gradlew assembleDebug

# 檢查APK是否成功創建
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "APK已成功創建: $APK_PATH"
    echo "APK大小: $(du -h "$APK_PATH" | cut -f1)"
else
    echo "APK創建失敗，請檢查錯誤日誌"
fi 