window.onload = () => {
    let video = document.getElementById("video");
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    let msg = document.getElementById("msg");
    let resultImage = document.getElementById("resultImage");
    let startButton = document.getElementById("startButton");
    let isScanning = false;
    let stream = null;

    startButton.addEventListener("click", () => {
        if (!isScanning) {
            startButton.disabled = true;
            startCamera();
        }
    });

    function startCamera() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then((mediaStream) => {
                stream = mediaStream;
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
        alert("野生のポケモンがあらわれた！"); // ポケモン出現のアラート
        let id = convertToPokemonID(data);
        fetchPokemonData(id);
    }

    function convertToPokemonID(url) {
        let sum = 0;
        for (let i = 0; i < url.length; i++) {
            sum += url.charCodeAt(i);
        }
        return (sum % 151) + 1;
    }

    function fetchPokemonData(id) {
        const apiUrl = `https://pokeapi.co/api/v2/pokemon/${id}/`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTPエラー: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("ポケモンのデータ: ", data);
                fetchJapaneseName(data.name).then(japaneseName => {
                    displayPokemonImage(data, japaneseName);
                });
            })
            .catch(error => {
                console.error("ポケAPIからポケモンの情報を取得する際にエラーが発生しました: ", error);
                msg.innerText = `ポケモンの情報を取得できませんでした (ID: ${id})。`;
                startButton.disabled = false;
            });
    }

    function fetchJapaneseName(englishName) {
        const apiUrl = `https://pokeapi.co/api/v2/pokemon-species/${englishName}/`;

        return fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTPエラー: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                for (let nameInfo of data.names) {
                    if (nameInfo.language.name === 'ja-Hrkt') {
                        return nameInfo.name;
                    }
                }
                return "日本語名が見つかりません。";
            })
            .catch(error => {
                console.error("ポケモンの日本語名を取得する際にエラーが発生しました: ", error);
                return "日本語名が見つかりません。";
            });
    }

    function displayPokemonImage(pokemonData, japaneseName) {
        const imageUrl = pokemonData.sprites.front_default;
        resultImage.src = imageUrl;
        resultImage.style.display = "block";
        msg.innerText = `ポケモン: ${japaneseName} (#${pokemonData.id})`;
        document.body.style.backgroundColor = "#d4edda";
        
        // カメラをオフにする
        if (stream) {
            let tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        isScanning = false;
        startButton.disabled = false;
    }
}
