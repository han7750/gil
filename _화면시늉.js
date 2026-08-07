// 「길」 화면이 진짜로 그려지는지 확인하는 도구 (지워도 되는 파일입니다)
//
// [이게 왜 필요한가]
// _검사.js 는 글자를 훑어보는 검사라서 "화면이 실제로 뜨는가"는 알 수 없습니다.
// 이 파일은 아주 작은 '가짜 브라우저'를 만들어서 index.html 안의 코드를 진짜로 돌려봅니다.
// 화면이 깨지면 여기서 바로 잡힙니다.
//
// [쓰는 법]  node _화면시늉.js

const fs = require("fs");
const vm = require("vm");
const { webcrypto } = require("crypto");

/* ---------- 아주 작은 가짜 브라우저 ---------- */
const 저장소 = {};
function 만들기(tag){
  return {
    tagName: tag, children: [], attrs: {}, _text: "", style: {}, hidden: false,
    get textContent(){
      return this._text + this.children.map(c => c.textContent).join("");
    },
    set textContent(v){ this._text = String(v); this.children = []; },
    set className(v){ this.attrs["class"] = v; },
    get className(){ return this.attrs["class"] || ""; },
    setAttribute(k, v){ this.attrs[k] = String(v); },
    getAttribute(k){ return this.attrs[k]; },
    removeAttribute(k){ delete this.attrs[k]; },
    appendChild(c){ this.children.push(c); return c; },
    removeChild(c){ this.children = this.children.filter(x => x !== c); },
    addEventListener(ev, fn){ (this._on = this._on || {})[ev] = fn; },
    click(){ if(this._on && this._on.click) this._on.click({}); if(this.onclick) this.onclick({}); },
    select(){}, focus(){}
  };
}
const 이름표 = {};
["langKo","langEn","app","dash","wrap","navlinks","navcta","brand","brandName"].forEach(id => {
  이름표[id] = 만들기("div"); 이름표[id].id = id;
});
const document = {
  documentElement: 만들기("html"),
  body: 만들기("body"),
  createElement: 만들기,
  getElementById: id => 이름표[id] || null,
  execCommand: () => true
};
const 창 = {
  scrollTo(){}, matchMedia: () => ({ matches:false, addEventListener(){} }),
  setTimeout, clearTimeout, crypto: webcrypto
};
const 상자 = {
  document, window: 창, console,
  location: { hash: "", href: "https://han7750.github.io/gil/" },
  navigator: { language: "ko-KR", clipboard: null },
  localStorage: {
    getItem: k => (k in 저장소 ? 저장소[k] : null),
    setItem: (k, v) => { 저장소[k] = String(v); },
    removeItem: k => { delete 저장소[k]; }
  },
  crypto: webcrypto, setTimeout, clearTimeout,
  TextEncoder, TextDecoder, btoa, atob, Blob: class {}, URL,
  alert(){}, scrollTo(){}
};
상자.globalThis = 상자;
상자.self = 상자;

/* ---------- index.html 안의 코드를 꺼내서 돌립니다 ---------- */
const html = fs.readFileSync("index.html", "utf8");
const 코드 = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));

let 실패 = 0;
function 확인(이름, 조건, 덧말){
  console.log((조건 ? "  통과  " : "★ 실패 ") + 이름 + (덧말 ? " · " + 덧말 : ""));
  if(!조건) 실패++;
}

try{
  vm.createContext(상자);
  vm.runInContext(코드, 상자, { filename: "index.html" });
}catch(e){
  console.log("★ 화면을 그리다가 멈췄습니다 → " + e.message);
  console.log(e.stack.split("\n").slice(0, 4).join("\n"));
  process.exit(1);
}

/* ---------- 첫 화면(소개 페이지)이 제대로 나왔는지 ---------- */
const 앱 = 이름표.app;
const 글 = 앱.textContent;
console.log("\n[ 첫 화면 · 한국어 ]");
확인("화면이 그려짐", 앱.children.length > 0, 앱.children.length + "덩이");
확인("큰 제목", 글.includes("가게 이야기만 적어주세요"));
확인("설명 글", 글.includes("완성된 광고 영상을 만들어"));
확인("받는 것 다섯 칸", ["완성된 광고 영상","자막이 이미 얹혀 있음","같이 올릴 광고 문구","해시태그","마음에 안 들면 다시"]
  .every(x => 글.includes(x)));
