"use strict";
importScripts("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.min.js");
const MODEL_BASE = "https://huggingface.co/chenjindu/isnet-web/resolve/cda7d26/";
const PARTS = ["isnet-w8.part00","isnet-w8.part01","isnet-w8.part02"];
let sessions = new Map(), modelBuffer = null, modelBytes = 0;
const send = (type, data={}) => self.postMessage({type,...data});
async function getModel() {
  if (modelBuffer) return modelBuffer;
  const started = performance.now();
  const buffers = [];
  for (let i=0;i<PARTS.length;i++) {
    const response = await fetch(MODEL_BASE + PARTS[i]);
    if (!response.ok) throw new Error("Falha ao baixar parte do modelo: " + PARTS[i] + " (" + response.status + ")");
    const part = await response.arrayBuffer(); buffers.push(part);
    send("download-progress",{loaded:buffers.reduce((n,b)=>n+b.byteLength,0),total:44*1024*1024});
  }
  modelBytes = buffers.reduce((n,b)=>n+b.byteLength,0);
  const merged = new Uint8Array(modelBytes); let offset=0;
  for (const part of buffers) { merged.set(new Uint8Array(part),offset); offset+=part.byteLength; }
  modelBuffer = merged.buffer;
  send("model-ready",{bytes:modelBytes,downloadMs:performance.now()-started});
  return modelBuffer;
}
async function getSession(provider) {
  if (sessions.has(provider)) return sessions.get(provider);
  const buffer = await getModel();
  const started = performance.now();
  const session = await ort.InferenceSession.create(buffer,{executionProviders:[provider],graphOptimizationLevel:"all"});
  sessions.set(provider,session);
  send("session-ready",{provider,sessionMs:performance.now()-started,inputNames:session.inputNames,outputNames:session.outputNames});
  return session;
}
self.onmessage = async (event) => {
  const {type,provider,pixels,width,height} = event.data || {};
  if (type !== "run") return;
  try {
    if (provider === "webgpu" && !("gpu" in self.navigator)) throw new Error("WebGPU não está disponível neste navegador/worker.");
    const session = await getSession(provider);
    const size=1024, count=size*size, input=new Float32Array(3*count);
    const source=new Uint8ClampedArray(pixels);
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
      const sx=Math.min(width-1,Math.floor(x*width/size)), sy=Math.min(height-1,Math.floor(y*height/size));
      const si=(sy*width+sx)*4, di=y*size+x;
      input[di]=source[si]/255-.5; input[count+di]=source[si+1]/255-.5; input[2*count+di]=source[si+2]/255-.5;
    }
    const started=performance.now();
    const outputs=await session.run({input_image:new ort.Tensor("float32",input,[1,3,size,size])});
    const inferenceMs=performance.now()-started;
    const output=outputs.output_image;
    if(!output || !output.data || output.data.length!==count) throw new Error("Formato de saída inesperado do ISNet.");
    let min=Infinity,max=-Infinity;
    for(let i=0;i<count;i++){const v=Number(output.data[i]);if(v<min)min=v;if(v>max)max=v;}
    if(!Number.isFinite(min)||!Number.isFinite(max)||max-min<1e-8) throw new Error("A máscara retornada é inválida ou constante.");
    const alpha=new Uint8ClampedArray(count);
    for(let i=0;i<count;i++) alpha[i]=Math.round(Math.max(0,Math.min(1,(Number(output.data[i])-min)/(max-min)))*255);
    send("result",{provider,width:size,height:size,alpha:alpha.buffer,inferenceMs,modelBytes,estimatedBufferBytes:modelBytes+input.byteLength+output.data.byteLength+alpha.byteLength,min,max},[alpha.buffer]);
  } catch(error) { send("error",{provider,message:error && error.message ? error.message : String(error)}); }
};