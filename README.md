# WP Markdown to Gutenberg

マークダウンで書いた独自記法を、Gutenbergエディターへのペースト時に自動変換するWordPressプラグイン。

## 対応記法

### コールアウトブロック（`core/group`）

```
:::vk-group-alert-info
テキスト（見出し・リスト・太字なども可）
:::
```

`:::` の後に続くタイプ文字列がそのまま `is-style-{type}` の className になる。ホワイトリストはなく、対応するブロックスタイルが登録されていれば任意のスタイル名を指定可能。

| 記法例 | 適用 className |
|-------|---------------|
| `:::vk-group-alert-info` | `is-style-vk-group-alert-info` |
| `:::vk-group-alert-warning` | `is-style-vk-group-alert-warning` |
| `:::vk-group-alert-success` | `is-style-vk-group-alert-success` |
| `:::my-custom-style` | `is-style-my-custom-style` |

タイプ文字列には英字で始まる英数字・ハイフン・アンダースコア（`[a-zA-Z][a-zA-Z0-9_-]*`）が使用可能。

#### 省略記法

よく使うブロックスタイルは省略記法でも指定できる。省略記法はプラグインルートの `shorthand-map.json` で定義されており、ビルド不要で追加・変更が可能。

```
:::info
テキスト
:::
```

| 省略記法 | 展開後の className |
|---------|-------------------|
| `:::info` | `is-style-comp-info` |
| `:::warning` | `is-style-comp-warning` |
| `:::success` | `is-style-comp-success` |

- 内側のマークダウンは段落・見出し・リストなどの標準ブロックに自動変換
- 閉じタグ `:::` の前にタブ・スペースがあっても認識される

#### 省略記法の追加・変更方法

プラグインルートの `shorthand-map.json` を編集する。**ビルド不要**（ページリロードで即反映）。

```json
{
  "info": "comp-info",
  "warning": "comp-warning",
  "success": "comp-success"
}
```

- キー：記法で使う省略名（`:::` の直後に書く文字列）
- 値：適用される `is-style-{値}` の `{値}` 部分
- エントリを追加するだけで新しい省略記法が有効になる
- ファイルが存在しない・JSON が不正な場合は省略記法が無効になるだけで、フルネーム記法は正常動作する

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

### メディアとテキストブロック（`core/media-text`）

画像とテキストを横並びに配置する「メディアとテキスト」ブロックに変換。

```
:::media-text
![alt テキスト](https://example.com/image.jpg)

テキスト内容（見出し・リスト・太字なども可）
:::
```

#### オプション指定

```
:::media-text right 40%
![alt テキスト](https://example.com/image.jpg)

テキスト内容
:::
```

| オプション | 指定値 | 省略時のデフォルト |
|-----------|-------|-----------------|
| 配置 | `right`（メディアを右に配置） | `left`（メディアを左に配置） |
| メディア幅 | `数値%`（例: `40%`、15〜85%の範囲） | `50%` |

- メディアの幅は15〜85%の間で指定できます。範囲外の値は自動的にクランプされます
- `right` と `N%` は任意の組み合わせで省略可能
- 内側のマークダウンは段落・見出し・リストなどの標準ブロックに自動変換
- リンク付き画像（`[![alt](img)](link)`）も使用可能。その場合、画像にリンクが設定される
- `:::media-text` ブロック内の最初の画像行がメディア側になり、残りのテキストがテキスト側になる

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
