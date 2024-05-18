export const invitaUtenti = async(users, eventId) =>{
    await fetch("/invitaUtenti", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userIds: users,
          eventId: eventId,
          emailCorrente: sessionStorage.getItem("email")
        }),
      });
    window.history.back();
}