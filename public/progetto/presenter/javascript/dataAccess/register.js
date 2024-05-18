export const fetchRegister = (dict) => {
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
