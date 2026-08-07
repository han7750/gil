// 「길」 카톡·검색 미리보기 그림(og.png)을 만드는 도구
//
// [이게 왜 필요한가]
// 카카오톡에 사이트 주소를 붙이면 네모난 그림 카드가 뜹니다.
// 그 그림이 없으면 주소만 파랗게 나와서, 받는 사람이 눌러도 되는 링크인지 몰라 안 누릅니다.
//
// [쓰는 법]  node _미리보기그림.js
// 그러면 같은 폴더에 og.png (1200 x 630) 가 새로 만들어집니다.
// 색이나 모양을 바꾸고 싶으면 아래 '색' 부분만 고치면 됩니다.

const fs = require("fs");
const zlib = require("zlib");

const W = 1200, H = 630;

// 색 — 사이트와 똑같은 주황·크림색입니다
const 주황 = [0xE2, 0x57, 0x1E];
const 크림 = [0xFB, 0xF4, 0xE9];

// 그림을 담을 종이. 한 점마다 빨강·초록·파랑 세 칸을 씁니다
const px = Buffer.alloc(W * H * 3);

function 칠하기(색){ for(let i = 0; i < W * H; i++) px.set(색, i * 3); }
function 점(x, y, 색){
  if(x < 0 || y < 0 || x >= W || y >= H) return;
  px.set(색, ((y | 0) * W + (x | 0)) * 3);
}
function 네모(x, y, w, h, 색){
  for(let j = y; j < y + h; j++) for(let i = x; i < x + w; i++) 점(i, j, 색);
}
// 모서리가 둥근 네모. 모서리 부분은 중심에서의 거리로 안쪽인지 판단합니다
function 둥근네모(x, y, w, h, r, 색){
  for(let j = 0; j < h; j++) for(let i = 0; i < w; i++){
    const dx = i < r ? r - i : (i >= w - r ? i - (w - r - 1) : 0);
    const dy = j < r ? r - j : (j >= h - r ? j - (h - r - 1) : 0);
    if(dx * dx + dy * dy <= r * r) 점(x + i, y + j, 색);
  }
}
// 테두리만 있는 둥근 네모 (바깥을 그리고 안쪽을 원래 색으로 도로 칠합니다)
function 둥근테두리(x, y, w, h, r, 두께, 색, 속색){
  둥근네모(x, y, w, h, r, 색);
  둥근네모(x + 두께, y + 두께, w - 두께 * 2, h - 두께 * 2, Math.max(0, r - 두께), 속색);
}

/* 동그란 획(고리)을 그립니다.
   각도를 조금씩 돌리며 점을 찍으면 사이가 벌어질 수 있어서,
   네모 칸을 훑으면서 '중심에서 얼마나 떨어졌나'로 판단합니다. 그래야 빈틈이 없습니다.
   각도는 오른쪽이 0도, 아래가 90도, 왼쪽이 180도, 위가 270도입니다. */
function 고리(cx, cy, 반지름, 두께, 시작도, 끝도, 색){
  const 밖 = 반지름 + 두께 / 2, 안 = 반지름 - 두께 / 2;
  for(let y = Math.floor(cy - 밖); y <= Math.ceil(cy + 밖); y++){
    for(let x = Math.floor(cx - 밖); x <= Math.ceil(cx + 밖); x++){
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if(d < 안 || d > 밖) continue;
      let 각 = Math.atan2(dy, dx) * 180 / Math.PI;
      if(각 < 0) 각 += 360;
      let a = 시작도, b = 끝도;
      const 안쪽 = (b >= a) ? (각 >= a && 각 <= b) : (각 >= a || 각 <= b);
      if(안쪽) 점(x, y, 색);
    }
  }
}

/* ---------------------------------------------------------
   'road' 를 동그라미와 막대만으로 그립니다.
   o · a · d 는 모두 '동그라미 + 오른쪽 세로막대' 라서 같은 방법으로 만들어집니다.
   (a 는 막대가 짧고, d 는 막대가 위로 길게 올라갑니다)
   r 은 '세로막대 + 위쪽에서 오른쪽으로 넘어가는 반쪽 고리' 입니다.
   --------------------------------------------------------- */
