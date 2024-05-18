export const getInvitati = async (idEvento) =>{
    let rsp = await fetch("/getOtherUsers?userId=" + userId + "&eventId=" + eventId, {
        method: "GET",
      })
    rsp = await rsp.json();
    return rsp;
}