const register = document.getElementById('register');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirm_password = document.getElementById('confirm_password');
const divAlert = document.getElementById('alert');
const testoAlert = document.getElementById('testoAlert');
const spinner = document.getElementById("spinner");

const fetchRegister = (dict) => {

    return new Promise((resolve, reject) => {
        fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                dict,
            ),
        }).then((element) => {
            return element.json();
        }).then((response) => {
            resolve(response);
        })
            .catch((error) => {
                reject(error);
            });
    });
};

register.onclick = () => {
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
}