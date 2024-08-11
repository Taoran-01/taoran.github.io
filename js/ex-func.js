function copyToClipboard(text) {
	var dummy=document.createElement("textarea");
	document.body.appendChild(dummy);
	dummy.value=text;
	dummy.select();
	document.execCommand("copy");
	document.body.removeChild(dummy);
}

function createXHR() {
	var XHR=[
		function (){return new XMLHttpRequest();},
		function (){return new ActiveXObject("Msxml2.XMLHTTP");},
		function (){return new ActiveXObject("Msxml3.XMLHTTP");},
		function (){return new ActiveXObject("Microsoft.XMLHTTP");}
	];
	var xhr=null;
	for (let i=0; i<XHR.length; ++i) {
		try {xhr=XHR[i]();} catch(e) {continue;}
		break;
	}
	return xhr;
}

function generateRandomString(len) {
	var res='';
	const charset='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i=0; i<len; i++) {
		const idx=Math.floor(Math.random()*charset.length);
		const ch=charset.charAt(idx);
		res+=ch;
	}
	return res;
}

function addToEachLine(inputString, insertString) {
    const lines=inputString.split('\n');
    const modifiedLines=lines.map(line => insertString + line);
    const resultString=modifiedLines.join('\n');
    return resultString;
}
