(() => {
"use strict";
const $=id=>document.getElementById(id);
const input=$("imageInput"),wasm=$("runWasm"),gpu=$("runWebGpu"),download=$("downloadPng");
const status=$("status"),log=$("log"),progress=$("progress"),original=$("originalPreview"),resultCanvas=$("resultCanvas");
const editor=$("editorCanvas"),stage=$("editorStage");
let worker=null,file=null,image=null,objectUrl=null,lastAlpha=null,lastMetrics=null,maskAlpha=null,tool="remove",drawing=false,strokeChanged=false;
let undoStack=[],redoStack=[],lastPoint=null;
const say=m=>status.textContent=m,record=m=>{log.textContent+="\n"+m;log.scrollTop=log.scrollHeight;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function setBusy(v){wasm.disabled=v||!image;gpu.disabled=v||!image;input.disabled=v;download.disabled=v||!maskAlpha;}
function memoryText(bytes=0){const m=performance.memory;if(m&&Number.isFinite(m.usedJSHeapSize))return(m.usedJSHeapSize/1048576).toFixed(1)+" MB heap";return bytes?"~"+(bytes/1048576).toFixed(1)+" MB buffers":"não exposta";}
function initWorker(){if(worker)worker.terminate();worker=new Worker("./isnet-worker.js");worker.onmessage=onWorkerMessage;worker.onerror=e=>{say("Falha no worker: "+e.message);record("Worker error: "+e.message);setBusy(false);};}
function onWorkerMessage(event){const d=event.data;
 if(d.type==="download-progress"){progress.style.width=Math.min(100,d.loaded/d.total*100)+"%";say("Baixando modelo: "+(d.loaded/1048576).toFixed(1)+" MB");}
 if(d.type==="model-ready"){$("downloadMetric").textContent=(d.bytes/1048576).toFixed(1)+" MB";record("Modelo baixado: "+(d.bytes/1048576).toFixed(2)+" MB em "+Math.round(d.downloadMs)+" ms.");}
 if(d.type==="session-ready"){$("sessionMetric").textContent=Math.round(d.sessionMs)+" ms";record("Sessão "+d.provider+": "+Math.round(d.sessionMs)+" ms. Entradas: "+d.inputNames.join(", ")+"; saídas: "+d.outputNames.join(", "));}
 if(d.type==="result"){lastAlpha=new Uint8ClampedArray(d.alpha);lastMetrics=d;$("inferenceMetric").textContent=Math.round(d.inferenceMs)+" ms";$("memoryMetric").textContent=memoryText(d.estimatedBufferBytes);createNativeMask();paintRawResult();say("Concluído com "+d.provider+". Ajuste a máscara no refinador abaixo.");record("Inferência "+d.provider+": "+Math.round(d.inferenceMs)+" ms; buffers estimados: "+(d.estimatedBufferBytes/1048576).toFixed(1)+" MB; faixa de saída: "+d.min.toFixed(4)+"–"+d.max.toFixed(4)+".");setBusy(false);}
 if(d.type==="error"){say("Falha no backend "+d.provider+": "+d.message+(d.provider==="webgpu"?" · tente WASM.":""));record("ERRO "+d.provider+": "+d.message);setBusy(false);if(worker){worker.terminate();worker=null;}}
}
function createNativeMask(){
 const w=image.naturalWidth,h=image.naturalHeight,tmp=document.createElement("canvas");tmp.width=1024;tmp.height=1024;
 const t=tmp.getContext("2d"),id=t.createImageData(1024,1024);
 for(let i=0;i<lastAlpha.length;i++){const p=i*4;id.data[p]=id.data[p+1]=id.data[p+2]=255;id.data[p+3]=lastAlpha[i];}
 t.putImageData(id,0,0);const scaled=document.createElement("canvas");scaled.width=w;scaled.height=h;
 const s=scaled.getContext("2d",{willReadFrequently:true});s.imageSmoothingEnabled=true;s.imageSmoothingQuality="high";s.drawImage(tmp,0,0,w,h);
 const pixels=s.getImageData(0,0,w,h).data;maskAlpha=new Uint8ClampedArray(w*h);for(let i=0;i<maskAlpha.length;i++)maskAlpha[i]=pixels[i*4+3];
 undoStack=[];redoStack=[];$("editorEmpty").hidden=true;syncHistory();renderEditor();
}
function processedMask(){
 const w=image.naturalWidth,h=image.naturalHeight,threshold=Number($("maskThreshold").value),opacity=Number($("resultOpacity").value)/100;
 const c=document.createElement("canvas");c.width=w;c.height=h;const ctx=c.getContext("2d");
 const id=ctx.createImageData(w,h),soft=Number($("edgeSoftness").value);
 for(let i=0;i<maskAlpha.length;i++){let a=maskAlpha[i];if(threshold)a=clamp((a-threshold*2.55)/(255-threshold*2.55)*255,0,255);id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=255;id.data[i*4+3]=Math.round(a*opacity);}
 ctx.putImageData(id,0,0);
 if(soft>0){const blurred=document.createElement("canvas");blurred.width=w;blurred.height=h;const b=blurred.getContext("2d");b.filter="blur("+soft+"px)";b.drawImage(c,0,0);return blurred;}
 return c;
}
function drawComposite(target,includeBackground,overlay){
 const w=image.naturalWidth,h=image.naturalHeight,ctx=target.getContext("2d");target.width=w;target.height=h;ctx.clearRect(0,0,w,h);
 if(includeBackground){const mode=$("previewBackground").value;if(mode==="custom"||mode!=="checker"){ctx.fillStyle=mode==="custom"?$("customBackground").value:mode;ctx.fillRect(0,0,w,h);}}
 ctx.drawImage(image,0,0,w,h);ctx.globalCompositeOperation="destination-in";ctx.drawImage(processedMask(),0,0);ctx.globalCompositeOperation="source-over";
 if(overlay&&$("showMaskOverlay").checked){const tint=ctx.createImageData(w,h);for(let i=0;i<maskAlpha.length;i++){const p=i*4;tint.data[p]=255;tint.data[p+1]=45;tint.data[p+2]=45;tint.data[p+3]=Math.round((255-maskAlpha[i])*.42);}const layer=document.createElement("canvas");layer.width=w;layer.height=h;layer.getContext("2d").putImageData(tint,0,0);ctx.drawImage(layer,0,0);}
}
function paintRawResult(){if(!maskAlpha||!image)return;drawComposite(resultCanvas,false,false);renderEditor();}
function renderEditor(){if(!maskAlpha||!image)return;drawComposite(editor,true,true);const z=Number($("zoomRange").value);editor.style.width=(image.naturalWidth*z/100)+"px";editor.style.height="auto";$("zoomValue").textContent=z+"%";stage.classList.toggle("solid",$("previewBackground").value!=="checker");}
function saveUndo(){if(!maskAlpha)return;undoStack.push(maskAlpha.slice());if(undoStack.length>8)undoStack.shift();redoStack=[];syncHistory();}
function syncHistory(){$("undoEdit").disabled=!undoStack.length;$("redoEdit").disabled=!redoStack.length;$("resetMask").disabled=!lastAlpha;}
function restoreMask(arr){maskAlpha=arr.slice();renderEditor();syncHistory();}
function undo(){if(!undoStack.length)return;redoStack.push(maskAlpha.slice());restoreMask(undoStack.pop());}
function redo(){if(!redoStack.length)return;undoStack.push(maskAlpha.slice());restoreMask(redoStack.pop());}
function pointFromEvent(e){const r=editor.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*editor.width,y:(e.clientY-r.top)/r.height*editor.height};}
function dab(x,y){
 const size=Number($("brushSize").value),radius=size/2,hard=Number($("brushHardness").value)/100,force=Number($("brushOpacity").value)/100;
 const w=maskAlpha.length?image.naturalWidth:0,h=image.naturalHeight, minX=clamp(Math.floor(x-radius),0,w-1),maxX=clamp(Math.ceil(x+radius),0,w-1),minY=clamp(Math.floor(y-radius),0,h-1),maxY=clamp(Math.ceil(y+radius),0,h-1),target=tool==="restore"?255:0;
 for(let py=minY;py<=maxY;py++)for(let px=minX;px<=maxX;px++){const dist=Math.hypot(px+.5-x,py+.5-y);if(dist>radius)continue;const t=dist/radius,edge=t<=hard?1:hard>=.999?1:1-(t-hard)/(1-hard),smooth=edge*edge*(3-2*edge),amount=force*smooth,idx=py*w+px;maskAlpha[idx]=Math.round(maskAlpha[idx]+(target-maskAlpha[idx])*amount);}
}
function strokeTo(p){if(!lastPoint){dab(p.x,p.y);lastPoint=p;return;}const dx=p.x-lastPoint.x,dy=p.y-lastPoint.y,dist=Math.hypot(dx,dy),step=Math.max(1,Number($("brushSize").value)*.18),n=Math.ceil(dist/step);for(let i=1;i<=n;i++)dab(lastPoint.x+dx*i/n,lastPoint.y+dy*i/n);lastPoint=p;}
editor.addEventListener("pointerdown",e=>{if(!maskAlpha)return;e.preventDefault();saveUndo();drawing=true;strokeChanged=true;lastPoint=null;editor.setPointerCapture(e.pointerId);strokeTo(pointFromEvent(e));renderEditor();});
editor.addEventListener("pointermove",e=>{if(!drawing)return;strokeTo(pointFromEvent(e));renderEditor();});
function endStroke(){if(!drawing)return;drawing=false;lastPoint=null;if(strokeChanged){paintRawResult();record("Máscara refinada manualmente ("+(tool==="remove"?"remoção":"restauração")+").");}strokeChanged=false;}
editor.addEventListener("pointerup",endStroke);editor.addEventListener("pointercancel",endStroke);editor.addEventListener("lostpointercapture",endStroke);
$("brushRemove").addEventListener("click",()=>setTool("remove"));$("brushRestore").addEventListener("click",()=>setTool("restore"));
function setTool(t){tool=t;$("brushRemove").classList.toggle("active",t==="remove");$("brushRestore").classList.toggle("active",t==="restore");editor.style.cursor=t==="remove"?"crosshair":"cell";}
$("undoEdit").addEventListener("click",undo);$("redoEdit").addEventListener("click",redo);
$("resetMask").addEventListener("click",()=>{if(!lastAlpha||!confirm("Restaurar a máscara original gerada pelo ISNet?"))return;saveUndo();createNativeMask();});
["brushSize","brushHardness","brushOpacity","maskThreshold","edgeSoftness","resultOpacity"].forEach(id=>$(id).addEventListener("input",()=>{const map={brushSize:["brushSizeValue",v=>v+" px"],brushHardness:["brushHardnessValue",v=>v+"%"],brushOpacity:["brushOpacityValue",v=>v+"%"],maskThreshold:["maskThresholdValue",v=>v],edgeSoftness:["edgeSoftnessValue",v=>v+" px"],resultOpacity:["resultOpacityValue",v=>v+"%"]};const [out,fmt]=map[id];$(out).textContent=fmt($(id).value);if(maskAlpha)renderEditor();}));
["previewBackground","customBackground","showMaskOverlay","zoomRange"].forEach(id=>$(id).addEventListener("input",()=>{if(maskAlpha)renderEditor();}));
$("previewBackground").addEventListener("change",()=>{if(maskAlpha)renderEditor();});
input.addEventListener("change",()=>{file=input.files&&input.files[0];if(!file)return;if(!file.type.startsWith("image/")){say("Selecione um arquivo de imagem.");return;}if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(file);image=new Image();image.onload=()=>{original.src=objectUrl;$("fileInfo").textContent=file.name+" · "+image.naturalWidth+" × "+image.naturalHeight+" px";say("Imagem pronta. Escolha WASM ou WebGPU.");wasm.disabled=false;gpu.disabled=false;lastAlpha=null;maskAlpha=null;undoStack=[];redoStack=[];download.disabled=true;resultCanvas.width=resultCanvas.height=0;editor.width=editor.height=0;$("editorEmpty").hidden=false;syncHistory();};image.onerror=()=>say("Não foi possível decodificar a imagem.");image.src=objectUrl;});
async function run(provider){if(!image)return;setBusy(true);progress.style.width="0%";say("Preparando imagem para "+provider+"…");record("\n--- "+provider.toUpperCase()+" · "+new Date().toLocaleString()+" ---");$("memoryMetric").textContent=memoryText();const c=document.createElement("canvas");c.width=1024;c.height=1024;const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(image,0,0,1024,1024);const pixels=ctx.getImageData(0,0,1024,1024).data,copy=pixels.slice();if(!worker)initWorker();worker.postMessage({type:"run",provider,pixels:copy.buffer,width:1024,height:1024},[copy.buffer]);}
wasm.addEventListener("click",()=>run("wasm"));gpu.addEventListener("click",()=>run("webgpu"));
download.addEventListener("click",()=>{if(!maskAlpha||!image)return;const out=document.createElement("canvas");drawComposite(out,false,false);out.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=(file.name.replace(/\.[^.]+$/,"")||"imagem")+"-clearcut.png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},"image/png");});
if(!("gpu" in navigator))gpu.disabled=true;
window.addEventListener("beforeunload",()=>{if(worker)worker.terminate();if(objectUrl)URL.revokeObjectURL(objectUrl);});
})();