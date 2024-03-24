// var hostname = "127.0.0.1:8000";
var hostname = "polished-morning-29118.pktriot.net";
var ws_protocol = 'wss://'
var websocket_url = ws_protocol + hostname + "/chatroom/ws/"

var message_api;

function getSelectedText() {
    if (window.getSelection) {
        return window.getSelection().toString();
    } else if (document.selection) {
        return document.selection.createRange().text;
    }
    return '';
}

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}

/*------------------------------------------ Class Implementation --------------------------------------------------*/
class MessageApi {
    constructor(username, password, group_id) {
        this.username = username;
        this.password = password;
        this.group_id = group_id;
        this.currentText = "Default Text";
        this.isOnline = false;
        this.isWebsocketConnected = false;

        console.log(this.username, this.password, this.group_id);

        if (username == null || password == null || username == "" || password == "") {
            console.log('username and roomname not valid');
            return null;
        }
    }

    login() {
        let ref = this;
        return new Promise(function (resolve, reject) {
            ref.client = new WebSocket(
                websocket_url
                + 'group'
                + '/'
                + ref.group_id
                + '/?'
                + `username=${ref.username}&password=${ref.password}`
            )

            ref.client.onopen = () => {
                chrome.storage.local.set({
                    'is_connected': true,
                    'username': ref.username,
                    'password': ref.password
                })
                ref.isWebsocketConnected = true;
                ref.isOnline = true;
                console.log("connected successfuly");
                resolve(ref.client);
            }

            ref.client.onerror = (error) => {
                ref.isWebsocketConnected = false;
                chrome.storage.local.set({
                    'is_connected': false
                })
                console.log("failed to connect with chatroom",error);
                reject('error');
            }

            ref.client.onclose = (e) => {
                ref.isWebsocketConnected = false;
                chrome.storage.local.set({
                    'is_connected': false
                })
                console.log("disconnected from chatroom: ", e);
                reject('error');
            }

            ref.client.onmessage = (e) => {
                const obj = JSON.parse(e.data);
                console.log(obj, obj.username, ref.username);
                if (obj.type == 'new_message' && obj.username != ref.username) {
                    let data = obj.data;
                    let text = data.message;
                    ref.cuurentText = text;
                    copyTextToClipboard(text);
                }
            }
        })
    }

    send_message(command, message, code=false) {
        this.client.send(JSON.stringify({
            'command': command,
            'message': message,
            'username': this.username,
            'roomname': this.roomname,
            'group_id': this.group_id,
            'iscode': code
        }))
    }

    get_username() {
        return this.username;
    }
    get_currentText() {
        return this.currentText;
    }
    close_connetion() {
        this.client.close();
    }
}

//Some Global Variables
// chrome.storage.local.set({ 'message_api': message_api });

// async function execute_user_info_check_on_local_storage() {
//     return new Promise((resolve, reject) => {
//         chrome.storage.local.get(['user_info'], function (items) {
//             if (chrome.runtime.lastError) {
//                 console.log('found error');
//                 reject('runtime error');
//             }
//             if (items['user_info'] == null || items.length == 0) {
//                 chrome.storage.local.set({ 'is_connected': false });
//                 reject('variable not exists');
//             }

//             username = items['user_info']['username'];
//             roomname = items['user_info']['roomname'];
//             if (username != null && roomname != null) {
//                 message_api = new MessageApi(username, roomname);
//                 message_api.initialize();
//                 resolve(message_api);
//             }
//             else {
//                 console.log('please provide input and press connect to chatroom');
//                 reject('variable not exists');
//             }
//         })
//     })
// }
