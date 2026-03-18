# WP Markdown to Gutenberg

マークダウンで書いた独自記法を、Gutenbergエディターへのペースト時に自動変換するWordPressプラグイン。

## 対応記法

### コールアウトブロック（`core/group`）

```
:::vk-group-alert-info
テキスト（見出し・リスト・太字なども可）
:::
```

記法のタイプ文字列がそのまま `is-style-{type}` の className になる。

| 記法 | 適用 className |
|-----|---------------|
| `:::vk-group-alert-info` | `is-style-vk-group-alert-info` |
| `:::vk-group-alert-warning` | `is-style-vk-group-alert-warning` |
| `:::vk-group-alert-success` | `is-style-vk-group-alert-success` |
| `:::任意のスタイル名` | `is-style-任意のスタイル名` |

- 内側のマークダウンは段落・見出し・リストなどの標準ブロックに自動変換
- 閉じタグ `:::` の前にタブ・スペースがあっても認識される

---

### 画像ブロック（`core/image`）

#### パターン1：通常の画像

```
![alt テキスト](https://example.com/image.png)
```

外部URLをそのまま参照する画像ブロックに変換。画像はメディアライブラリへ登録されない。

#### パターン2：リンク付き画像

```
[![alt テキスト](https://example.com/image.png)](https://example.com/link)
```

リンク（href）付きの画像ブロックに変換。

- コールアウトブロックの内側に画像記法を書いた場合も変換される
- パターン1（`^!\[`）とパターン2（`^\[!\[`）は行頭文字が異なるため、互いに誤検知しない
- 画像記法の行頭にインデント（スペース・タブ）を入れないこと（認識されない）

---

### ボタンブロック（`core/buttons` > `core/button`）

```
[btn](https://example.com) ボタンテキスト
[btn outline](https://example.com) ボタンテキスト
```

| 記法 | スタイル |
|-----|---------|
| `[btn](URL) テキスト` | プライマリ（塗り） |
| `[btn outline](URL) テキスト` | セカンダリ（枠線） |

---

### 再利用ブロック（`core/block`）

```
{{reuse:42}}
```

WordPressの再利用ブロックを投稿IDで呼び出す。
※ プロトタイプ段階はID直接指定。正式版でスラッグ対応予定。

---

### 続きを読む（`core/more`）

```
<!--more-->
```

標準のWordPress「続きを読む」タグをそのまま使用。

---

### ショートコード（`core/shortcode`）

```
[contact-form-7 id="123" title="お問い合わせ"]
[my_gallery columns="3"]
```

標準のWordPressショートコード記法をそのままショートコードブロックに格納。

---

### 汎用ブロック挿入（吹き出し・固有ブロック等）

プラグイン固有ブロックをブロック名・属性で直接指定できる汎用記法。

```
{block:vk-blocks/balloon position="left" name="筆者" message="こんにちは"}
```

- `block:` に続けてGutenbergのブロック名を指定
- スペース区切りで `key="value"` 形式の属性を任意個指定
- 将来使用プラグインが変わっても、記法のブロック名を変えるだけで対応可能

---

## 技術メモ（実装上のハマりポイント）

| # | 問題 | 解決策 |
|---|------|--------|
| 1 | `wp.blocks.pasteHandler` は getter-only で上書き不可 | DOM `paste` イベントを capture フェーズで介入 |
| 2 | 投稿エディターのコンテンツ領域が `<iframe>` 内 | iframe の `contentDocument` にリスナーを登録 |
| 3 | 閉じ `:::` の前にタブ文字が混入する | 正規表現で行頭の `[ \t]*` を許容 |

---

## セットアップ

```bash
npm install
npm run build
```

`build/` フォルダを含むディレクトリを `wp-content/plugins/` に配置し、WordPress管理画面でプラグインを有効化。

## 開発

```bash
npm run start   # ウォッチモード
npm run build   # プロダクションビルド
```
