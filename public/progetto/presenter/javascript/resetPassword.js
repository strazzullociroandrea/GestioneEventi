const email = document.getElementById('email');
const reset = document.getElementById('reset');
const resetPassword = document.getElementById('resetPassword');
const divAlert = document.getElementById('alert');
const testoAlert = document.getElementById('testoAlert');
const spinner = document.getElementById("spinner");

const fetchResetPassword = (dict) => {
    return new Promise((resolve, reject) => {
        fetch("/reset_password", {
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

resetPassword.onclick = () => {
    spinner.classList.remove("d-none");
    if (reset.value === "RESET") {
        const dict = {
            email: email.value,
        };
        fetchResetPassword(dict)
        .then((response) => {
            //console.log(response);
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