(() => {
"use strict";
const $=id=>document.getElementById(id);
const input=$("imageInput"),wasm=$("runWasm"),gpu=$("runWebGpu"),download=$("downloadPng");
const status=$("status"),log=$("log"),progress=$("progress"),original=$("originalPreview"),canvas=$("resultCanvas");
let worker=null,file=null,image=null,objectUrl=null,lastAlpha=null,lastMetrics=null,modelReady=false;
const say=(message)=>{status.textContent=message;};
const record=(message)=>{log.textContent+="\n"+message;log.scrollTop=log.scrollHeight;};
function setBusy(value){wasm.disabled=value||!image;gpu.disabled=value||!image;input.disabled=value;download.disabled=value||!lastAlpha;}
function memoryText(estimateBytes=0){const m=performance.memory;if(m&&Number.isFinite(m.usedJSHeapSize))return (m.usedJSHeapSize/1048576).toFixed(1)+" MB heap";return estimateBytes?"~"+(estimateBytes/1048576).toFixed(1)+" MB buffers":"não exposta";}
function initWorker(){if(worker)worker.terminate();worker=new Worker("./isnet-worker.js");worker.onmessage=onWorkerMessage;worker.onerror=e=>{say("Falha no worker: "+e.message);record("Worker error: "+e.message);setBusy(false);};}
function onWorkerMessage(event){const d=event.data;
 if(d.type==="download-progress"){progress.style.width=Math.min(100,d.loaded/d.total*100)+"%";say("Baixando modelo: "+(d.loaded/1048576).toFixed(1)+" MB");}
 if(d.type==="model-ready"){modelReady=true;$("downloadMetric").textContent=(d.bytes/1048576).toFixed(1)+" MB";record("Modelo baixado: "+(d.bytes/1048576).toFixed(2)+" MB em "+Math.round(d.downloadMs)+" ms.");}
 if(d.type==="session-ready"){$("sessionMetric").textContent=Math.round(d.sessionMs)+" ms";record("Sessão "+d.provider+": "+Math.round(d.sessionMs)+" ms. Entradas: "+d.inputNames.join(", ")+"; saídas: "+d.outputNames.join(", "));}
 if(d.type==="result"){lastAlpha=new Uint8ClampedArray(d.alpha);lastMetrics=d;$("inferenceMetric").textContent=Math.round(d.inferenceMs)+" ms";$("memoryMetric").textContent=memoryText(d.estimatedBufferBytes);paintResult();say("Concluído com "+d.provider+". Inferência: "+Math.round(d.inferenceMs)+" ms.");record("Inferência "+d.provider+": "+Math.round(d.inferenceMs)+" ms; buffers estimados: "+(d.estimatedBufferBytes/1048576).toFixed(1)+" MB; faixa de saída: "+d.min.toFixed(4)+"–"+d.max.toFixed(4)+".");setBusy(false);}
 if(d.type==="error"){say("Falha na execução: "+d.message);record("ERRO "+d.provider+": "+d.message);setBusy(false);}
}
function paintResult(){if(!lastAlpha||!image)return;const w=image.naturalWidth,h=image.naturalHeight;canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");ctx.drawImage(image,0,0,w,h);const mask=document.createElement("canvas");mask.width=1024;mask.height=1024;const mctx=mask.getContext("2d");const data=mctx.createImageData(1024,1024);for(let i=0;i<lastAlpha.length;i++){const p=i*4;data.data[p]=data.data[p+1]=data.data[p+2]=255;data.data[p+3]=lastAlpha[i];}mctx.putImageData(data,0,0);ctx.globalCompositeOperation="destination-in";ctx.drawImage(mask,0,0,w,h);ctx.globalCompositeOperation="source-over";download.disabled=false;}
input.addEventListener("change",()=>{file=input.files&&input.files[0];if(!file)return;if(!file.type.startsWith("image/")){say("Selecione um arquivo de imagem.");return;}if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(file);image=new Image();image.onload=()=>{original.src=objectUrl;$("fileInfo").textContent=file.name+" · "+image.naturalWidth+" × "+image.naturalHeight+" px";say("Imagem pronta. Escolha WASM ou WebGPU.");wasm.disabled=false;gpu.disabled=false;lastAlpha=null;download.disabled=true;canvas.width=canvas.height=0;};image.onerror=()=>say("Não foi possível decodificar a imagem.");image.src=objectUrl;});
async function run(provider){if(!image)return;setBusy(true);progress.style.width="0%";say("Preparando imagem para "+provider+"…");record("\n--- "+provider.toUpperCase()+" · "+new Date().toLocaleString()+" ---");$("memoryMetric").textContent=memoryText();const c=document.createElement("canvas");c.width=1024;c.height=1024;const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(image,0,0,1024,1024);const pixels=ctx.getImageData(0,0,1024,1024).data;const copy=pixels.slice();if(!worker)initWorker();worker.postMessage({type:"run",provider,pixels:copy.buffer,width:1024,height:1024},[copy.buffer]);}
wasm.addEventListener("click",()=>run("wasm"));gpu.addEventListener("click",()=>run("webgpu"));
download.addEventListener("click",()=>{if(!lastAlpha||!image)return;const a=document.createElement("a");canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);a.href=url;a.download=(file.name.replace(/\.[^.]+$/,"")||"imagem")+"-isnet-lab.png";a.click();URL.revokeObjectURL(url);},"image/png");});
if(!("gpu" in navigator))gpu.disabled=true;
window.addEventListener("beforeunload",()=>{if(worker)worker.terminate();if(objectUrl)URL.revokeObjectURL(objectUrl);});
})();