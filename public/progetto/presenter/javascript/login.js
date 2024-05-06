const login = document.getElementById('login');
const email = document.getElementById('email');
const password = document.getElementById('password');
const socket = io();

login.onclick = () => {
    const dict = {
        email: email.value,
        password: password.value,
    }
    socket.emit('login', dict);
}

socket.on('login', (response) => {
    if(response) {
        sessionStorage.setItem('email', email.value);
        sessionStorage.setItem('password', password.value);
        window.location.href = './home.html';
    } else {

    }
})

window.onload = () => {
    if(sessionStorage.getItem('email') !== undefined && sessionStorage.getItem('password') !== undefined) {
        socket.emit('login', dict);
    }
}