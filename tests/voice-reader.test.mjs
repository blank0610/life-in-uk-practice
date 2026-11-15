import test from "node:test";
import assert from "node:assert/strict";
import {questionSpeechParts,answerSpeechParts,selectEnglishVoice,createVoiceReader} from "../site/assets/voice-reader.js";

const q={
  question:"When did the Black Death come to England?",
  display:["In 1358","In 1348","In 1248","In 1414"],
  correctAnswers:["In 1348"],
  explanation:"In 1348, a disease, probably a form of plague, came to Britain."
};
test("答题前只读题目与当前随机选项，不泄露正确答案",()=>{
  const p=questionSpeechParts(q);
  assert.deepEqual(p,[
    "When did the Black Death come to England?",
    "Option A. In 1358","Option B. In 1348","Option C. In 1248","Option D. In 1414"
  ]);
  assert(!p.some(x=>x.includes("The correct answer is")));
  assert(!p.some(x=>x.includes("a disease")));
});
test("作答后朗读正确答案及完整解释",()=>{
  assert.deepEqual(answerSpeechParts(q),[
    "The correct answer is In 1348.",
    "In 1348, a disease, probably a form of plague, came to Britain."
  ]);
  assert.deepEqual(answerSpeechParts({correctAnswers:["A","B"],explanation:"Two answers."}),[
    "The correct answers are A; B.","Two answers."
  ]);
  assert.deepEqual(answerSpeechParts(null),[]);
});
test("选语音：优先 en-GB，其次可用英语声音",()=>{
  const voices=[{lang:"en-US",name:"American"},{lang:"en-GB",name:"British"},{lang:"fr-FR"}];
  assert.equal(selectEnglishVoice(voices)?.name,"British");
  assert.equal(selectEnglishVoice(voices.slice(0,1))?.name,"American");
  assert.equal(selectEnglishVoice([{lang:"fr-FR"}]),null);
});
test("按顺序阅读、停止朗读取消剩余文本",()=>{
  const utterances=[],statuses=[];
  let cancelled=0;
  class Utterance{constructor(text){this.text=text;}}
  const synthesis={
    speak(u){utterances.push(u);},
    cancel(){cancelled++;},
    getVoices(){return [{lang:"en-US"},{lang:"en-GB"}];}
  };
  const reader=createVoiceReader({synthesis,Utterance,onStatus:s=>statuses.push(s)});
  assert.equal(reader.supported,true);
  assert.equal(reader.playQuestion(q),true);
  assert.equal(utterances[0].text,q.question);
  assert.equal(utterances[0].lang,"en-GB");
  const onEnd=utterances[0].onend;
  onEnd();
  assert.equal(utterances[1].text,"Option A. In 1358");
  reader.stop();
  utterances[1].onend();
  assert.equal(utterances.length,2,"停止后不能自动朗读余下选项");
  assert.equal(reader.isPlaying(),false);
  assert(cancelled>=2);
  assert(statuses.includes("speaking"));
});
test("开始答案朗读时会中断之前未结束的题目阅读",()=>{
  const spoken=[];
  class Utterance{constructor(text){this.text=text;}}
  const reader=createVoiceReader({synthesis:{
    speak(u){spoken.push(u);},cancel(){},getVoices(){return [];}
  },Utterance});
  reader.playQuestion(q);
  const earlier=spoken[0];
  reader.playAnswer(q);
  assert.equal(spoken.at(-1).text,"The correct answer is In 1348.");
  const before=spoken.length;
  earlier.onend();
  assert.equal(spoken.length,before);
  spoken.at(-1).onend();
  assert.equal(spoken.at(-1).text,q.explanation);
});
test("不支持浏览器语音时安全禁用",()=>{
  const reader=createVoiceReader({});
  assert.equal(reader.supported,false);
  assert.equal(reader.playQuestion(q),false);
  reader.stop();
});
