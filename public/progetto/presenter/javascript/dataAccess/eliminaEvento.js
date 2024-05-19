export const eliminaEvento = async(id) =>{
     id = id.split("-");
    await fetch("/deleteEvento", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          event: {
            idEvento: id[1],
            idUtente: id[2],
          },
          emailCorrente: sessionStorage.getItem("email"),
        }),
      }).then((res) => {
         location.reload();
      })
}