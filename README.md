# Inventory Frontend

在庫管理システムのフロントエンドアプリケーションです。
AirtableスタイルのスプレッドシートUIでユーザー定義テーブルを管理します。

---

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite 8 |
| スタイル | Tailwind CSS 4 |
| サーバー状態管理 | TanStack React Query v5 |
| UI状態管理 | Zustand v5 |
| ルーティング | React Router v7 |
| HTTPクライアント | Axios |
| ドラッグ＆ドロップ | dnd-kit |
| アイコン | Lucide React |
| アーキテクチャ | Feature-Sliced Design (FSD) |

---

## はじめに

### 前提条件

- Node.js 18+
- バックエンドサーバーが起動中であること（`localhost:8080`）

### インストールと起動

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動 (localhost:5173)
npm run dev

# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

### バックエンドとの接続

`vite.config.ts` のプロキシ設定により、`/api` へのリクエストは自動的に `localhost:8080` へ転送されます。
バックエンドのポートを変更した場合は、`vite.config.ts` の proxy ターゲットを修正してください。

---

## 主な機能

### テーブル管理
- ユーザー定義テーブルの作成・削除
- サイドバーのテーブル名をダブルクリックしてリネーム

### フィールド（カラム）管理
- フィールドの追加（TEXT / NUMBER / DATE / BOOLEAN / RELATION タイプ）
- RELATION タイプ：他テーブルのカラムを参照
- ヘッダーのドラッグ＆ドロップでフィールド順序を変更
- ヘッダードロップダウンからフィールド名変更・削除

### レコード（行）管理
- レコードの追加・削除
- セルクリックでインライン編集（Enter で確定 / ESC でキャンセル / Tab で次のセルへ移動）
- RELATION セル：参照テーブルのアイテムをドロップダウンで選択

### 保存ボタンパターン
すべての変更は即座にサーバーへ保存されず、**ローカルの dirty state** に保持されます。

- 変更されたセル・フィールドヘッダーは **黄色の背景（`amber-50`）** で表示
- ツールバー右側の **保存ボタン** をクリックするとサーバーへ一括反映
- 未保存の変更がない場合、保存ボタンは無効化

---

## プロジェクト構成

FSD（Feature-Sliced Design）アーキテクチャに従います。
レイヤー間の依存方向は単方向です：`app → pages → widgets → features → entities → shared`

```
src/
├── app/
│   ├── providers/        QueryClientProvider などグローバル Provider
│   └── router/           AppShell レイアウト + ルート定義
│
├── shared/               ドメイン非依存の共通インフラ
│   ├── api/              axios クライアント、React Query 設定、queryKeys
│   ├── store/            Zustand uiStore（UI状態 + dirtyTableNames）
│   ├── ui/               共通コンポーネント（Button、Modal、Spinner）
│   ├── lib/              ユーティリティ関数（cn）
│   └── config/           グローバル定数（グリッド幅など）
│
├── entities/             ドメイン単位のサーバー状態
│   ├── user-table/       テーブル型・API・React Query フック
│   ├── column/           カラム型・API・フック・TypeIcon コンポーネント
│   └── inventory-item/   アイテム（EAV）型・API・フック
│
├── features/             ユーザーインタラクション単位
│   ├── edit-inventory-item/   セルインライン編集（useEditCell、GridCell、RelationCellInput）
│   └── manage-columns/        フィールド追加モーダル（AddColumnModal）
│
├── widgets/              features + entities を組み合わせた UI ブロック
│   ├── inventory-grid/   Airtable スタイルグリッド（dnd-kit カラム D&D 対応）
│   ├── app-sidebar/      サイドバー（テーブル一覧・作成・削除・リネーム）
│   └── app-header/       ヘッダー（会員エリアのプレースホルダー含む）
│
└── pages/                ウィジェット組み合わせ + ミューテーションオーケストレーション
    ├── user-table/        EAV テーブルグリッドページ（/tables/:id）
    ├── stock/             在庫状況（/stock）— 実装予定
    ├── inbound/           入庫管理（/inbound）— 実装予定
    └── outbound/          出庫管理（/outbound）— 実装予定
```

詳細な設計については [`definition.md`](./definition.md) を参照してください。

---

## ルート

| パス | ページ |
|------|--------|
| `/` | `/stock` へリダイレクト |
| `/stock` | 在庫状況（実装予定） |
| `/inbound` | 入庫管理（実装予定） |
| `/outbound` | 出庫管理（実装予定） |
| `/tables/:id` | ユーザー定義テーブルグリッド |

---

## バックエンド API 一覧

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/tables` | テーブル一覧取得 |
| POST | `/api/tables` | テーブル作成 |
| PATCH | `/api/tables/{id}` | テーブル名変更 |
| DELETE | `/api/tables/{id}` | テーブル削除 |
| GET | `/api/tables/{id}/columns` | カラム一覧取得 |
| POST | `/api/tables/{id}/columns` | カラム追加 |
| PATCH | `/api/tables/{id}/columns/{columnId}` | カラム名変更 |
| PATCH | `/api/tables/{id}/columns/reorder` | カラム順序一括変更 |
| DELETE | `/api/tables/{id}/columns/{columnId}` | カラム削除 |
| GET | `/api/tables/{id}/items` | アイテム一覧取得 |
| POST | `/api/tables/{id}/items` | アイテム追加 |
| PUT | `/api/tables/{id}/items/{itemId}` | アイテム更新 |
| DELETE | `/api/tables/{id}/items/{itemId}` | アイテム削除 |
