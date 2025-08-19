# プレゼンテーション画面技術検証

## 概要
Google Slidesの共有URLを受け取り、全画面でプレゼンテーションする画面に半透明な四角を描画する技術検証用のアプリケーションです。

## 機能
- Google Slides埋め込み表示
- 全画面プレゼンテーション
- マウスドラッグによる半透明四角の描画
- キーボードショートカット

## 使用方法
1. Google Slidesの共有URLを入力
2. 「プレゼンテーション開始」をクリック
3. F11または「全画面表示」ボタンで全画面モード
4. マウスをドラッグして半透明の赤い四角を描画
5. Cキーで四角をクリア
6. Escキーで終了

## 開発・実行
```bash
npm install
npm start
```

## 技術スタック
- React 18
- TypeScript
- HTML5 Canvas
- Fullscreen API

## 注意事項
- Google SlidesのCORS制限により、一部のURLでは埋め込みができない場合があります
- 全画面APIはHTTPS環境でのみ正常に動作します