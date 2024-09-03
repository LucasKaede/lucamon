window.onload = () => {
    let video = document.getElementById("video");
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    let msg = document.getElementById("msg");
    let resultImage = document.getElementById("resultImage");
    let startButton = document.getElementById("startButton");
    let isScanning = false;
    let stream; // カメラストリームを保持するための変数

    startButton.addEventListener("click", () => {
        if (!isScanning) {
            startButton.disabled = true;
            startCamera();
        }
    });

    function startCamera() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then((s) => {
                stream = s; // ストリームを保存
                video.srcObject = stream;
                video.setAttribute("playsinline", true); // iOS対応
                video.play();
                isScanning = true;
                startTick();
            })
            .catch((err) => {
                console.error("カメラのアクセスに失敗しました: ", err);
                msg.innerText = "カメラのアクセスに失敗しました。";
                startButton.disabled = false;
            });
    }

    function startTick() {
        if (!isScanning) return;

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
                handleQRCodeData(code.data);
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

    function handleQRCodeData(data) {
        // QRコードのデータから1から151の間の整数を取得
        let number = Math.floor(Math.abs(parseInt(data)) % 151) + 1;

        // ポケAPIからポケモンの情報を取得
        fetch(`https://pokeapi.co/api/v2/pokemon/${number}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`ポケモンの画像取得に失敗しました。ステータスコード: ${response.status}`);
                }
                return response.json();
            })
            .then(pokemonData => {
                // ポケモンの画像URLを取得
                let pokeImage = pokemonData.sprites.front_default;

                // ポケAPIからポケモンの日本語の名前を取得
                return fetch(`https://pokeapi.co/api/v2/pokemon-species/${number}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`ポケモンの日本語名取得に失敗しました。ステータスコード: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(pokemonSpeciesData => {
                        // 日本語の名前を取得
                        let pokeName = pokemonSpeciesData.names.find(name => name.language.name === "ja").name;

                        // ページにポケモンの情報を表示
                        resultImage.src = pokeImage;
                        resultImage.style.display = "block";
                        msg.innerText = `ポケモン: ${pokeName}`;
                        stopCamera(); // QRコードをスキャンした後にカメラを停止
                        startButton.disabled = false;
                    });
            })
            .catch(err => {
                console.error("ポケAPIからポケモンの情報を取得する際にエラーが発生しました: ", err);
                msg.innerText = "ポケモン情報の取得に失敗しました。";
                startButton.disabled = false;
            });
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            isScanning = false;
        }
    }
}