확인("진행 순서 네 걸음", 글.includes("가게 이야기를 적습니다") && 글.includes("완성된 영상을 받습니다"));
확인("자주 묻는 질문", 글.includes("정말 무료인가요?") && 글.includes("제가 찍어야 하나요?"));
확인("바닥글", 글.includes("소상공인 광고 영상 제작 대행"));
확인("운영실 문", 글.includes("운영실"));
확인("상표 이름 road", 글.includes("광고 영상은 road가") && 글.includes("road를 만든 이유") && 글.includes("road · 소상공인"));
확인("옛 이름 안 남음", !/(^|[^가-힣])길([^가-힣이]|$)/.test(글.replace(/영상 길이|길이/g,"")), 0);
확인("넓은 화면 모드", 이름표.wrap.className === "wrap home", 이름표.wrap.className);
확인("위쪽 메뉴 4개", 이름표.navlinks.children.length === 4);
확인("머리띠 신청 단추", 이름표.navcta.textContent === "무료로 신청");

/* ---------- 화면을 옮겨 다녀도 안 깨지는지 ---------- */
console.log("\n[ 화면 이동 ]");
const 갈곳 = ["tier","brief","openCode","opGate","intro"];
갈곳.forEach(s => {
  try{
    상자.go(s);
    확인(s + " 화면", 이름표.app.children.length > 0);
  }catch(e){ 확인(s + " 화면", false, e.message); }
});
확인("신청 중에는 메뉴 감춤", (상자.go("tier"), 이름표.navlinks.hidden === true && 이름표.wrap.className === "wrap"));
상자.go("intro");

/* ---------- 영어로 바꿔도 다 나오는지 ---------- */
console.log("\n[ 첫 화면 · 영어 ]");
상자.S.lang = "en";
상자.render();
const 영 = 이름표.app.textContent;
확인("영어 큰 제목", 영.includes("Just tell us about your shop"));
확인("영어 카드", 영.includes("A finished ad video") && 영.includes("Hashtags"));
확인("영어 질문", 영.includes("Is it really free?") && 영.includes("Do I have to film it?"));
확인("영어 메뉴", 이름표.navcta.textContent === "Start free");
확인("한국어 안 섞임", !/[가-힣]/.test(영), 영.match(/[가-힣]+/g) ? "남은 한글 " + 영.match(/[가-힣]+/g).slice(0,5).join(",") : "");


/* ---------- '사장님이 찍는다' 는 옛 메시지가 남아 있지 않은지 ---------- */
console.log("\n[ 서비스 설명이 바뀐 대로인가 ]");
상자.S.lang = "ko"; 상자.go("intro");
const 본문 = 이름표.app.textContent;
const 옛말 = ["찍는 건 사장님","따라 찍기","촬영 지시","준비물","편집 순서","캡컷","블로"];
const 남음 = 옛말.filter(x => 본문.includes(x));
확인("옛 설명 안 남음", 남음.length === 0, 남음.join(","));
확인("만들어 준다고 씀", 본문.includes("만들어 드립니다") && 본문.includes("촬영도 편집도"));


/* ---------- 결과 화면 : 사장님이 실제로 보는 화면 ---------- */
console.log("\n[ 결과 화면 ]");
상자.S.lang = "ko";
// 클로드가 내주는 답과 같은 모양의 가짜 결과를 하나 만들어 넣습니다
// 일부러 '예전 모양'으로 둡니다 — videoCopy·postCopy 가 없는 옛 결과입니다
상자.S.result = 상자.fillResult({
  brandLine: "12년 된 손칼국수집",
  headlines: ["새벽에 낸 육수", "점심 한 그릇", "12년째 같은 자리"],
  storyboard: [
    { time:"0-3초", visual:"육수 끓는 솥", caption:"매일 새벽 4시", voice:"" },
    { time:"3-8초", visual:"칼국수 담는 손", caption:"12년째 그대로", voice:"" }
  ],
  props: ["앞치마"], shootTips: ["가까이 찍기"],
  edit: { capcut:["자르기"], vllo:[] },
  hashtags: ["#일산맛집", "#손칼국수"],
  cta: "점심에 들러주세요"
});
상자.S.req = null;

