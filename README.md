# WebGame

複数のミニゲームをまとめたフォルダです。静的なブラウザゲームと、Socket.IO を使ったリアルタイム計算ゲーム（Docker 推奨）が含まれます。

## 構成
- `CalculationGame/` リアルタイム計算ゲーム（Node.js + Express + Socket.IO + MongoDB）
- `CarGame/` シンプルなカーレース風ゲーム（静的ファイル）
- `games/` そのほかのミニゲーム（静的ファイル）

## クイックスタート
以下は各ゲームの起動方法です。

### CalculationGame（推奨: Docker Compose）
依存関係やポートを含めてまとめて起動できます。

1) 事前準備
- Docker / Docker Compose をインストール

2) 起動（`CalculationGame/` 配下）
- `cd CalculationGame`
- `docker compose up --build`

3) アクセス
- ブラウザで `http://localhost/`（ポート80）
- ルートは `rules.html`、ゲーム画面は `/game` にルーティングされます。

メモ:
- `docker-compose.yml` で `./app/public` をコンテナ内の `/app/public` にマウントしています（`server.js` は `/app/public` を参照）。
- MongoDB コンテナも起動しますが、現状の `server.js` では接続処理は行っていません（将来的な拡張用と思われます）。

### CalculationGame（ローカル実行）
Docker を使わずに Node.js で動かす場合の手順です。

1) 事前準備
- Node.js 18 以上をインストール

2) セットアップと起動（`CalculationGame/` 配下）
- `cd CalculationGame`
- `npm install`
- `node server.js`
- 既定ポートは `80`。使用中の場合は `PORT` 環境変数を設定してください。

注意:
- `server.js` は `public` ディレクトリを静的配信します。リポジトリでは静的資産が `app/public/` にあります。ローカル実行時は、以下のいずれかで `public` を用意してください。
  - 例（Windows, PowerShell）：`cd CalculationGame; cmd /c "mklink /D public app\public"`
  - 例（macOS/Linux）：`ln -s app/public CalculationGame/public`
  - もしくは `server.js` の静的パスを `app/public` に変更する

### 静的ゲーム（CarGame / games）
- 直接 HTML をブラウザで開くだけで遊べます。
  - 例: `CarGame/cargame.html` をダブルクリック
  - 例: `games/SnakeBite.html`, `games/Factorizer.html`
- もしくは簡易サーバで配信してアクセスしてもOKです。

## ディレクトリ詳細
- `CalculationGame/server.js` Express + Socket.IO サーバ本体。`/` で `rules.html`、`/game` で `game.html` を返し、スコアはソケット経由で集計します。
- `CalculationGame/app/public/` フロント資産（HTML/CSS/JS/画像/音声）。
- `CalculationGame/Dockerfile` Node 18 ベース。`node server.js` で起動。
- `CalculationGame/docker-compose.yml` Web/API と MongoDB を起動。`./app/public` を `/app/public` にマウント。
- `CarGame/` `cargame.html`, `cargame.css`, `cargame.js` と画像を含む静的ゲーム。
- `games/` `waiting_room.html`, `SnakeBite.html`, `Factorizer.html` などの静的ゲーム。

## よくある質問（FAQ）
- ポート80が使えない: `PORT` 環境変数で変更して起動してください（例: `PORT=3000 node server.js`）。Docker の場合は `docker-compose.yml` のポートマッピングを編集します。
- 管理者（admin）について: `server.js` には `admin` というユーザー名を特別扱いする処理があります。待機室で `admin` として参加すると管理者としてゲーム開始イベントを送れます。

---
改善案や次の作業があればお知らせください（README の英語版追加、スクリーンショット掲載、GitHub Actions での自動ビルドなど）。
