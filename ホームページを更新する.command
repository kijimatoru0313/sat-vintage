#!/bin/zsh
# ─────────────────────────────────────────
#  S.a.T VINTAGE ホームページ 更新ボタン
#  商品を追加・変更したあと、このファイルをダブルクリックすると
#  インターネット上のホームページに反映されます。
# ─────────────────────────────────────────
cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.local/bin:$PATH"

URL="https://kijimatoru0313.github.io/sat-vintage/"

echo ""
echo "  S.a.T VINTAGE ホームページを更新します"
echo "  ────────────────────────────────────"
echo ""

fail() {
  echo ""
  echo "  × $1"
  echo ""
  echo "  この画面の文字をコピーして、Claude に見せてください。"
  echo "  このウィンドウは閉じて大丈夫です。"
  echo ""
  exit 1
}

# 前回が途中で止まっていたときの後片付け
if [ -f .git/index.lock ] && ! pgrep -f "[g]it " > /dev/null 2>&1; then
  rm -f .git/index.lock
  echo "  （前回の作業のあとしまつをしました）"
  echo ""
fi

# 変更があるか確認
CHANGES="$(git status --porcelain 2>&1)" || fail "フォルダの状態を読めませんでした。"

if [ -z "$CHANGES" ]; then
  echo "  変更はありませんでした。"
  echo "  （商品を追加・変更してから、もう一度実行してください）"
  echo ""
  echo "  このウィンドウは閉じて大丈夫です。"
  echo ""
  exit 0
fi

echo "  変更された内容:"
echo "$CHANGES" | sed 's/^/    /'
echo ""
echo "  アップロード中... (写真が多いと1〜2分かかります)"
echo ""

git add -A                                        || fail "ファイルの登録でつまずきました。"
git commit -q -m "商品を更新 $(date '+%Y-%m-%d %H:%M')" || fail "変更の記録でつまずきました。"
git push -q                                       || fail "アップロードでつまずきました。インターネットにつながっているか確認してください。"

echo "  ✓ 更新しました"
echo ""
echo "  $URL"
echo ""
echo "  ※ ページに反映されるまで1〜3分かかります。"
echo "     少し待ってから、ブラウザで command + R を押してください。"
echo ""
echo "  このウィンドウは閉じて大丈夫です。"
echo ""
