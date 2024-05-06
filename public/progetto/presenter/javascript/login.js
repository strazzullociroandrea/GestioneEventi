const login = document.getElementById('login');
const email = document.getElementById('email');
const password = document.getElementById('password');
const socket = io();

login.onclick = () => {
    const dict = {
        email: email.ariaValueMax,
        password: password.value,
    }
    socket.emit('login', dict);
}
socket.on('login', (response) => {
    console.log(response);
})