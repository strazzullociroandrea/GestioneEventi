import { fetchRegister } from "../dataAccess/register.js";
const register = document.getElementById('register');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirm_password = document.getElementById('confirm_password');
const divAlert = document.getElementById('alert');
const testoAlert = document.getElementById('testoAlert');
const spinner = document.getElementById("spinner");

register.onclick = () => {
    email.classList.remove("border-danger");
    password.classList.remove("border-danger");
    confirm_password.classList.remove("border-danger");
    if (email.value != "" && password.value != "" && confirm_password.value != "") {
        spinner.classList.remove("d-none");
        const dict = {
            email: email.value,
            password: password.value,
            confirm_password: confirm_password.value,
        }
        fetchRegister(dict)
            .then((response) => {
                if (response.result === "ok") {
                    divAlert.classList.add('d-none');
                    sessionStorage.setItem('email', email.value);
                    sessionStorage.setItem('password', password.value);
                    email.value = "";
                    password.value = "";
                    window.location.href = './login.html';
                } else {
                    testoAlert.innerText = response.result;
                    divAlert.classList.remove('d-none');
                }
                spinner.classList.add("d-none");

            })
    } else {
        email.classList.add("border-danger");
        password.classList.add("border-danger");
        confirm_password.classList.add("border-danger");
    }
}