function road(왼쪽, 위, 소문자높이, 색){
  const h = 소문자높이;              // 동그라미의 지름 (소문자 키)
  const t = Math.round(h * 0.20);    // 획 두께
  const A = Math.round(h * 0.44);    // d 의 막대가 위로 더 올라가는 길이
  const 사이 = Math.round(h * 0.17); // 글자 사이 틈
  const R = (h - t) / 2;             // 고리의 한가운데 반지름
  const 윗줄 = 위 + A;               // 소문자들이 시작하는 높이
  const 밑줄 = 윗줄 + h;             // 글자가 앉는 바닥선
  let x = 왼쪽;

  // r — 세로막대 하나 + 위에서 오른쪽으로 넘어가는 고리 조각
  네모(x, 윗줄, t, h, 색);
  const rR = Math.round(h * 0.29);
  고리(x + t / 2 + rR, 윗줄 + t / 2 + rR, rR, t, 180, 340, 색);
  x += t / 2 + rR * 2 + t / 2 + 사이;

  // o — 완전한 동그라미
  고리(x + h / 2, 윗줄 + h / 2, R, t, 0, 360, 색);
  x += h + 사이;

  // a — 동그라미 + 오른쪽에 소문자 키만큼의 막대
  고리(x + h / 2, 윗줄 + h / 2, R, t, 0, 360, 색);
  네모(Math.round(x + h - t), 윗줄, t, h, 색);
  x += h + 사이;

  // d — 동그라미 + 오른쪽에 위로 길게 올라간 막대
  고리(x + h / 2, 윗줄 + h / 2, R, t, 0, 360, 색);
  네모(Math.round(x + h - t), 위, t, A + h, 색);
  x += h;

  return { 폭: x - 왼쪽, 밑줄: 밑줄 };
}
// 글자 전체가 차지하는 가로 폭을 미리 계산합니다 (가운데 정렬에 씁니다)
function road폭(h){
  const t = Math.round(h * 0.20), 사이 = Math.round(h * 0.17), rR = Math.round(h * 0.29);
  return (t / 2 + rR * 2 + t / 2 + 사이) + (h + 사이) * 2 + h;
}

/* ---------- 그림 그리기 ---------- */
칠하기(주황);                                  // 바탕은 주황 한 판
둥근테두리(40, 40, W - 80, H - 80, 38, 6, 크림, 주황);   // 포스터 같은 크림색 테두리

// 가운데 큰 'road'
const 소문자 = 150;
const 낱말폭 = road폭(소문자);
const 결과 = road(Math.round((W - 낱말폭) / 2), 190, 소문자, 크림);

// 글자 밑에 도로 차선 다섯 칸 — 사이트 왼쪽의 줄무늬와 같은 표시입니다
const 칸 = 5, 칸폭 = 46, 사이칸 = 20;
const 시작 = Math.round((W - (칸 * 칸폭 + (칸 - 1) * 사이칸)) / 2);
for(let i = 0; i < 칸; i++) 둥근네모(시작 + i * (칸폭 + 사이칸), 결과.밑줄 + 62, 칸폭, 12, 6, 크림);

/* ---------------------------------------------------------
   PNG 파일로 저장하기
   PNG 는 [머리말][그림][끝] 세 덩이로 되어 있고,
   덩이마다 '검사숫자(CRC)'를 붙여야 그림판이 열어줍니다.
   --------------------------------------------------------- */
const crc표 = (() => {
  const T = new Int32Array(256);
  for(let n = 0; n < 256; n++){
    let c = n;
    for(let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    T[n] = c;
  }
  return T;
})();
function crc(buf){
  let c = 0xFFFFFFFF;
  for(let i = 0; i < buf.length; i++) c = crc표[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function 덩이(이름, 속){
  const len = Buffer.alloc(4); len.writeUInt32BE(속.length);
  const 몸 = Buffer.concat([Buffer.from(이름, "ascii"), 속]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(몸));
  return Buffer.concat([len, 몸, c]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;    // 한 칸에 8비트
ihdr[9] = 2;    // 빨강·초록·파랑 방식
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// 줄마다 맨 앞에 0 을 하나 붙여야 합니다 ("이 줄은 손대지 않았음" 표시)
const 줄들 = Buffer.alloc((W * 3 + 1) * H);
for(let y = 0; y < H; y++){
  줄들[y * (W * 3 + 1)] = 0;
  px.copy(줄들, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
}

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  덩이("IHDR", ihdr),
  덩이("IDAT", zlib.deflateSync(줄들, { level: 9 })),
  덩이("IEND", Buffer.alloc(0))
]);

fs.writeFileSync("og.png", png);
console.log("og.png 를 만들었습니다 · " + W + "x" + H + " · " + (png.length / 1024).toFixed(1) + " KB");
