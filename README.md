# Clipnest

## 概要

Clipnest は、Chrome 上でコピーしたテキストの履歴を端末内に保存し、AI による自動分類とテンプレート貼り付けで再利用しやすくする拡張機能です。買い切りライセンスで AI 機能と無制限保存を解放でき、クリップボードデータは外部に送信せずローカルに保持します。

## 開発開始手順

### 1. 依存関係のインストール

```bash
npm install
```

`@typescript-eslint` と `eslint@9` の peer 依存が競合する場合は、次を使用してください。

```bash
npm install --legacy-peer-deps
```

### 2. ビルド

```bash
npm run build
```

`dist/` に Manifest V3 用の成果物が生成されます。

### 3. Chrome への読み込み

1. Chrome を開く
2. アドレスバーに `chrome://extensions/` をコピーして Enter（リンククリック不可）
3. **デベロッパーモード** を ON
4. **パッケージ化されていない拡張機能を読み込む** をクリック
5. このリポジトリの `dist/` ディレクトリ（例: `/Users/yukikotaki/Documents/clipnest/dist/`）を選択
6. ツールバーに拡張アイコンが表示され、クリックで popup が開くことを確認

開発中は `npm run dev` で Vite の watch ビルドを使えます。変更後は `dist/` を再読み込みしてください。

## スクリプト一覧

| コマンド | 説明 |
|----------|------|
| `npm run dev` | Vite 開発サーバー（watch ビルド） |
| `npm run build` | 本番ビルド（`dist/` 出力） |
| `npm run lint` | ESLint（TypeScript） |
| `npm run format` | Prettier（`src/**/*.{ts,tsx,css,json}`） |
| `npm run typecheck` | `tsc --noEmit` |

## ディレクトリ構造

仕様書 §2 アーキテクチャに基づく構成です。

```
clipnest/
├── clipnest_spec_v1_0.md    # 仕様書
├── manifest.json            # MV3 マニフェスト（ソース）
├── _locales/                # Chrome i18n
│   ├── ja/messages.json
│   └── en/messages.json
├── icons/                   # 拡張アイコン (16/48/128)
├── src/
│   ├── background/          # Service Worker
│   │   └── index.ts
│   ├── content/             # Content Script（コピー監視）
│   │   └── index.ts
│   ├── popup/               # ポップアップ UI
│   │   ├── index.html
│   │   └── main.ts
│   ├── options/             # オプション画面
│   │   ├── index.html
│   │   └── main.ts
│   └── lib/                 # 共有ロジック
│       ├── storage.ts
│       ├── db.ts
│       ├── types.ts
│       ├── ai.ts
│       ├── license.ts
│       ├── i18n.ts
│       └── migrations.ts
├── dist/                    # ビルド出力（gitignore）
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
└── package.json
```

## 仕様書

詳細な要件・API・リリース計画は [clipnest_spec_v1_0.md](./clipnest_spec_v1_0.md) を参照してください。

## ライセンス

MIT License（予定。正式なライセンス表記はリリース前に確定します。）

## 現在の状態

**clipnest-010 まで完了**（Manifest V3 雛形、TypeScript/Vite、src スキャフォールド、ESLint/Prettier、i18n、アイコン、ビルド検証、README 整備）。
