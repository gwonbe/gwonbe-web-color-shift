// Canvas 연결

const sourceCanvas =document.getElementById("sourceCanvas");
const sourceCtx =sourceCanvas.getContext("2d");

const resultCanvases = [
    document.getElementById("canvas0"),
    document.getElementById("canvas1"),
    document.getElementById("canvas2"),
    document.getElementById("canvas3")
];

const resultCtxs =resultCanvases.map(canvas => canvas.getContext("2d"));

// 상태 관리

const app = {
    imageLoaded:false,
    selectedColor:[ 255, 255, 255], // 원본에서 클릭한 색상
    brightness:100, // 다음 변경에 사용할 밝기
    tolerance:20 // 색상 허용 범위
};


// 원본 이미지 데이터
let originalImageData = null;

// 결과 4개의 현재 상태
const resultImageData = [null,null,null,null];

// 시작
init();

function init(){
    document.getElementById("imageInput").addEventListener("change",loadImage);
    sourceCanvas.addEventListener("click",pickColor);
    document.getElementById("tolerance").addEventListener("input",changeTolerance);
    document.getElementById("brightness").addEventListener("input",changeBrightness);
}

// 이미지 로드

function loadImage(event){
    const file = event.target.files[0];

    if(!file){
        return;
    }

    const img = new Image();

    img.onload = function(){
        sourceCanvas.width = img.width;
        sourceCanvas.height = img.height;
        sourceCtx.clearRect(0,0,img.width,img.height);
        sourceCtx.drawImage(img,0,0);

        // 원본 저장
        originalImageData =sourceCtx.getImageData(0, 0, img.width, img.height);
        app.imageLoaded = true;
        initializeResultCanvas();
    };

    img.src = URL.createObjectURL(file);
}


// 결과 캔버스 초기화

function initializeResultCanvas(){
    resultCanvases.forEach(
        canvas => {
            canvas.width = sourceCanvas.width;
            canvas.height = sourceCanvas.height;
        }
    );

    for(let i=0;i<4;i++){
        resultImageData[i] =
            new ImageData(
                new Uint8ClampedArray(originalImageData.data),
                originalImageData.width,
                originalImageData.height
            );
        resultCtxs[i].putImageData(resultImageData[i],0,0);
    }
}

// 원본 색상 선택

function pickColor(e){
    if(!app.imageLoaded){
        return;
    }

    const rect = sourceCanvas.getBoundingClientRect();
    const scaleX = sourceCanvas.width / rect.width;
    const scaleY = sourceCanvas.height / rect.height;
    const x = Math.floor( (e.clientX - rect.left) * scaleX);
    const y = Math.floor( (e.clientY - rect.top) * scaleY);
    const pixel = sourceCtx.getImageData(x, y, 1, 1).data;

    app.selectedColor = [ pixel[0], pixel[1], pixel[2] ];
    updateSelectedColor();
    applyColorChange(); // 클릭 즉시 4개 결과에 적용
}

// 선택 색상 표시

function updateSelectedColor(){
    const r = app.selectedColor[0];
    const g = app.selectedColor[1];
    const b = app.selectedColor[2];
    const hex = rgbToHex(r,g,b);
    document.getElementById("pickedHex").textContent = hex;
    document.getElementById("pickedRgb").textContent = `${r}, ${g}, ${b}`;
    document.getElementById("pickedPreview").style.backgroundColor = hex;
}

// 색상 변경 적용

function applyColorChange(){
    const colors = getPalette();

    for(let i=0;i<4;i++){
        const imageData = resultImageData[i];
        replaceColor(imageData,app.selectedColor,applyBrightness(colors[i]),app.tolerance);
        resultCtxs[i].putImageData(imageData, 0, 0);
    }
}

// 실제 색상 교체

function replaceColor(imageData, sourceColor, targetColor, tolerance){
    const data = imageData.data;

    for(let i=0; i<data.length; i+=4){
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];

        const distance = colorDistance(r, g, b, sourceColor[0], sourceColor[1], sourceColor[2]);

        if(distance <= tolerance){
            data[i] = targetColor[0];
            data[i+1] = targetColor[1];
            data[i+2] = targetColor[2];
        }
    }
}

// 색상 거리

function colorDistance(r1, g1, b1, r2, g2, b2){
    const dr=r1-r2;
    const dg=g1-g2;
    const db=b1-b2;
    return Math.sqrt(dr*dr + dg*dg + db*db);
}

// 팔레트 가져오기

function getPalette(){
    return [
        hexToRgb(document.getElementById("color0").value),
        hexToRgb(document.getElementById("color1").value),
        hexToRgb(document.getElementById("color2").value),
        hexToRgb(document.getElementById("color3").value)
    ];

}

// 밝기 적용

function applyBrightness(rgb){
    const ratio = app.brightness / 100;

    return [
        Math.min( 255, Math.round(rgb[0]*ratio)),
        Math.min( 255, Math.round(rgb[1]*ratio)),
        Math.min( 255, Math.round(rgb[2]*ratio))
    ];
}

// 밝기 변경

function changeBrightness(e){
    app.brightness =  Number(e.target.value);
    document.getElementById("brightnessValue").textContent = app.brightness+"%";
}

// 허용오차 변경

function changeTolerance(e){
    app.tolerance = Number(e.target.value);
    document.getElementById("toleranceValue").textContent = app.tolerance;
}

// 변환

function hexToRgb(hex){
    hex = hex.replace("#","");

    return [
        parseInt(hex.substring(0,2), 16),
        parseInt(hex.substring(2,4), 16),
        parseInt(hex.substring(4,6), 16)
    ];
}

function rgbToHex(r,g,b){
    return "#" + [r,g,b].map( v => v.toString(16).padStart(2,"0")).join("").toUpperCase();
}

// 컬러 팔레트 변경

document
    .querySelectorAll( 'input[type="color"]')
    .forEach(input=>{
        input.addEventListener("input",function(){});
    });

// 다운로드

document
    .querySelectorAll(".downloadBtn")
    .forEach(button=>{
        button.addEventListener(
            "click",
            function(){downloadResult(Number(this.dataset.index));}
        );
    });

function downloadResult(index){
    if(!app.imageLoaded){
        alert("이미지를 먼저 업로드하세요.");
        return;
    }

    const canvas = resultCanvases[index];
    const link = document.createElement("a");
    const now = new Date();
    const date = now.getFullYear() + String(now.getMonth()+1).padStart(2,"0") + String(now.getDate()).padStart(2,"0");
    link.download = "ColorShift_" + index + "_" + date + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}
 
// 이미지 재설정

function clearResult(){
    if(!originalImageData){
        return;
    }
    for(let i=0;i<4;i++){
        resultImageData[i] = new ImageData(
            new Uint8ClampedArray(originalImageData.data),
            originalImageData.width,
            originalImageData.height
        );
        resultCtxs[i].putImageData(resultImageData[i],0,0);
    }
}

// 초기 표시

document.getElementById("brightnessValue").textContent = app.brightness+"%";
document.getElementById("toleranceValue").textContent = app.tolerance;

// 원본 색상 팔레트 변경

document
    .getElementById("sourceColor")
    .addEventListener(
        "input",
        function(){
            app.selectedColor = hexToRgb(this.value);
            updateSelectedColor();
        }
    );