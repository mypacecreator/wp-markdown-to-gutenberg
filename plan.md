# 実装計画 — WP Markdown to Gutenberg 正式版

## 現状（プロトタイプ完了）

プロトタイプで以下が動作確認済み:

- Gutenbergエディター iframe 内の paste イベントを capture フェーズで介入
- `:::vk-group-alert-info ... :::` → `core/group { className: 'is-style-vk-group-alert-info' }` への変換
- 内部コンテンツの Markdown → 標準ブロック変換（`pasteHandler` 委譲）
- 記法なしのペーストは一切介入しない

プロトタイプで判明したハマりポイント（解決済み）:

| # | 問題 | 解決 |
|---|------|------|
| 1 | `wp.blocks.pasteHandler` が getter-only で上書き不可 | DOM paste イベント capture で介入 |
| 2 | エディターコンテンツが `<iframe>` 内 | ポーリングで iframe 検出し `contentDocument` にリスナー登録 |
| 3 | 閉じ `:::` の前にタブが混入 | 正規表現で `^[ \t]*:::` を許容 |

---

## 正式版で追加する機能

### 実装順序（依存関係の少ない順）

1. **コードブロック内での変換抑止**（前提条件として最初に対応）
2. **続きを読む** `<!--more-->` → `core/more`
3. **ボタンブロック** `[btn](URL) テキスト` → `core/buttons > core/button`
4. **再利用ブロック** `{{reuse:ID}}` → `core/block`
5. **ショートコード** `[shortcode ...]` → `core/shortcode`
6. **汎用ブロック挿入** `{block:name attr="val"}` → 任意ブロック
7. **クリーンアップ**（デバッグログ除去・リファクタリング）

---

## アーキテクチャ

### ファイル構成（正式版）

```
src/
├── index.js                  # エントリポイント（変更なし）
├── paste-handler.js          # iframe 検出・paste イベント管理（変更なし）
├── notation-parser.js        # 複数行ブロックのパース（:::type 拡張）
├── line-parser.js            # 行レベル記法のパース（新規）
└── converters/
    ├── callout.js            # :::type → core/group（既存ロジックを移動）
    ├── button.js             # [btn] → core/buttons > core/button（新規）
    ├── reuse.js              # {{reuse:ID}} → core/block（新規）
    ├── more.js               # <!--more--> → core/more（新規）
    ├── shortcode.js          # [shortcode] → core/shortcode（新規）
    └── generic-block.js      # {block:name ...} → 任意ブロック（新規）
```

### パース処理フロー

```
paste イベント (iframe contentDocument)
  ↓
① コードブロック内ペースト判定
   ペースト先が core/code 等 → 介入しない（return）
  ↓
② notation-parser.js: 複数行ブロックをパース
   :::type ... ::: → callout セグメント
   それ以外 → text セグメント
  ↓
③ line-parser.js: text セグメント内を行単位でパース
   <!--more--> → more セグメント
   [btn...]    → button セグメント
   {{reuse:N}} → reuse セグメント
   {block:...} → generic-block セグメント
   [sc ...]    → shortcode セグメント
   それ以外    → paragraph セグメント（pasteHandler に委譲）
  ↓
④ 各 converter でブロック生成 → insertBlocks()
```

### `paste-handler.js` の変更範囲（注記）

ファイル構成図では「変更なし」と記載したが、正式版では以下の変更が必要：

- コードブロック抑止ロジックの追加（①の実装）
- `hasNotation()` 更新に伴う条件分岐の修正（後述『未決事項・要確認 > 1. hasNotation() ...』参照）
- `text` セグメントを `pasteHandler` ではなく `line-parser` に渡す処理
- 新セグメント型（`more`, `button`, `reuse`, `shortcode`, `generic-block`, `paragraph`）のハンドリング

---

## 各機能の実装詳細

### 1. コードブロック内での変換抑止

`wp.data.select('core/block-editor').getSelectedBlock()` でペースト先ブロックを取得し、
対象ブロックの場合は `return`（介入しない）。

```js
// paste-handler.js の onPaste() 先頭に追加
const selectedBlock = select( 'core/block-editor' ).getSelectedBlock();
const NON_CONVERT_BLOCKS = [ 'core/code', 'core/preformatted', 'core/html' ];
if ( selectedBlock && NON_CONVERT_BLOCKS.includes( selectedBlock.name ) ) {
    return;
}
```

### 2. 続きを読む

```
<!--more-->
```

- 行単位で `<!--more-->` を検出
- `createBlock('core/more')` で生成（属性なし）

### 3. ボタンブロック

```
[btn](https://example.com) 申し込む
[btn outline](https://example.com) 詳しく
```

```js
// 正規表現
/^\[btn( outline)?\]\(([^)]+)\)\s+(.+)$/

// 生成
const button = createBlock( 'core/button', {
    text: テキスト,
    url: URL,
    className: outline ? 'is-style-outline' : '',
} );
createBlock( 'core/buttons', {}, [ button ] );
```

### 4. 再利用ブロック（プロトタイプ: ID直接指定）

```
{{reuse:42}}
```

```js
// 正規表現
/^\{\{reuse:(\d+)\}\}$/

// 生成
createBlock( 'core/block', { ref: parseInt( id, 10 ) } );
```

IDが整数でない場合はスキップ。正式版でのスラッグ対応は `getEntityRecords` によるプリフェッチで別途実装。

### 5. ショートコード

```
[my_shortcode attr="val"]
```

