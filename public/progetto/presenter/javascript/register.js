const register = document.getElementById('register');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirm_password = document.getElementById('confirm_password');

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
    const dict = {
        email: email.value,
        password: password.value,
        confirm_password: confirm_password.value,
    }
    fetchRegister(dict)
        .then((response) => {
            if (response) {
                sessionStorage.setItem('email', email.value);
                sessionStorage.setItem('password', password.value);
                window.location.href = './login.html';
            } else {
                
            }
        })
}