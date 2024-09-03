window.onload = () => {
    let video = document.getElementById("video");
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    let msg = document.getElementById("msg");
    let resultImage = document.getElementById("resultImage");
    let startButton = document.getElementById("startButton");
    let isScanning = false;
    let stream = null; // カメラストリームを保持

    startButton.addEventListener("click", () => {
        if (!isScanning) {
            startButton.disabled = true;
            startCamera();
        }
    });

    function startCamera() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then((videoStream) => {
                stream = videoStream;
                video.srcObject = stream;
                video.setAttribute("playsinline", true); // iOS対応
                video.style.display = "block";
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
        try {
            let code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (code) {
                console.log("QRコードが検出されました: ", code.data);
                drawRect(code.location); // QRコードの場所に矩形を描画
                msg.innerText = `QRコードを検出しました: ${code.data}`;
                
                showSuccessReaction(code.data); // QRコードのスキャンが成功した時のリアクションを追加
            } else {
                msg.innerText = "QRコードを検出中...";
            }
        } catch (error) {
            console.error("jsQRの処理中にエラーが発生しました: ", error);
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
        // カメラを停止
        stopCamera();
        
        // QRコードから取得したデータを整数に変換してポケモンIDを取得
        let id = convertToPokemonID(data);
        
        // ポケモンの情報を取得
        fetchPokemonData(id);
    }

    function convertToPokemonID(url) {
        // 文字列から数値を生成
        let sum = 0;
        for (let i = 0; i < url.length; i++) {
            sum += url.charCodeAt(i);
        }
        // 1から151の間に収める
        return (sum % 151) + 1;
    }

    function fetchPokemonData(id) {
        const apiUrl = `https://pokeapi.co/api/v2/pokemon/${id}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTPエラー: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("ポケモンのデータ: ", data);
                displayPokemonImage(data);
            })
            .catch(error => {
                console.error("ポケAPIからポケモンの情報を取得する際にエラーが発生しました: ", error);
                msg.innerText = `ポケモンの情報を取得できませんでした (ID: ${id})。`;
                startButton.disabled = false;
            });
    }

    function displayPokemonImage(pokemonData) {
        const imageUrl = pokemonData.sprites.front_default; // デフォルトのフロント画像を表示
        resultImage.src = imageUrl;
        resultImage.style.display = "block";
        resultImage.style.width = "300px"; // 画像を大きく表示
        resultImage.style.height = "300px"; // 画像を大きく表示
        resultImage.style.margin = "0 auto"; // 画像を中央に配置
        msg.innerText = `野生のポケモン ${pokemonData.name} (#${pokemonData.id}) が現れた！`;
        alert(`野生のポケモン ${pokemonData.name} が現れた！`); // ポップアップを表示

        startButton.disabled = false;
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        isScanning = false;
        video.style.display = "none"; // カメラ映像を非表示
    }
}
