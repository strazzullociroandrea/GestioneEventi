export const getEvento = async(idEvento) =>{
    let rsp = await fetch("/getEvento", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            idEvento,
            email: sessionStorage.getItem("email")
        })
    });
    rsp = await rsp.json();
    rsp = rsp.result;
    return rsp;
}