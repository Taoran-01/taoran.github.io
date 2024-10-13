
let wsUrl="", url="";
let tokens=new Array();
const maxLogs=50;

let cnt=0;
let img={};
let pre, onOperateIdx="";

const originalPixels=new CircularQueue(602*1002);
const calculatedPixels=new CircularQueue(602*1002);

const colorListInt=[
	[  0,   0,   0], [255, 255, 255], [170, 170, 170], [ 85,  85,  85],
	[254, 211, 199], [255, 196, 206], [250, 172, 142], [255, 139, 131],
	[244,  67,  54], [233,  30,  99], [226, 102, 158], [156,  39, 176],
	[103,  58, 183], [ 63,  81, 181], [  0,  70, 112], [  5, 113, 151],
	[ 33, 150, 243], [  0, 188, 212], [ 59, 229, 219], [151, 253, 220],
	[ 22, 115,   0], [ 55, 169,  60], [137, 230,  66], [215, 255,   7],
	[255, 246, 209], [248, 203, 140], [255, 235,  59], [255, 193,   7],
	[255, 152,   0], [255,  87,  34], [184,  63,  39], [121,  85,  72],
];

const colorList=[
	'rgb(0, 0, 0)', 'rgb(255, 255, 255)', 'rgb(170, 170, 170)', 'rgb(85, 85, 85)',
	'rgb(254, 211, 199)', 'rgb(255, 196, 206)', 'rgb(250, 172, 142)', 'rgb(255, 139, 131)',
	'rgb(244, 67, 54)', 'rgb(233, 30, 99)', 'rgb(226, 102, 158)', 'rgb(156, 39, 176)',
	'rgb(103, 58, 183)', 'rgb(63, 81, 181)', 'rgb(0, 70, 112)', 'rgb(5, 113, 151)',
	'rgb(33, 150, 243)', 'rgb(0, 188, 212)', 'rgb(59, 229, 219)', 'rgb(151, 253, 220)',
	'rgb(22, 115, 0)', 'rgb(55, 169, 60)', 'rgb(137, 230, 66)', 'rgb(215, 255, 7)',
	'rgb(255, 246, 209)', 'rgb(248, 203, 140)', 'rgb(255, 235, 59)', 'rgb(255, 193, 7)',
	'rgb(255, 152, 0)', 'rgb(255, 87, 34)', 'rgb(184, 63, 39)', 'rgb(121, 85, 72)'
];

function addLog(msg, typ) { // info | error | success
	const logArea=document.getElementById("logArea")
	const logMsg=document.createElement("div");
	logMsg.className="log-content-"+typ;
	logMsg.textContent="> "+msg;
	logArea.appendChild(logMsg);
	if (logArea.children.length>maxLogs) {
		logArea.removeChild(logArea.firstChild)
	}
	logArea.scrollTop=logArea.scrollHeight;
}

function init() {
	url=document.getElementById("linkInput").value;
	if (url[url.length-1]=="/") url=url.slice(0, url.length-1);
	addLog("链接: "+url, "info");
	wsUrl=document.getElementById("wsInput").value;
	addLog("WebSocket: "+wsUrl, "info");
	tokens={};
	const tkstr=document.getElementById("tokenInput").value.split("\n");
	for (let i=0; i<tkstr.length; ++i) {
		let cur=tkstr[i].replaceAll(" ", "").split(",");
		tokens[cur[0]]=cur[1];
	}
	addLog("Token总数: "+(Object.keys(tokens).length-1), "info");
	connectWs();
}

function initSelection() {
	const customSelect=document.querySelector(".custom-select");
	const options=document.querySelector(".options");
	customSelect.addEventListener("click", () => {
		options.style.display=options.style.display=="block"?"none":"block";
	});
	document.querySelectorAll(".options div").forEach(option => {
		option.addEventListener("click", (e) => {
			customSelect.textContent=e.target.textContent;
			options.style.display="none";
			selectImage(customSelect.textContent);
		});
	});
	document.addEventListener("click", (e) => {
		if (!customSelect.contains(e.target)&&!options.contains(e.target)) {
			options.style.display="none";
		}
	});
	resetSelection();
}

