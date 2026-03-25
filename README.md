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
  "callout": {
    "info": "comp-info",
    "warning": "comp-warning",
    "success": "comp-success"
  },
  "button": {
    "primary": "vk-btn-primary",
    "outline": "vk-btn-outline"
  }
}
```

- `callout`：コールアウトブロック（`:::type`）の省略記法
- `button`：ボタンブロック（`[btn type]`）の省略記法
- キー：記法で使う省略名
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

### Visual Link Preview（`visual-link-preview/link`）

[Visual Link Preview](https://wordpress.org/plugins/visual-link-preview/) プラグインのブロックを生成する。

```
[embed](https://example.com/article)
```

- URLのみ指定。タイトル・サムネイル・概要はプラグインがエディター上で自動取得する
- デフォルト値: `nofollow: false`、`new_tab: true`、`template: 'simple'`、`type: 'external'`、`provider_used: 'php'`、`image_id: -1`
- Visual Link Preview プラグインが未有効の場合は `core/paragraph` にリンクとしてフォールバック

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

#### ボタンスタイルの省略記法

コールアウトと同様、ボタンスタイルも `shorthand-map.json` の `button` セクションで省略記法を定義できる。

```
[btn primary](https://example.com) ボタンテキスト
```

`shorthand-map.json` に `"button": { "primary": "vk-btn-primary" }` と定義されていれば、上記は `is-style-vk-btn-primary` に展開される。

---

### 再利用ブロック（`core/block`）

```
{{reuse:42}}
{{reuse:cta}}
```

WordPressの再利用ブロックを呼び出す。投稿IDまたは `shorthand-map.json` で定義したエイリアスで指定できる。

| 記法例 | 動作 |
|--------|------|
| `{{reuse:42}}` | 投稿ID 42 の再利用ブロックを挿入 |
| `{{reuse:cta}}` | `shorthand-map.json` の `reuse.cta` に設定したIDの再利用ブロックを挿入 |

エイリアスを使う場合は `shorthand-map.json` の `reuse` セクションにキーと投稿IDを追加する：

```json
{
  "reuse": {
    "cta": 6961,
    "footer": 1234
  }
}
```

- エイリアスが `shorthand-map.json` に存在しない場合：
  - 再利用ブロック**のみ**のペーストは標準ペーストにフォールバックし、テキストがそのまま挿入される
  - 他のブロックと混在している場合は未解決のブロックのみスキップされる（他のブロックは正常挿入）

---

### 続きを読む（`core/more`）

```
:::more:::
```

独自の `:::more:::` 記法を WordPress の「続きを読む」ブロック（`core/more`）に変換。

---

## 未実装機能

以下の記法は現在未実装です。将来のバージョンで対応予定です。

### ショートコード（`core/shortcode`）

```
[contact-form-7 id="123" title="お問い合わせ"]
[my_gallery columns="3"]
```

標準のWordPressショートコード記法をそのままショートコードブロックに格納。

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
