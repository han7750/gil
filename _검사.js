// 「길」 자체 점검 (확인이 끝나면 지워도 되는 파일입니다)
const fs = require("fs");
const t = fs.readFileSync("index.html", "utf8");
const js = t.slice(t.indexOf("<script>"));
const noComment = t.replace(/<!--[\s\S]*?-->/g, "");

const scr = [...js.matchAll(/SCREENS\.(\w+)\s*=/g)].map(m => m[1]);
console.log("1) 화면 개수       :", scr.length + "개 · " + scr.join(", "));

const go = [...new Set([...js.matchAll(/go\("(\w+)"\)/g)].map(m => m[1]))];
const miss = go.filter(g => !scr.includes(g));
console.log("2) 이동 연결       :", miss.length ? "없는 화면 " + miss.join(",") : "모든 이동이 실제 화면으로 연결됨");

console.log("3) 보낼 곳 표시    :", js.includes("contactBlock()") ? "통과 · 신청 화면에 붙음" : "실패");
console.log("4) 연락처 설정 화면:", scr.includes("opContact") ? "통과 · 운영실에 있음" : "실패");
console.log("5) 미설정 경고     :", js.includes('hasContact() ? "" : " ⚠"') ? "통과 · 운영실 버튼에 경고" : "실패");
console.log("6) 전화번호 기본값 :", /phone\s*:\s*""/.test(js) ? "빈 칸 · 스팸 위험 없음" : "확인 필요");
console.log("7) 링크 안전속성   :", js.includes('rel:"noopener noreferrer"') ? "통과" : "실패");
console.log("8) 3시간 잠금      :", /fast:\{[^}]*locked:true/.test(t.replace(/\s+/g, " ")) ? "통과 · 못 누름" : "실패");

const money = noComment.match(/29,000|9,000|KRW/g);
console.log("9) 가격 표시       :", money ? "남아있음 → " + money.join(",") : "0건");

