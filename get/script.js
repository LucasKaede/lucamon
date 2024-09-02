window.onload = (e) => {
    let video = document.createElement("video");
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    let msg = document.getElementById("msg");

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

    function startTick() {
        msg.innerText = "ビデオを読み込んでいます...";
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });

            if (code) {
                drawRect(code.location); // QRコードの場所に矩形を描画
                msg.innerText = `QRコードを検出しました: ${code.data}`; // QRコードのデータを表示
                
                // QRコードのスキャンが成功した時の追加リアクション
                showSuccessReaction(code.data);
                
            } else {
                msg.innerText = "QRコードを検出中...";
            }
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
        // アラートを表示
        alert("QRコードが正常にスキャンされました: " + data);
        
        // 成功メッセージを表示
        let successMessage = document.createElement("p");
        successMessage.textContent = "QRコードのスキャンに成功しました!";
        successMessage.style.color = "green";
        document.body.appendChild(successMessage);
        
        // 背景色を変更
        document.body.style.backgroundColor = "#d4edda"; // 成功の視覚的フィードバック
    }
}
