# WP Markdown to Gutenberg — ペーストテスト用ダミー原稿

> このファイルの全文をコピーしてGutenbergエディターに貼り付け、各記法が正しく変換されることを確認してください。

---

## 通常テキスト

これは普通の段落テキストです。**太字**や*斜体*、`インラインコード`が含まれています。

- リスト項目 A
- リスト項目 B
- リスト項目 C

### 見出し（H3）

通常テキストのペーストはプラグインの介入なしにGutenbergが処理します。

---

## 続きを読むブロック（実装済み）

記事の前の段落。

:::more:::

記事の後の段落。

---

## コールアウト: グループブロックで囲む（実装済み）

### 省略記法 — INFO

:::info
## お知らせ（省略記法）

これは `:::info` 省略記法のテストです。`is-style-comp-info` が適用されます。

[btn](https://example.com/apply) 塗りつぶし

[btn outline](https://example.com/detail) アウトライン

[btn blue](https://example.com/detail) ブルー立体

[btn orange](https://example.com/detail) オレンジ立体

:::

### 省略記法 — WARNING

:::warning
⚠️ 注意（省略記法）

`:::warning` → `is-style-sme-alert-warning` に変換されます。
:::

### 省略記法 — SUCCESS

:::success
✅ 完了（省略記法）

`:::success` → `is-style-sme-alert-success` に変換されます。
:::

### 省略記法 — related

:::related
▶関連記事

`:::related` → `is-style-comp-related` に変換されます。
:::

---

### フルネーム記法 — INFO

:::comp-info
## お知らせ

これは情報ブロックです。

- 箇条書き1
- 箇条書き2

**太字テキスト**も正しく変換されます。
:::

### フルネーム記法 — WARNING

:::sme-alert-warning
⚠️ 注意事項

この操作は取り消せません。実行前に必ずバックアップを取ってください。
:::

### フルネーム記法 — SUCCESS

:::sme-alert-success
✅ 完了しました

設定が正常に保存されました。変更は即時反映されます。
:::

---

## Visual Link Preview（実装済み）

[embed](https://mypacecreator.net/blog/archives/3037)

ブロック変換時に情報が表示されていない（空ブロックになっている）場合は、変換後のブロックを選択し、サイドバーのブロック設定を開いて「Metadata Provider」項目内 "Select provider..." と表示されているプルダウンから"Self-hosted (PHP)" を選択してください。PHP側でURLの情報を取得し、タイトル・サムネイル・概要が表示されるようになります。

---

## メディアとテキストブロック（実装済み）

### 基本形（左配置・50%幅）

:::media-text
![サンプル画像](https://placehold.co/600x400/E8F5E9/333?text=Sample)

これはメディアとテキストブロックの基本形です。
**太字**やリストも使えます。

- 項目A
- 項目B

[btn](https://example.com/apply) 塗りつぶし

[btn outline](https://example.com/detail) アウトライン

[btn blue](https://example.com/detail) ブルー立体

[btn orange](https://example.com/detail) オレンジ立体
:::

### 右配置

:::media-text right
![右配置の画像](https://placehold.co/600x400/E3F2FD/333?text=Right)

メディアが右側に配置されます。テキストは左側に表示されます。
:::

### 右配置・40%幅

:::media-text right 40%
![カスタム幅](https://placehold.co/600x400/FFF3E0/333?text=40%25)

メディア幅を40%に指定した例です。テキスト側が60%になります。
:::

### リンク付き画像

:::media-text
[![クリック可能](https://placehold.co/600x400/FCE4EC/333?text=Linked)](https://example.com/destination)

画像にリンクが設定されたメディアとテキストブロックです。
:::

### 幅のみ指定（左配置・70%幅）

:::media-text 70%
![幅のみ指定](https://placehold.co/600x400/F3E5F5/333?text=70%25)

左配置のまま、メディア幅を70%に指定した例です。テキスト側が30%になります。
:::

### 境界値テスト — 最小幅（15%）

:::media-text 15%
![最小幅](https://placehold.co/600x400/E0F7FA/333?text=15%25)

メディア幅の最小値（15%）です。テキスト側が85%になります。
:::

### 境界値テスト — 最大幅（85%）

:::media-text 85%
![最大幅](https://placehold.co/600x400/FFF9C4/333?text=85%25)

メディア幅の最大値（85%）です。テキスト側が15%になります。
:::

### 画像なし（フォールバック確認）

:::media-text
テキストのみで画像がない場合、メディアとテキストブロックにはならず通常の段落として処理されるべきケースです。
:::

### リッチなテキスト内容（見出し・複数段落・リスト）

:::media-text right 60%
![リッチコンテンツ](https://placehold.co/600x400/D1C4E9/333?text=Rich)

### テキスト側の見出し

最初の段落テキスト。**太字**と*斜体*を含みます。

2番目の段落テキスト。

1. 番号付きリスト1
2. 番号付きリスト2
3. 番号付きリスト3
   :::

### コールアウトとの混在

:::vk-group-alert-info
media-text の前に置かれたコールアウトです。
:::

:::media-text right 30%
![混在テスト](https://placehold.co/600x400/FFCCBC/333?text=Mixed)

コールアウトの直後に配置されたメディアとテキストブロックです。
:::

---

## ボタンブロック（正式版）

[btn](https://example.com/apply) 塗りつぶし

[btn outline](https://example.com/detail) アウトライン

[btn blue](https://example.com/detail) ブルー立体

[btn orange](https://example.com/detail) オレンジ立体

---

## ボタンブロック省略記法（shorthand-map.json の button セクションで定義）

※ shorthand-map.json に `"button": { "primary": "vk-btn-primary" }` を追加した場合のテスト

[btn primary](https://example.com/apply) 省略記法ボタン

### blue / orange（shorthand-map.json に定義済み）

[btn blue](https://example.com/detail) ブルー立体（省略記法）

[btn orange](https://example.com/detail) オレンジ立体（省略記法）

---

## 再利用ブロック（実装済み）

### ID指定

{{reuse:6961}}

### エイリアス指定（shorthand-map.json の reuse セクションで定義）

{{reuse:cta}}

---

## 2カラム画像ブロック（実装済み）

### 基本形（2枚並べ）

:::cols
![ビフォー](https://placehold.co/600x400/E8F5E9/333?text=Before)
![アフター](https://placehold.co/600x400/FCE4EC/333?text=After)
:::

### 1枚のみ（フォールバック: 1カラムのcolumnsブロック）

:::cols
![1枚のみ](https://placehold.co/600x400/E3F2FD/333?text=Single)
:::

### 3枚以上（core/gallery ブロックに変換）

:::cols
![画像A](https://placehold.co/600x400/FFF3E0/333?text=A)
![画像B](https://placehold.co/600x400/F3E5F5/333?text=B)
![画像C](https://placehold.co/600x400/E0F7FA/333?text=C)
:::

### コールアウトとの混在

:::info
colsブロックの前に置かれたコールアウトです。
:::

:::cols
![商品カット1](https://placehold.co/600x400/FFCCBC/333?text=Product+1)
![商品カット2](https://placehold.co/600x400/D1C4E9/333?text=Product+2)
:::

### テキスト混在（フォールバック: :::cols を無視して通常ブロックとして処理）

> 期待動作: core/columns にならず、画像2枚とテキストが個別ブロックとして挿入される

:::cols
![A](https://placehold.co/600x400/E8F5E9/333?text=A)
なんらかのテキスト
![B](https://placehold.co/600x400/FCE4EC/333?text=B)
:::

---

## ショートコード（WordPress 標準対応）

[contact-form-7 id="1" title="お問い合わせフォーム"]

[my_gallery columns="3" size="medium"]

---

## 汎用ブロック挿入（未実装）

{block:vk-blocks/balloon position="left" name="筆者" message="これは吹き出しブロックのテストです。"}

---

*以上がすべてのテストケースです。*
