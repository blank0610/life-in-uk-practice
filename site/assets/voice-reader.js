// 浏览器原生语音朗读：无第三方 API、无麦克风权限、无云端依赖。
export function questionSpeechParts(question){
  if(!question||!Array.isArray(question.display))return [];
  return [
    String(question.question||"").trim(),
    ...question.display.map((value,index)=>"Option "+String.fromCharCode(65+index)+". "+String(value).trim())
  ].filter(Boolean);
}
export function answerSpeechParts(question){
  if(!question||!Array.isArray(question.correctAnswers)||!question.correctAnswers.length)return [];
  const label=question.correctAnswers.length===1?"The correct answer is ":"The correct answers are ";
  return [label+question.correctAnswers.join("; ")+".",String(question.explanation||"").trim()].filter(Boolean);
}
export function selectEnglishVoice(voices=[]){
  return voices.find(v=>String(v?.lang||"").toLowerCase()==="en-gb")
    ||voices.find(v=>String(v?.lang||"").toLowerCase().startsWith("en-gb"))
    ||voices.find(v=>String(v?.lang||"").toLowerCase().startsWith("en"))
    ||null;
}
export function createVoiceReader({synthesis,Utterance,rate=0.92,onStatus=()=>{}}={}){
  const supported=Boolean(synthesis&&typeof synthesis.speak==="function"&&typeof synthesis.cancel==="function"&&typeof Utterance==="function");
  let generation=0,playing=false;
  function stop(){
    generation++;
    if(supported)synthesis.cancel();
    const wasPlaying=playing;playing=false;
    if(wasPlaying)onStatus("stopped");
  }
  function play(parts){
    if(!supported||!Array.isArray(parts)||!parts.some(x=>String(x||"").trim()))return false;
    stop();
    const id=generation;
    const chunks=parts.map(x=>String(x||"").trim()).filter(Boolean);
    let index=0;
    playing=true;
    onStatus("speaking");
    const voice=selectEnglishVoice(synthesis.getVoices?.()||[]);
    function continueSpeech(){
      if(generation!==id)return;
      if(index>=chunks.length){playing=false;onStatus("ended");return;}
      const line=new Utterance(chunks[index++]);
      line.lang=voice?.lang||"en-GB";
      line.rate=rate;
      if(voice)line.voice=voice;
      line.onend=continueSpeech;
      line.onerror=()=>{
        if(generation===id){playing=false;onStatus("error");}
      };
      try{synthesis.speak(line);}
      catch{if(generation===id){playing=false;onStatus("error");}}
    }
    continueSpeech();
    return true;
  }
  return {supported,stop,playQuestion(q){return play(questionSpeechParts(q));},playAnswer(q){return play(answerSpeechParts(q));},isPlaying(){return playing;}};
}
