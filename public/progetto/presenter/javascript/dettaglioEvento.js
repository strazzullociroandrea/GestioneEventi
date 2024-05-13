const urlParams = new URLSearchParams(window.location.search);
const idEvento = urlParams.get('idEvento');

window.onload = async() =>{
    if(idEvento && idEvento != ""){
        let rsp = await fetch("/getEvento",{
            method: "POST",
            headers: {
                "content-type": "Application/json"
            },
            body:JSON.stringify({
                idEvento,
                email: sessionStorage.getItem("email")
            })
        })
        rsp = await rsp.json();
    }else{
        window.location.href = "./home.html";
    }
}