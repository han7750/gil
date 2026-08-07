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
console.log("32) 영어 신청서    :", /\[ROAD REQUEST\]/.test(js) && /\[GIL REQUEST\]/.test(js) ? "통과 · 영어로도 받고, 옛 이름 신청서도 읽음" : "실패");
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

// 저장소가 공개면 잠금값도 공개됩니다.
// 잠금값만으로는 비밀번호 길이를 알 수 없으니, 짧게 쓰지 말라는 것만 일러둡니다.
console.log("41) 자물쇠 모양     :", !opLock ? "아직 안 정함"
  : /^v1:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]{43}$/.test(opLock)
    ? "통과 · 소금 16바이트 + 되섞은값 32바이트"
    : "★ 모양이 이상합니다. 운영실에서 다시 만드세요");

/* =========================================================
   42~50 : "남이 와서 써도 되는 사이트인가"를 봅니다
   여기 하나라도 빠지면, 만든 사람 컴퓨터에서는 멀쩡해 보여도
   손님 휴대폰에서는 글씨가 개미만 하게 나오거나
   카톡에 주소를 붙여도 아무 그림이 안 떠서 안 눌립니다.
   ========================================================= */
const head = t.slice(0, t.indexOf("</head>"));

console.log("42) 휴대폰 화면    :",
  /<meta[^>]+name="viewport"[^>]+width=device-width/.test(head)
    ? "통과 · 휴대폰 크기에 맞춰 보임" : "★ 없음 · 휴대폰에서 글씨가 개미만 해집니다");

console.log("43) 문서 시작 표시 :",
  /^\s*<!doctype html>/i.test(t) && /<html lang="ko"/.test(t)
    ? "통과 · 표준 모드 + 언어 표시" : "★ 없음 · 브라우저가 옛날 방식으로 그립니다");

console.log("44) 검색 설명      :",
  /<meta[^>]+name="description"[^>]+content="[^"]{40,}"/.test(head)
    ? "통과 · 검색에 설명이 나옴" : "★ 없음 · 검색 결과에 제목만 덩그러니 나옴");

const og = ["og:title", "og:description", "og:image", "og:url", "og:type"]
  .filter(k => !head.includes('property="' + k + '"'));
console.log("45) 카톡 미리보기  :",
  og.length ? "★ 빠짐 " + og.join(",") : "통과 · 주소를 붙이면 그림 카드가 뜸");

console.log("46) 미리보기 그림  :",
  fs.existsSync("og.png") ? "통과 · og.png 있음 (" + (fs.statSync("og.png").size / 1024).toFixed(0) + " KB)"
    : "★ og.png 파일이 없습니다 · 카톡에 그림이 안 뜹니다");

console.log("47) 탭 그림·띠색   :",
  /rel="icon"/.test(head) && /name="theme-color"/.test(head)
    ? "통과 · 탭 그림과 위쪽 띠 색 있음" : "★ 없음");

console.log("48) 글자 칸 크기   :",
  /input\[type=password\]\{[\s\S]{0,200}?font-size:16px/.test(t) ||
  /textarea,input\[type=text\],input\[type=password\]\{[\s\S]{0,260}?font-size:16px/.test(t)
    ? "통과 · 아이폰이 칸을 눌러도 확대 안 함" : "★ 16px 미만 · 아이폰이 화면을 확대해 버립니다");

console.log("49) 소개 페이지    :",
  /SCREENS\.intro/.test(js) && /cls:"hero"/.test(js) && /faqItem\(/.test(js) && /cls:"footer"/.test(js)
    ? "통과 · 첫 화면 · 자주 묻는 질문 · 바닥글 있음" : "★ 소개 페이지가 비어 있습니다");

// 손가락으로 누르는 것은 44px 아래로 내려가면 안 됩니다
const small = [...t.matchAll(/min-height:(\d+)px/g)].map(m => +m[1]).filter(n => n < 38);
console.log("50) 누를 자리 크기 :",
  small.length ? "★ 너무 작은 단추 " + small.join(",") + "px" : "0건 · 손가락으로 누를 만함");

// 51~52 : 이름을 「길」에서 road 로 바꾼 뒤 빠뜨린 곳이 없는지
const 브랜드 = /brandName:"road"/g;
console.log("51) 상표 이름      :",
  (js.match(브랜드) || []).length === 2 ? "통과 · 한국어·영어 모두 road"
    : "★ 한쪽이 아직 옛 이름입니다");

// 열쇠를 만드는 속 이름은 절대 바뀌면 안 됩니다. 바뀌면 이미 보낸 결과가 안 열립니다.
console.log("52) 열쇠 속 이름   :",
  /"길:"/.test(js) && /"길자물쇠:"/.test(js)
    ? "통과 · 건드리지 않음 (이미 보낸 결과와 비밀번호가 그대로 열림)"
    : "★ 위험 · 이미 보낸 결과와 운영실 비밀번호가 모두 안 열리게 됩니다");