[["plan","광고 문구"],["caption","자막"],["tags","해시태그"]].forEach(function(칸){
  try{
    상자.S.tab = 칸[0];
    상자.go("done");
    var 글 = 이름표.app.textContent;
    확인(칸[1] + " 칸", 이름표.app.children.length > 0 && 글.length > 20);
  }catch(e){ 확인(칸[1] + " 칸", false, e.message); }
});

상자.S.tab = "plan"; 상자.go("done");
var 결과글 = 이름표.app.textContent;
확인("옛 결과도 열림", 결과글.includes("새벽에 낸 육수") && 결과글.includes("12년째 같은 자리"));
확인("영상 문구 · 게시글 문구 나뉨",
  결과글.includes("영상에 쓴 문구") && 결과글.includes("게시글에 쓸 문구"));

// 새로 만든 결과는 두 가지가 따로 들어옵니다
var 새결과 = 상자.fillResult({
  brandLine:"칼국수집", headlines:[],
  videoCopy:"매일 새벽 4시",
  postCopy:["짧게 치는 글","마음을 건드리는 글","정보를 주는 글"],
  storyboard:[{ time:"0-3초", visual:"솥", caption:"새벽 4시", voice:"" }],
  hashtags:["#일산맛집"], cta:"들러주세요"
});
상자.S.result = 새결과; 상자.S.tab = "plan"; 상자.go("done");
var 새글 = 이름표.app.textContent;
확인("새 결과 · 영상 문구", 새글.includes("매일 새벽 4시"));
확인("새 결과 · 게시글 문구 3안",
  새글.includes("짧게 치는 글") && 새글.includes("마음을 건드리는 글") && 새글.includes("정보를 주는 글"));
var 새보낼글 = 상자.resultToText(새결과);
확인("보낼 글에도 나뉘어 들어감",
  새보낼글.includes("[영상에 쓴 문구]") && 새보낼글.includes("[게시글에 쓸 문구]"));
확인("촬영·편집 칸 없어짐", !결과글.includes("촬영 목록") && !결과글.includes("편집") && !결과글.includes("준비물"));

// 카톡에 그대로 보내는 글에도 촬영·편집이 빠졌는지
var 보낼글 = 상자.resultToText(상자.S.result);
확인("보낼 글에 문구·자막·해시태그",
  보낼글.includes("[영상에 쓴 문구]") && 보낼글.includes("[게시글에 쓸 문구]") &&
  보낼글.includes("[자막만]") && 보낼글.includes("[해시태그]"));
확인("보낼 글에 촬영·편집 없음",
  !보낼글.includes("촬영") && !보낼글.includes("준비물") && !보낼글.includes("캡컷") && !보낼글.includes("대본"),
  보낼글.match(/촬영|준비물|캡컷|대본/g) ? "남음 " + 보낼글.match(/촬영|준비물|캡컷|대본/g).join(",") : "");

// 클로드에게 보내는 지시문도 촬영·편집을 더 이상 시키지 않는지
var 지시문 = 상자.buildPrompt ? 상자.buildPrompt({ tier:"d1", sec:"30", brief:"칼국수집" }) : "";
if(지시문){
  확인("지시문에 촬영·편집 안 시킴",
    !지시문.includes("shootTips") && !지시문.includes("props") && !지시문.includes("capcut"));
}

/* ---------- 가게 사진 안내가 들어갔는지 ---------- */
console.log("\n[ 가게 사진 안내 ]");
상자.go("brief");
확인("적는 화면에 안내", 이름표.app.textContent.includes("가게 사진 3~4장"));
상자.S.sheet = "[road 신청서]\n납기: 하루\n길이: 30초\n연락처: -\n설명:\n칼국수집";
상자.go("sheet");
확인("보내는 화면에 안내", 이름표.app.textContent.includes("가게 사진 3~4장"));
확인("안 보내도 된다는 말 유지", 이름표.app.textContent.includes("안 보내셔도 영상은 나옵니다"));
상자.go("intro");

console.log("\n" + (실패 ? "★ " + 실패 + "곳이 잘못됐습니다" : "모두 통과 · 화면이 정상으로 그려집니다"));
process.exit(실패 ? 1 : 0);
