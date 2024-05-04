const idEvento = document.getElementById('idEvento');
const idUtenteEvento = document.getElementById('idUtenteEvento');
const eliminaEvento = document.getElementById('eliminaEvento');
const result = document.getElementById('result');

const deleteEvento = (dict) => {
    return new Promise((resolve, reject) => {
        fetch("/deleteEvento", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                event: dict,
            }),
        }).then((element) => {
            return element.json();
        }).then((response) => {
            resolve(response);
            console.log(response);
        })
            .catch((error) => {
                reject(error);
                console.log(error);
            });
    });
};

eliminaEvento.onclick = () => {
    const dict = {
        idEvento: idEvento.value,
        idUtente: idUtenteEvento.value
    };
    deleteEvento(dict);
}