```js
// 正規表現（[btn は除外）
/^\[(?!btn[ \]])([^\]]+)\].*/

// 生成
createBlock( 'core/shortcode', { text: マッチした全体 } );
```

複数行ショートコード（`[sc]...[/sc]`）は非対応（将来対応）。

### 6. 汎用ブロック挿入

```
{block:vk-blocks/balloon position="left" name="筆者" message="こんにちは"}
```

```js
// 正規表現
/^\{block:([^\s}]+)((?:\s+[\w-]+=(?:"[^"]*"|'[^']*'|[^\s}]*))*)\}$/

// 属性パース: key="value" を { key: value } のオブジェクトに変換
// 存在確認
if ( ! wp.blocks.getBlockType( blockName ) ) return null;
// 生成
createBlock( blockName, parsedAttrs );
```

### 7. クリーンアップ

- `console.log( '[WPMTG] ...' )` を全削除
- `eslint-disable-next-line no-console` コメントも削除
- 各機能を converter ファイルに分割

---

## 工数見立て

| 作業 | 見積もり |
|-----|---------|
| コードブロック変換抑止 | 0.5H |
| 続きを読む | 0.5H |
| ボタンブロック | 1H |
| 再利用ブロック（ID指定） | 0.5H |
| ショートコード | 1H |
| 汎用ブロック挿入 | 1.5H |
| アーキテクチャ整理・クリーンアップ | 1〜2H |
| **合計** | **6〜7H** |

---

## 動作確認チェックリスト

- [ ] `:::vk-group-alert-info` 変換（内部に見出し・リスト・太字を含む）
- [ ] `:::vk-group-alert-warning` / `:::vk-group-alert-success` 変換
- [ ] `[btn](URL) テキスト` → プライマリボタン
- [ ] `[btn outline](URL) テキスト` → アウトラインボタン
- [ ] `{{reuse:N}}` → 再利用ブロック（存在するIDで確認）
- [ ] `<!--more-->` → 続きを読む
- [ ] `[shortcode attr="val"]` → ショートコードブロック
- [ ] `{block:vk-blocks/balloon ...}` → 任意ブロック（VK Blocks 有効時）
- [ ] コードブロック内ペーストで変換されないこと
- [ ] 上記記法を含まないテキストのペーストが通常通り動作すること
- [ ] 複数記法が混在するテキストのペーストが正しく処理されること

---

## 未決事項・要確認

正式版開発開始前に以下を決定する。

### 1. `hasNotation()` の更新戦略（高優先・アーキテクチャ直結）

**問題：** 現在の `hasNotation()` は `:::type` 記法しか検出しない。
`[btn]`, `<!--more-->`, `{{reuse:}}`, `{block:}`, ショートコードを追加すると、
`:::` を含まないペーストは早期 `return` されてしまい `line-parser` が動かない。

選択肢：

| Option | 内容 |
|--------|------|
| **A（推奨）** | `hasNotation()` を全記法パターンに対応するよう拡張する |
| B | `hasNotation()` を廃止し、line-parser 内で「変換対象なし」を判断する |
| C | `paste-handler.js` の条件分岐を「callout OR line-notation」の2段構造にする |

### 2. ショートコード正規表現と Markdown リンクの衝突

**問題：** ショートコード検出正規表現 `/^\[(?!btn[ \]])([^\]]+)\].*/` は
Markdown リンク `[リンクテキスト](URL)` にもマッチしうる。

→ `](`（Markdown リンク構文）を除外する条件を追加するか否かを決定する。
   除外する場合の正規表現：`/^\[(?!btn[ \]])([^\]]+)\](?!\().*$/`

### 3. `{block:}` の属性値型変換ルール

**問題：** `{block:my/block count="5" visible="true"}` のとき、
`count` や `visible` を数値・真偽値に変換すべきか不明。
Gutenberg のブロックスキーマは属性型を検証するため、型が合わない場合は無効になる。

選択肢：
- **文字列のまま渡す**（シンプル・ブロック側スキーマに委ねる）
- **型推論する**（数値は Number、"true"/"false" は Boolean に変換）

### 4. `:::` 記法の拡張性

現在 `CALLOUT_TYPES` に3種類がハードコード。追加タイプが生じた場合の方針：

| 方針 | 内容 |
|------|------|
| **Fixed** | 引き続きハードコード（変更時はコードを編集） |
| Prefix match | `:::vk-group-` で始まる任意文字列を許容 |
| Arbitrary | `:::任意文字列` をすべて許容し `is-style-{type}` を付与 |

### 5. ブロック不存在時のフォールバック（`{block:}` 記法）

`{block:存在しないブロック名}` の場合の動作を決定する：

| 動作 | 内容 |
|------|------|
| **サイレント無視**（推奨） | その行をスキップ（最もシンプル） |
| `core/paragraph` に降格 | 元のテキストをそのまま段落として挿入 |
| 警告通知 | `wp.data.dispatch('core/notices').createWarningNotice()` で表示 |

### 6. 複数行ショートコードのスコープ（確認のみ）

`[sc]...[/sc]` 形式の複数行ショートコードは正式版でも非対応とする（plan.md 本文に記載済み）。
ユーザー向け README にも「非対応」として明記するか確認。

### 7. 自動テストの有無

動作確認チェックリストは手動確認のみ。Jest / `@wordpress/jest-console` によるユニットテストを
正式版スコープに含めるか否かを確認する（含める場合は工数見積もりを更新）。
