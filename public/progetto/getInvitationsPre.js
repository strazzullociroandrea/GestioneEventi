function acceptInvitation(uid, eventId) {
    console.log("Accetta ", uid, eventId);
    return new Promise((resolve, reject) => {
        const url = "/accept-invitation";
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: uid,
                eventId: eventId,
            }),
        })
            .then((element) => {
                return element.json();
            })
            .then((response) => {
                resolve(response);
                location.reload();
                 })
            .catch((error) => {
                reject(error);
                console.log(error);
            });
    });
}

function rejectInvitation(uid, eventId) {
    console.log("Rifiuta ", uid, eventId);
    return new Promise((resolve, reject) => {
        const url = "/reject-invitation";
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: uid,
                eventId: eventId,
            }),
        })
            .then((element) => {
                return element.json();
            })
            .then((response) => {
                resolve(response);
                location.reload();
            })
            .catch((error) => {
                reject(error);
                console.log(error);
            });
    });
}
