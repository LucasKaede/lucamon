document.getElementById("start-camera").addEventListener("click", function() {
    const video = document.getElementById("camera-preview");
    const canvas = document.getElementById("qr-canvas");
    const context = canvas.getContext("2d");

    // カメラのストリームを取得
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(function(stream) {
        video.srcObject = stream;
        video.setAttribute("playsinline", true); // iOS用の設定
        video.play();
        requestAnimationFrame(scanQRCode);
    }).catch(function(err) {
        console.error("カメラのアクセスに失敗しました: ", err);
    });

    function scanQRCode() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // ビデオのフレームサイズに合わせてキャンバスのサイズを設定
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                console.log("QRコード検出: ", code.data);
                handleQRCode(code.data);
                stopVideoStream();
                return;
            } else {
                console.log("QRコードが検出されませんでした");
            }
        }
        requestAnimationFrame(scanQRCode);
    }

    function handleQRCode(url) {
        // URLから数値を取得し、101までの整数に変換する関数
        const number = convertURLToNumber(url);

        // 画像を表示する
        const imgElement = document.getElementById("display-image");
        imgElement.src = `images/${number}.jpg`;
    }

    function convertURLToNumber(url) {
        // URLを整数に変換する簡単な例
        let sum = 0;
        for (let i = 0; i < url.length; i++) {
            sum += url.charCodeAt(i);
        }
        return (sum % 101) + 1; // 1から101の間の数値に変換
    }

    function stopVideoStream() {
        // カメラストリームを停止
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
});
