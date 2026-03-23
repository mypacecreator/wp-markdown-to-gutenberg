# WP Markdown to Gutenberg — ペーストテスト用ダミー原稿

> このファイルの全文をコピーしてGutenbergエディターに貼り付け、各記法が正しく変換されることを確認してください。
> 現時点でプラグインが対応済みなのは「コールアウト」のみです。他の記法は正式版実装後に変換されます。

---

## 通常テキスト（変換されないこと）

これは普通の段落テキストです。**太字**や*斜体*、`インラインコード`が含まれています。

- リスト項目 A
- リスト項目 B
- リスト項目 C

### 見出し（H3）

通常テキストのペーストはプラグインの介入なしにGutenbergが処理します。

---

## 続きを読む（正式版）

記事の要約ここまで。

<!--more-->

続きの本文はここから。

---

## コールアウトブロック（実装済み）

### INFO

:::vk-group-alert-info
## お知らせ

これは情報ブロックです。

- 箇条書き1
- 箇条書き2

**太字テキスト**も正しく変換されます。
:::

### WARNING

:::vk-group-alert-warning
⚠️ 注意事項

この操作は取り消せません。実行前に必ずバックアップを取ってください。
:::

### SUCCESS

:::vk-group-alert-success
✅ 完了しました

設定が正常に保存されました。変更は即時反映されます。
:::

---

## Visual Link Preview（実装済み）

[embed](https://www.commerce-design.net/tools/comanosuke/)

[embed](https://ja.wikipedia.org/wiki/WordPress)

---

## ボタンブロック（正式版）

[btn](https://example.com/apply) 申し込む

[btn outline](https://example.com/detail) 詳しく見る

---

## 再利用ブロック（正式版）

{{reuse:1}}

---

## ショートコード（正式版）

[contact-form-7 id="1" title="お問い合わせフォーム"]

[my_gallery columns="3" size="medium"]

---

## 汎用ブロック挿入（正式版）

{block:vk-blocks/balloon position="left" name="筆者" message="これは吹き出しブロックのテストです。"}

---

## 混在テスト（正式版）

ここは通常の本文テキストです。次の行から記法が混在します。

:::vk-group-alert-info
この情報ブロックは混在テスト用です。上下に通常テキストがあります。
:::

上記コールアウトの後に続く通常テキスト。

[embed](https://example.com/mixed-test)

[btn](https://example.com) ボタンも混在

さらに続くテキスト段落。

<!--more-->

続きを読むブロックの後のテキスト。

---

*以上がすべてのテストケースです。*
