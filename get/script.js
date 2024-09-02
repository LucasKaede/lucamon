window.onload = (e) => {
    let video = document.getElementById("video");
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    let msg = document.getElementById("msg");
    let resultImage = document.getElementById("resultImage");
    let startButton = document.getElementById("startButton");
    let isScanning = false;

    startButton.addEventListener("click", () => {
        if (!isScanning) {
            startButton.disabled = true;
            startCamera();
        }
    });

    function startCamera() {
        const userMedia = { video: { facingMode: "environment" } };
        navigator.mediaDevices.getUserMedia(userMedia).then((stream) => {
            video.srcObject = stream;
            video.setAttribute("playsinline", true); // iOS対応
            video.play();
            startTick();
        }).catch((err) => {
            console.error("カメラのアクセスに失敗しました: ", err);
            msg.innerText = "カメラのアクセスに失敗しました。";
        });
    }

    function startTick() {
        msg.innerText = "ビデオを読み込んでいます...";
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });

            if (code) {
                console.log("QRコードが検出されました: ", code.data); // QRコードのデータをログ
                drawRect(code.location); // QRコードの場所に矩形を描画
                msg.innerText = `QRコードを検出しました: ${code.data}`; // QRコードのデータを表示
                
                // QRコードのスキャンが成功した時の追加リアクション
                showSuccessReaction(code.data);
            } else {
                console.log("QRコードが見つかりません。再試行中..."); // デバッグ用ログ
                msg.innerText = "QRコードを検出中...";
            }
        } else {
            console.log("ビデオのデータがまだ十分ではありません。"); // デバッグ用ログ
        }
        setTimeout(startTick, 250);
    }

    function drawRect(location) {
        drawLine(location.topLeftCorner, location.topRightCorner);
        drawLine(location.topRightCorner, location.bottomRightCorner);
        drawLine(location.bottomRightCorner, location.bottomLeftCorner);
        drawLine(location.bottomLeftCorner, location.topLeftCorner);
    }

    function drawLine(begin, end) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#FF3B58";
        ctx.beginPath();
        ctx.moveTo(begin.x, begin.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }

    function showSuccessReaction(data) {
        // QRコードのデータに基づく画像を表示
        let imageUrl = `images/${data}.jpg`; // QRコードのデータに基づく画像のURL
        resultImage.src = imageUrl;
        resultImage.style.display = "block";
        
        // 成功メッセージを表示
        msg.innerText = "QRコードのスキャンに成功しました!";
        
        // 背景色を変更
        document.body.style.backgroundColor = "#d4edda"; // 成功の視覚的フィードバック
        
        // 起動ボタンを再度有効化
        startButton.disabled = false;
    }
}
