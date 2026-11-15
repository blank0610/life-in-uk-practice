// 自动换题的选项逻辑独立于网页，便于测试及兼容旧浏览器存档。
export function autoNextIsEnabled(value){return value!==false;}
export function shouldAutoAdvance({enabled,isCorrect,inPractice,isSpeaking=false}={}){
  return autoNextIsEnabled(enabled)&&isCorrect===true&&inPractice===true&&!isSpeaking;
}