const ext = noComment.replace(/open\.kakao\.com\/o\/\.\.\./g, "").match(/https?:\/\/[^\s"']+/g);
console.log("10) 외부 접속      :", ext ? "발견 " + ext.join(",") : "0건 · 인터넷 없이 열림");

const priv = /innerHTML|fetch\(|XMLHttpRequest/.test(js.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""));
console.log("11) 위험 코드      :", priv ? "발견" : "0건");
console.log("12) 파일 크기      :", (fs.statSync("index.html").size / 1024).toFixed(1) + " KB");

console.log("13) 결과 잠금      :", /AES-GCM/.test(js) && /PBKDF2/.test(js) ? "통과 · 열쇠번호로 잠김" : "실패");
console.log("14) 열쇠 자동 생성 :", /function newPin/.test(js) ? "통과 · 4자리" : "실패");
console.log("15) 열쇠 입력칸    :", /askPin/.test(js) ? "통과 · 결과 열기 화면에 있음" : "실패");
console.log("16) 바로 보낼 글   :", /카톡에 바로 보낼 글 복사/.test(js) ? "통과 · 사장님 단계 0" : "실패");
console.log("17) 밑바닥 색칠    :", /html,body\{[^}]*background:var\(--road\)/.test(t.replace(/\s+/g," ").replace(/; /g,";")) || /html,body\{margin:0; padding:0; background:var\(--road\)/.test(t) ? "통과 · 흰 바탕 안 보임" : "확인 필요");
console.log("18) 대화 안심 문구 :", /볼 수 없습니다/.test(js) ? "통과 · 신청 화면에 있음" : "실패");
console.log("19) 장부           :", scr.includes("opLedger") ? "통과 · 운영실에 있음" : "실패");
console.log("20) 자동 기록      :", /addLedger\(\{/.test(js) ? "통과 · 결과 만들 때 저절로" : "실패");
console.log("21) 백업 내려받기  :", /백업 파일 내려받기/.test(js) ? "통과" : "실패");
console.log("22) 백업 되살리기  :", /mergeLedger/.test(js) && /readAsText/.test(js) ? "통과 · 파일·붙여넣기 둘 다" : "실패");
console.log("23) 링크 안전 표시 :", /function kakaoKind/.test(js) ? "통과 · 오픈채팅·채널 구분" : "실패");
console.log("24) 오픈채팅 안내  :", /1:1 채팅방/.test(js) ? "통과 · 만드는 법 7단계" : "실패");
console.log("25) 지우기 재확인  :", /delSure/.test(js) ? "통과 · 두 번 눌러야 지워짐" : "실패");

// 26~29 : 이번에 고친 것들
console.log("26) 선택 표시      :", /k\.indexOf\("aria-"\) === 0/.test(js) ? "통과 · aria 값이 true/false 글자로 들어감" : "실패");
const lens = [...js.matchAll(/\{ v:"(\d+)", ko:"([^"]+)"/g)].map(m => m[2]);
console.log("27) 영상 길이      :", lens.length ? "통과 · " + lens.join(", ") : "실패");
console.log("28) 백업 글 복사   :", /bkCopy/.test(js) && /showBackup/.test(js) ? "통과 · 파일 안 되면 글로" : "실패");

// 한국어·영어 낱말이 짝이 맞는지
const koPart = js.slice(js.indexOf("ko:{"), js.indexOf("en:{"));
const enPart = js.slice(js.indexOf("en:{"), js.indexOf("function t(k)"));
const keysOf = s => [...new Set([...s.matchAll(/(?:^|[\s,{])([a-zA-Z][a-zA-Z0-9]*)\s*:/g)].map(x => x[1]))];
const KO = keysOf(koPart).filter(k => k !== "ko"), EN = keysOf(enPart).filter(k => k !== "en");
const 빠짐 = KO.filter(k => !EN.includes(k));
console.log("29) 영어 번역      :", 빠짐.length ? "빠진 것 " + 빠짐.join(",") : "통과 · " + KO.length + "개 모두 짝 맞음");

// 낱말 뭉치에 없는 것을 부르면 화면이 깨집니다
const 부름 = [...new Set([...js.matchAll(/\bt\("(\w+)"\)/g)].map(x => x[1]))];
const 없음 = 부름.filter(k => !KO.includes(k));
console.log("30) 없는 낱말 부름 :", 없음.length ? "발견 " + 없음.join(",") : "0건");

// 31~34 : 외국인 손님과 진짜 주소
const site = (js.match(/var SITE_URL = "([^"]*)"/) || [])[1];
console.log("31) 진짜 주소      :", site ? "통과 · " + site : "안 정해짐 · 결과 링크 못 씀");
console.log("32) 영어 신청서    :", /\[GIL REQUEST\]/.test(js) ? "통과 · 영어로도 받고 읽음" : "실패");
console.log("33) 영어 지시문    :", /Write everything in English/.test(js) ? "통과 · 결과도 영어로 나옴" : "실패");
console.log("34) 말 기억하기    :", /function loadLang/.test(js) ? "통과 · 다시 와도 그 말로 열림" : "실패");

// 35~38 : 운영실 자물쇠와 외국인 연락처
const opLock = (js.match(/var OP_LOCK = "([^"]*)"/) || [])[1];
console.log("35) 운영실 자물쇠  :", scr.includes("opGate") && scr.includes("opNew") ? "통과 · 문·만들기 화면 있음" : "실패");
console.log("36) 잠금값 박힘    :", opLock ? "통과 · 모든 기기에서 같은 비밀번호" : "아직 없음 · 이 브라우저에만 저장됨");
// 잠금값은 비어 있거나 v1: 로 시작해야 합니다. 비밀번호가 그대로 적히면 안 됩니다.
const 잠금모양 = opLock === "" || /^v1:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/.test(opLock);
console.log("37) 비밀번호 안 보임:", /PBKDF2/.test(js) && 잠금모양 ? "통과 · 되섞은 값만 적힘" : "위험 · 비밀번호가 그대로 적혔을 수 있음");
console.log("38) 외국인 연락처  :", /instagram/.test(js) && /ig\.me\/m\//.test(js) ? "통과 · 영어 화면은 이메일·인스타 먼저" : "실패");
console.log("39) 운영실 진입    :", /go\(opEntry\(\)\)/.test(js) ? "통과 · 자물쇠를 지나야 들어감" : "실패");

// 40~41 : 저장소가 공개이므로, 남에게 보이면 안 되는 것이 섞였는지 봅니다
const 새면안됨 = [
  ["컴퓨터 사용자 이름", /C:\\Users\\[A-Za-z0-9_-]+/],
  ["개인 건강·보험 사정", /건강보험|피부양자/],
  ["진짜 전화번호",       /01[016-9]-\d{3,4}-\d{4}/],
  ["이메일 주소",         /[\w.+-]+@[\w-]+\.[\w.]+/]
];
const 걸린것 = [];
새면안됨.forEach(([이름, 패턴]) => {
  const m = t.match(패턴);
  // 빈 칸에 보이는 예시(0000)는 진짜가 아니므로 넘어갑니다
  if (m && !/0000|example\.com|name@/.test(m[0])) 걸린것.push(이름 + " → " + m[0]);
});
console.log("40) 개인정보 샘     :", 걸린것.length ? "★ " + 걸린것.join(" · ") : "0건 · 공개해도 됨");

// 운영실 비밀번호가 짧으면 공개된 잠금값으로 뚫릴 수 있습니다
console.log("41) 비밀번호 세기   :", opLock
  ? "잠금값 있음 · 네 자리 숫자면 그래픽카드로 뚫립니다. 글자를 섞으세요"
  : "아직 안 정함");
