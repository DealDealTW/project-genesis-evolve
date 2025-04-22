# 構建Android APK的說明

由於項目目錄路徑中包含特殊字符，我們無法通過腳本直接構建APK。請按照以下步驟手動構建最新版本的APK：

## 方法一：使用Android Studio

1. 開啟Android Studio
2. 選擇「Open an existing Android Studio project」
3. 導航至專案的android目錄
4. 等待項目同步完成
5. 從頂部菜單選擇「Build」→「Build Bundle(s) / APK(s)」→「Build APK(s)」
6. 構建完成後，APK文件將位於：`android/app/build/outputs/apk/debug/app-debug.apk`

## 方法二：使用命令行（如果可以訪問目錄）

```bash
# 進入項目的android目錄
cd path/to/project/android

# 清理舊的構建
./gradlew clean

# 構建debug APK
./gradlew assembleDebug
```

構建完成後，APK將位於：`android/app/build/outputs/apk/debug/app-debug.apk`

## 重要更新

本次更新已將APK版本從1.0升級到1.1，版本代碼從1升級到2，以確保包含所有最新的更改。 