function addSelection(str) {
	const customSelect=document.querySelector(".custom-select");
	const options=document.querySelector(".options");
	const option=document.createElement("div");
	option.textContent=str;
	option.addEventListener("click", (e) => {
		customSelect.textContent=e.target.textContent;
		options.style.display="none";
		selectImage(customSelect.textContent);
	});
	options.appendChild(option);
}

function resetSelection() {
	const customSelect=document.querySelector(".custom-select");
	const options=document.querySelector(".options");
	customSelect.textContent="请选择需要操作的图片";
	options.style.display="none";
}

async function getCanvas() {
	addLog("正在初始化画板", "info");
	try {
		const response=await fetch(url+"/board", {method: "GET"});
		if (!response.ok) {
			addLog("画板请求失败 请检查CORS", "error");
		}
		else {
			let data=await response.text();
			addLog("画板请求成功", "success");
			data=data.replaceAll("\r", "");
			data=data.split("\n");
			const canvas=document.getElementById("canvas");
			if (!canvas.getContext) return;
			let ctx=canvas.getContext("2d");
			for (let x=0; x<1000;++x) {
				for (let y=0; y<600;++y) {
					ctx.fillStyle=colorList[parseInt(data[x][y], 32)];
					ctx.fillRect(x, y, 1, 1);
					originalPixels.push({x,y});
				}
			}
			addLog("画板初始化完成", "info");
		}
	} catch (e) {
		console.log(e);
		addLog("画板请求失败 请检查网络连接", "error");
	}
}

function updateCanvas(x, y, col) {
	const canvas=document.getElementById("canvas");
	let ctx=canvas.getContext("2d");
	ctx.fillStyle=colorList[parseInt(col, 32)];
	ctx.fillRect(x, y, 1, 1);
}

function triggerFileInput() {
	const fileInput=document.getElementById("imageInput");
	fileInput.value=""; // IMPORTANT
	fileInput.click();
	fileInput.onchange=uploadImage;
}

function uploadImage() {
	const fileInput=document.getElementById("imageInput");
	const file=fileInput.files[0];
	if (!file) return;
	let name="#"+(++cnt)+" "+file.name, posx=0, posy=0;
	
	const preview=document.createElement("canvas");
	preview.className="canvas"	;
	preview.width="1000", preview.height="600";
	const canvasContainer=document.getElementById("canvasContainer");
	canvasContainer.append(preview);
	img[name]=preview;
	
	const image=new Image();
	const reader=new FileReader();
	reader.onload=function(e) {
		image.src=e.target.result;
		image.onload=function() {
			let ctx=preview.getContext("2d");
			ctx.drawImage(image, 0, 0, image.width, image.height);
		}
	}
	reader.readAsDataURL(file);
	addSelection(name);
	addLog("图片加载完成", "success");
}

function triggerDirectionKeys(e) {
	const mvUp=document.getElementById("mvUp");
	const mvDn=document.getElementById("mvDn");
	const mvLf=document.getElementById("mvLf");
	const mvRt=document.getElementById("mvRt");
	if (e.key=="ArrowUp") mvUp.click();
	if (e.key=="ArrowDown") mvDn.click();
	if (e.key=="ArrowLeft") mvLf.click();
	if (e.key=="ArrowRight") mvRt.click();
}

function operationStart() {
	addLog("图片操作开始", "info");
	pre=document.createElement("canvas");
	pre.className="canvas"	;
	pre.width=1000, pre.height=600;
	onOperateIdx="";
	const operateArea=document.getElementById("operateArea");
	operateArea.style.display="block";
	resetSelection();
	window.addEventListener("keydown", triggerDirectionKeys);
}

function selectImage(str) {
	onOperateIdx=str;
	let ctx=pre.getContext("2d");
	ctx.clearRect(0, 0, 1000, 600);
	ctx.drawImage(img[onOperateIdx], 0, 0);
}

function moveImage(dx, dy) {
	if (onOperateIdx=="") {
		addLog("未选择图像", "error");
		return;
	}
	const tmp=document.createElement("canvas");
	tmp.className="canvas"	;
	let tmpCtx=tmp.getContext("2d");
	tmp.width=1000, tmp.height=600;
	tmpCtx.drawImage(img[onOperateIdx], dx, dy);
	let curCtx=img[onOperateIdx].getContext("2d");
	curCtx.clearRect(0, 0, 1000, 600);
	curCtx.drawImage(tmp, 0, 0);
	delete tmp;
}

