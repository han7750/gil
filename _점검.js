// 「road」 점검을 한 번에 돌리는 도구
//
// [이게 왜 필요한가]
// 검사 도구가 셋으로 늘어나서 매번 따로 치기가 번거롭습니다.
// 이 파일이 셋을 차례로 돌리고, 결과를 한눈에 보이게 정리해 줍니다.
//
// [쓰는 법]
//   _점검.bat 을 두 번 클릭   ← 가장 쉬움
//   node _점검.js             ← 명령으로 돌릴 때
//   node _점검.js 자세히      ← 통과한 항목까지 전부 보고 싶을 때

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

process.chdir(__dirname);
const 자세히 = process.argv.slice(2).some(x => /자세히|all|-v/.test(x));

const 줄 = "─".repeat(56);
const 굵은줄 = "═".repeat(56);

console.log("");
console.log(굵은줄);
console.log("   road 점검  ·  " + new Date().toLocaleString("ko-KR"));
console.log(굵은줄);
console.log("");

let 탈난곳 = 0;

/* 노드 도구 하나를 돌리고, ★ 가 몇 개 나왔는지 셉니다.
   ★ 는 두 검사 도구가 "이건 잘못됐다"를 표시할 때 쓰는 글자입니다. */
function 돌리기(이름, 파일) {
  const r = spawnSync(process.execPath, [파일], { encoding: "utf8" });
  const 글 = (r.stdout || "") + (r.stderr || "");
  const 줄들 = 글.split(/\r?\n/).filter(x => x.trim());
  const 나쁨 = 줄들.filter(x => x.includes("★"));
  const 좋음 = 줄들.filter(x => x.includes("통과") || x.includes("0건")).length;

  // 도구 자체가 터진 경우 (문법이 깨졌거나 화면을 그리다 멈춘 경우)
  if (r.status !== 0 && !나쁨.length) {
    console.log(" ★ " + 이름 + " — 도구가 멈췄습니다");
    console.log("");
    줄들.slice(0, 12).forEach(x => console.log("     " + x));
    console.log("");
    탈난곳++;
    return;
  }

  if (나쁨.length) {
    console.log(" ★ " + 이름 + " — " + 나쁨.length + "곳 잘못됨");
    console.log("");
    나쁨.forEach(x => console.log("     " + x.trim()));
    console.log("");
    탈난곳 += 나쁨.length;
  } else {
    console.log("  ✓ " + 이름 + " — 통과 (" + 좋음 + "개 확인)");
  }

  if (자세히) {
    console.log("");
    줄들.forEach(x => console.log("     " + x));
    console.log("");
  }
}

돌리기("① 글자 검사   (빠진 게 없나)", "_검사.js");
돌리기("② 화면 실행   (진짜 그려지나)", "_화면시늉.js");

/* ③ 카톡 미리보기 그림.
   매번 새로 만들면 바뀐 게 없는데도 파일이 건드려집니다.
   그래서 '그림 만드는 도구가 그림보다 나중에 고쳐졌을 때'만 새로 만듭니다. */
function 그림() {
  const 그림파일 = "og.png";
  const 도구 = ["_미리보기그림.js", "_미리보기그림.ps1"];

  const 없음 = 도구.filter(f => !fs.existsSync(f));
  if (없음.length) {
    console.log(" ★ ③ 미리보기 그림 — 도구가 없습니다: " + 없음.join(", "));
    탈난곳++;
    return;
  }

  const 있나 = fs.existsSync(그림파일);
  const 그림시각 = 있나 ? fs.statSync(그림파일).mtimeMs : 0;
  const 도구시각 = Math.max(...도구.map(f => fs.statSync(f).mtimeMs));

  if (있나 && 도구시각 <= 그림시각) {
    const kb = (fs.statSync(그림파일).size / 1024).toFixed(0);
    console.log("  ✓ ③ 미리보기 그림 — 그대로 (" + kb + " KB · 바뀐 게 없어 새로 안 만듦)");
    return;
  }

  // 바탕을 그리고(노드), 그 위에 한 줄 글을 얹습니다(윈도우 글꼴)
  const a = spawnSync(process.execPath, ["_미리보기그림.js"], { encoding: "utf8" });
  if (a.status !== 0) {
    console.log(" ★ ③ 미리보기 그림 — 바탕을 그리다 멈췄습니다");
    탈난곳++;
    return;
  }
  const b = spawnSync("powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "_미리보기그림.ps1"],
    { encoding: "buffer" });
  if (b.status !== 0) {
    console.log(" ★ ③ 미리보기 그림 — 글자를 얹다 멈췄습니다 (파워셸)");
    탈난곳++;
    return;
  }
  const kb = (fs.statSync(그림파일).size / 1024).toFixed(0);
  console.log("  ✓ ③ 미리보기 그림 — 새로 만듦 (" + kb + " KB)");
}
그림();

/* ---------- 마무리 ---------- */
console.log("");
console.log(줄);
if (탈난곳) {
  console.log("");
  console.log("   ★ 고칠 것이 " + 탈난곳 + "곳 있습니다.");
  console.log("");
  console.log("   위에 ★ 로 표시된 줄을 그대로 클로드에게 보여주세요.");
  console.log("   그 상태로는 사이트에 올리지 마세요.");
} else {
  console.log("");
  console.log("   ✓ 전부 통과했습니다. 올려도 됩니다.");
  console.log("");
  console.log("   올리려면 아래를 차례로 치세요:");
  console.log("");
  console.log("      git add -A");
  console.log("      git commit -m \"무엇을 고쳤는지\"");
  console.log("      git push");
  console.log("");
  console.log("   올리고 1~2분 뒤 https://han7750.github.io/gil/ 에 반영됩니다.");
}
console.log("");
console.log(줄);
console.log("");

process.exit(탈난곳 ? 1 : 0);
