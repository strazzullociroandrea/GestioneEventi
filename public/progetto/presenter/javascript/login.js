const login = document.getElementById('login');
const email = document.getElementById('email');
const password = document.getElementById('password');
const socket = io();
const divAlert = document.getElementById('alert');
const testoAlert = document.getElementById('testoAlert');
let mailTemp = "";
let passwordTemp = "";
login.onclick = () => {
    mailTemp = email.value;
    passwordTemp =  password.value;
    const dict = {
        email: mailTemp,
        password: passwordTemp
    }
    socket.emit('login', dict);
}

socket.on('loginSucc', (response) => {
    console.log(response);
    if (response === "Accesso effettuato con successo") {
        divAlert.classList.add('d-none');
        sessionStorage.setItem('email', mailTemp);
        sessionStorage.setItem('password', passwordTemp);
        console.log("email.value");
        console.log(mailTemp);
        email.value = "";
        password.value = "";
        window.location.href = './home.html';
    } else {
        testoAlert.innerText = response;
        divAlert.classList.remove('d-none');
    }
})

window.onload = () => {
    if (sessionStorage.getItem('email') !== undefined && sessionStorage.getItem('password') !== undefined && sessionStorage.getItem('email') !== "" && sessionStorage.getItem('password') !== "") {
        const dict = {
            email: sessionStorage.getItem('email'),
            password: sessionStorage.getItem('password'),
        }
        socket.emit('login', dict);
    }
}