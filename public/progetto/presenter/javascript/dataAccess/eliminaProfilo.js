export const eliminaProfilo = async() =>{
    let rsp = await fetch("/deleteAccount", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: sessionStorage.getItem("email"),
        }),
      });
      rsp = await rsp.json();
}