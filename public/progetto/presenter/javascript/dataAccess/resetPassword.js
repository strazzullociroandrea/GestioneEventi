export const fetchResetPassword = (dict) => {
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