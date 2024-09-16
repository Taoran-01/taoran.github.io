// https://gist.github.com/Algo-X-Public-Account-02/01e0a06a706eb6a5840af3425d0d04ef

const gistId='01e0a06a706eb6a5840af3425d0d04ef';
var accessToken;

function getAccessToken() {
	xhr=createXHR();
	xhr.open('GET', 'https://textdb.online/Algo-X-Errata-Access-Token', true);
	xhr.onload=function() {
		if (xhr.status >= 200 && xhr.status < 300) {
			accessToken=xhr.responseText;
		} else {
			console.error('Token Request Failed.');
		}
	};
	xhr.onerror=function() {
		console.error('Token Request Failed.');
	};
	xhr.send();
}
getAccessToken();

function readSubmitter() {
	return document.getElementById('submitterInput').value;
}
function readLink() {
	return document.getElementById('linkInput').value;
}
function readText() {
	return document.getElementById('textInput').value;
}

async function getErrata() { // Chat GPT 帮我改的
	const url=`https://api.github.com/gists/${gistId}`;
	let res;
	try {
		const response=await fetch(url, {
			method: 'GET',
			headers: {
				'Authorization': `token ${accessToken}`,
				'Accept': 'application/vnd.github.v3+json'
			}
		});
		if (!response.ok) {
			console.error('Request Status:', response.status);
			res='ERR: 请求失败。';
			return res;
		}
		const data=await response.json();
		console.log('Gist Data:', data);
		try {
			res=data["files"]["Blog-Errata.txt"]["content"];
		} catch (e) {
			console.error('Request Error.');
			res='ERR: 数据库错误，勘误表无法读取，请到“关于”页面联系我。';
		}
	} catch (e) {
		console.error('Request Error:', e);
		res='ERR: 请求错误，勘误表无法读取，请检查网络连接。';
	}
	return res;
}

async function updateErrata() {
	var updateText=`提交者: ${readSubmitter()}\n问题链接: ${readLink()}\n问题内容: \n${addToEachLine(readText(), '\t')}\n状态: Pending\n----------`;
	// var res=getErrata();
	var res=await getErrata();
	if (res.slice(0,4)=='ERR') {
		return res;
	}
	updateText=`${res}\n${updateText}`;
	return updateErrataDirectly(updateText);
}

async function updateErrataDirectly(updateText) {
	console.log(updateText);
	const requestData={
		files: {
			'Blog-Errata.txt': {
				content: updateText
			}
		}
	}
	const url=`https://api.github.com/gists/${gistId}`;
	try {
		const response=await fetch(url, {
			method: 'PATCH',
			headers: {
				'Authorization': `token ${accessToken}`,
				'Accept': 'application/vnd.github.raw+json',
				'Content-Type': 'application/json'
				// 'Cache-Control': 'no-cache' // Blocked by CORS Policy
			},
			body: JSON.stringify(requestData)
		})
		if (!response.ok) {
			console.error('Request Status:', response.status);
		}
		const data=response.json();
		try {
			console.log('Update Success:', data);
			res='更新成功！请刷新查看结果。'
		} catch (e) {
			console.error('Update Error.');
			res='Request Error: 数据库错误，勘误表无法读取，请到“关于”页面联系我。';
		}
	} catch(e) {
		console.error('Request Error:', e);
		res='请求错误，勘误表无法更新，请检查网络连接。';
	}
	return res;
}
