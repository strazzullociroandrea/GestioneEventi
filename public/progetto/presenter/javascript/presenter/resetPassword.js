import {fetchResetPassword} from "../dataAccess/resetPassword.js";

const email = document.getElementById('email');
const reset = document.getElementById('reset');
const resetPassword = document.getElementById('resetPassword');
const divAlert = document.getElementById('alert');
const testoAlert = document.getElementById('testoAlert');
const spinner = document.getElementById("spinner");


resetPassword.onclick = () => {
    spinner.classList.remove("d-none");
    if (reset.value === "RESET") {
        const dict = {
            email: email.value,
        };
        fetchResetPassword(dict)
        .then((response) => {
            if (response === true)  {
                window.location.href = './login.html';
            } else {
                testoAlert.innerText = "E-mail non registrata";
                divAlert.classList.remove("d-none");
            }
            spinner.classList.add("d-none");

        })
    } else {
        testoAlert.innerText = "Scrivi solo \"RESET\"";
        divAlert.classList.remove("d-none");
        spinner.classList.add("d-none");

    }
}