function operationConfirm() {
	operationEnd();
}

function operationRemove() {
	if (onOperateIdx=="") {
		addLog("未选择图像", "error");
		return;
	}
	document.querySelectorAll(".options div").forEach(option => {
		if (option.textContent==onOperateIdx) option.remove();
	});
	img[onOperateIdx].remove();
	delete img[onOperateIdx];
	operationEnd();
}

function operationCancel() {
	if (onOperateIdx=="") return;
	let ctx=img[onOperateIdx].getContext("2d");
	ctx.clearRect(0, 0, 1000, 600);
	ctx.drawImage(pre, 0, 0);
	operationEnd();
}

function operationEnd() {
	addLog("图片操作结束", "info");
	const operateArea=document.getElementById("operateArea");
	operateArea.style.display="none";
	resetSelection();
	window.removeEventListener("keydown", triggerDirectionKeys);
}

function findClosestColor(col) {
	let res=colorListInt[0];
	let mn=Infinity;
	for (const color of colorListInt) {
		const dist=
			Math.pow(col[0]-color[0], 2)+
			Math.pow(col[1]-color[1], 2)+
			Math.pow(col[2]-color[2], 2);
		if (dist<mn) mn=dist, res=color;
	}
	return "rgb("+res[0]+","+res[1]+","+res[2]+")";
}

let originalImage, calculatedImage, mask;
let onDrawing=false;
function executePainting() {
	if (!onDrawing) return;
	if (!originalPixels.empty()) {
		let todoPixels=Math.ceil(tokens.length()*1.1);
		let ctx1=originalImage.getContext("2d");
		let ctx2=calculatedImage.getContext("2d");
		while (!originalPixels.empty()&&todoPixels>=0) {
			let [x, y]=originalPixels.pop();
			let tmp=ctx1.getImageData(x, y, 1, 1);
			ctx2.fillStyle=findClosestColor(tmp);
			ctx2.fillRect(x, y, 1, 1);
			todoPixels-=1;
		}
	}
	requestAnimationFrame(executePainting);
}
function startPainting() {
	originalImage=document.getElementById("originalImage");
	calculatedImage=document.getElementById("calculatedImage");
	mask=document.getElementById("mask");
	const togglePainting=document.getElementById("togglePainting");
	togglePainting.textContent="停止绘制";
	togglePainting.className="red-button";
	addLog("绘制开始", "info"), onDrawing=true;

	let ctx=originalImage.getContext("2d");
	for (let key in img) ctx.drawImage(img[key], 0, 0);
	let tmp=ctx.getImageData(0, 0, 1000, 600).data;

	ctx=mask.getContext("2d");
	ctx.fillStyle="rgb(127,63,63)";
	for (let x=0; x<1000; ++x) {
		for (let y=0; y<600; ++y) {
			let i=(x+y*1000)*4;
			if (tmp[i+3]==0) continue;
			ctx.fillRect(x, y, 1, 1);
		}
	}
	console.log(tmp);
	executePainting();
}
function stopPainting() {
	const togglePainting=document.getElementById("togglePainting");
	
	let ctx=originalImage.getContext("2d");
	ctx.clearRect(0, 0, 1000, 600);
	ctx=calculatedImage.getContext("2d");
	ctx.clearRect(0, 0, 1000, 600);
	ctx=mask.getContext("2d");
	ctx.clearRect(0, 0, 1000, 600);
	pixels.clear();

	togglePainting.textContent="开始绘制";
	togglePainting.className="green-button";
	addLog("绘制停止", "info"), onDrawing=false;
}

let ws=null;
function connectWs() {
	try {
		ws=new WebSocket(wsUrl);
	} catch(e) {
		addLog("无法连接到服务器", "error");
		return;
	}
	ws.onopen=function() {
		let message={
			"type": "join_channel",
			"channel": "paintboard",
			"channel_param": ""
		};
		ws.send(JSON.stringify(message));
	};
	ws.onmessage=function (event) {
		let data=JSON.parse(event.data);
		if (data.type=="result"&&data.result=="success") {
			addLog("成功连接到服务器", "success");
			getCanvas();
		} else if(data.type=="paintboard_update") {
			addLog("像素更新", "info");
			updateCanvas(data.y, data.x, data.color);
		}
		console.log(data);
	};
}
