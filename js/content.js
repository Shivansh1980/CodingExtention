var username, password, id, counter;

async function execute_user_info_check_on_local_storage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['user_info'], function (items) {
            if (chrome.runtime.lastError) {
                console.log('found error');
                reject('runtime error');
            }
            if (items === undefined || items['user_info'] === undefined || items['user_info'] == null) {
                chrome.storage.local.set({ 'is_connected': false });
                reject('variable not exists');
            }

            username = items['user_info']['username'];
            password = items['user_info']['password'];
            if (username != null && password != null) {
                var user_data = {
                    username: username,
                    password: password
                }
                resolve(user_data);
            }
            else {
                console.log('please provide input and press connect to chatroom');
                reject('variable not exists');
            }
        })
    })
}

function run_events() {
    $(window).unbind('keydown').bind('keydown', function (event) {
        if (event.altKey || event.metaKey) {
            switch (String.fromCharCode(event.which).toLowerCase()) {
                case 'c':
                    event.preventDefault();
                    text = getSelectedText();
                    message_api.send_message("new_message", text, true);
                    break;
                case 's':
                    event.preventDefault();
                    text = getSelectedText();
                    message_api.send_message("new_message", text, false);
                    break;
                case 'v':
                    event.preventDefault();
                    let box = document.getElementById('answer_box_id');
                    if (box) box.remove();
                    else {
                        let div = document.createElement("div");
                        div.className = "current_answer_box";
                        div.id = "answer_box_id";
                        let p = document.createElement("p");
                        p.innerText = message_api.get_currentText();
                        div.appendChild(p);
                        document.body.appendChild(div);
                    }
                    break;
            }
        }
    });
}

function ready(client) {
    run_events();
    client.onclose = () => {
        make_connection();
    }
    client.onerror = () => {
        make_connection();
    }
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function make_connection() {
    return new Promise((resolve, reject) => {
        message_api = new MessageApi(username, password, id);
        message_api.login().then(client => {
            var user_data = {
                'username': username,
                'password': password
            }
            chrome.storage.local.clear();
            localStorage.setItem('username', username);
            localStorage.setItem('password', password);
            resolve(client);
    
        }).catch(err => {
            chrome.storage.local.clear();
            reject(err);
        });  
    })
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(request);
        if (request.message === "authenticate") {
            username = request.username;
            password = request.password;
            id = "1";
            make_connection().then(client => {
                sendResponse({status:"authenticated", username:username, password:password});
                ready(client);
            }).catch(err => {
                console.log('inside on message listener of chrome runtime', err);
            })
        } else if (request.message === "logout") {
            chrome.storage.local.clear();
            message_api.close_connetion();
            username = "";
            password = "";
            sendResponse({status:"disconnected"});
            id = "1";
        }
    }
)


username = localStorage.getItem('username');
password = localStorage.getItem('password');
id = "1";
if (!username || !password) {
    username = "Shivansh";
    password = "12345";
    id = "1";
    make_connection().then(client => {
        ready(client);
    }).catch(err => {
        console.log('error at if condition', err);
    })
} else {
    make_connection().then(client => {
        ready(client);
    }).catch(err => {
        console.log('error at else condition', err);
    })
    console.log("Your Authentication Sucessful");
}