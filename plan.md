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
