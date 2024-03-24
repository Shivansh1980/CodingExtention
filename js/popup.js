var info_container = document.getElementById('info_container_id');
var info_text = document.getElementById('info_text');
let user_ref = document.getElementById('username');
let pass_ref = document.getElementById('password');
let button = document.getElementById('connect');

async function execute_user_info_check_on_local_storage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['user_info'], function (items) {
            if (chrome.runtime.lastError) {
                console.log('found error');
                reject('runtime error');
            }
            if (items['user_info'] == null || items.length === 0) {
                chrome.storage.local.set({ 'is_connected': false });
                reject('variable not exists');
            }

            username = items['user_info']['username'];
            password = items['user_info']['password'];
            if (username != null && password != null) {
                var user_data = {
                    username: username,
                    password: password,
                    status: true
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

function send_message_to_content(data, callback) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, data, function (res) {
            callback(res);
        });
    });
}
document.getElementById('connect').onclick = (e) => {
    var username = user_ref.value;
    var password = pass_ref.value;
    var connect_button = document.getElementById('connect');

    var message = "";

    if (connect_button.value === "Connect") message = "authenticate";
    else message = "logout";

    var data = {
        "message": message,
        "username": username,
        "password": password
    }

    send_message_to_content(data, function (response) {
        button.style.backgroundColor = "red";
        if (response.status === "authenticated") {
            user_ref.value = response.username;
            pass_ref.value = response.password;
            button.value = "Logout";
            button.style.backgroundColor = "red";
        } else if (response.status == "disconnected") {
            user_ref.value = "";
            pass_ref.value = "";
            button.value = "Connect";
            button.style.backgroundColor = "lightgreen";
        }
    });
}

document.getElementById('update_extension').onclick = () => {
    chrome.runtime.reload();
};

execute_user_info_check_on_local_storage().then((res)=> {
    if (res.status === true) {
        user_ref.value = res.username;
        pass_ref.value = res.password;
        button.value = "Logout";
        button.style.backgroundColor = "red";
    }
})