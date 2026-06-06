const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let imageLoaded = false;

// 색상 표기 모드

document
.querySelectorAll('input[name="colorMode"]')
.forEach(radio => {
    radio.addEventListener('change', () => {
        const mode = document.querySelector('input[name="colorMode"]:checked').value;
        document.getElementById('hexInputs').classList.toggle('hidden', mode !== 'hex');
        document.getElementById('rgbInputs').classList.toggle('hidden', mode !== 'rgb');
    });
});

// 이미지 파일

document
.getElementById('imageInput')
.addEventListener('change', function(e){
    const file = e.target.files[0];
    if(!file) return;

    const img = new Image();

    img.onload = function(){

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img,0,0);

        imageLoaded = true;
    };

    img.src = URL.createObjectURL(file);
});

// 색상 표기 변경

function rgbToHex(r,g,b){
    return "#" + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase();
}

function hexToRgb(hex){
    hex = hex.replace('#','');
    if(hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    return [
        parseInt(hex.substring(0,2),16),
        parseInt(hex.substring(2,4),16),
        parseInt(hex.substring(4,6),16)
    ];
}

// 이미지 클릭 이벤트

canvas.addEventListener('click', function(e){
    if(!imageLoaded) return;

    const eyedropper = document.getElementById('eyedropperMode');
    if(!eyedropper.checked) return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x,y,1,1).data;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const hex = rgbToHex(r,g,b);

    document.getElementById('pickedHex').textContent = hex;
    document.getElementById('pickedRgb').textContent = `${r}, ${g}, ${b}`;
    document.getElementById('colorPreview').style.backgroundColor = hex;

    const mode = document.querySelector('input[name="colorMode"]:checked').value;

    if(mode === 'hex'){
        document.getElementById('sourceHex').value = hex;
    }else{
        document.getElementById('sr').value = r;
        document.getElementById('sg').value = g;
        document.getElementById('sb').value = b;
    }
});

function getColors(){
    const mode = document.querySelector( 'input[name="colorMode"]:checked').value;

    if(mode === 'hex'){
        return {
            source:hexToRgb(document.getElementById('sourceHex').value),
            target:hexToRgb(document.getElementById('targetHex').value)
        };
    }else{
        return {
            source: [
                Number(document.getElementById('sr').value),
                Number(document.getElementById('sg').value),
                Number(document.getElementById('sb').value)
            ],
            target: [
                Number(document.getElementById('tr').value),
                Number(document.getElementById('tg').value),
                Number(document.getElementById('tb').value)
            ]
        };
    }
}

function colorDistance(r1, g1, b1, r2, g2, b2){
    const dr = r1-r2;
    const dg = g1-g2;
    const db = b1-b2;

    return Math.sqrt(dr*dr + dg*dg + db*db);
}

document
.getElementById('replaceBtn')
.addEventListener('click', () => {
    if(!imageLoaded){
        alert('이미지를 먼저 업로드하세요.');
        return;
    }

    const colors = getColors();
    const source = colors.source;
    const target = colors.target;
    const tolerance = Number(document.getElementById('tolerance').value); // 허용 오차
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for(let i=0; i<data.length; i+=4){
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];

        const dist =colorDistance(r, g, b, source[0], source[1], source[2]);

        if(dist <= tolerance){
            data[i]   = target[0];
            data[i+1] = target[1];
            data[i+2] = target[2];
        }
    }

    ctx.putImageData(imageData, 0, 0);
});

document
.getElementById('downloadBtn')
.addEventListener('click', () => {
    if (!imageLoaded) {
        alert('이미지를 먼저 업로드하세요.');
        return;
    }

    const now = new Date();

    const dateStr =
        now.getFullYear().toString() + "-" +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');

    const link = document.createElement('a');

    link.download = `${dateStr}-.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// 색상 선택기 생성

const pickr = Pickr.create({
    el: '#picker',
    theme: 'classic',
    default: '#FFFFFF',
    components: {
        preview: true,
        opacity: false,
        hue: true,
        interaction: {
            hex: true,
            rgba: true,
            input: true,
            save: true
        }
    }
});

// 색상 선택기에서 컬러를 선택 했을 때

pickr.on('save', (color) => {
    const hex =color.toHEXA().toString().toUpperCase();
    const rgb = hexToRgb(hex);

    document.getElementById('targetHex').value = hex;
    document.getElementById('tr').value = rgb[0];
    document.getElementById('tg').value = rgb[1];
    document.getElementById('tb').value = rgb[2];

    pickr.hide();
});