export const cambiaPassword = async (newPassword) => {
    let rsp = await fetch("/changePassword", {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            username: sessionStorage.getItem("email"),
            newPassword: newPassword
        }),
    });
    rsp = await rsp.json();
    return rsp;
}