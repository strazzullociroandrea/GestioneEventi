const tableUsers = document.getElementById("table-users");
const buttonInvita = document.getElementById("button-invita");

const userId = sessionStorage.getItem("id");
let users;
let eventId;

window.onload = () => {
  const searchParams = new URLSearchParams(window.location.search);
  eventId = searchParams.get("idEvento");

  fetch("/getOtherUsers?userId=" + userId + "&eventId=" + eventId, {
    method: "GET",
  }).then((res) => {
    res.json().then((results) => {
      console.log(results);
      users = results;
      render();
    });
  });
};
console.log("idUser", userId);

buttonInvita.onclick = () => {
  let selected = [];
  document.querySelectorAll("input[type=checkbox]").forEach((check) => {
    if (check.checked) {
      selected.push(check.id);
    }
  });

  //In selected ho l'elenco degli id delle checkbox utenti da invitare
  let users = [];
  selected.forEach((item) => {
    id = item.split("-");
    users.push(id[1]);
  });
  console.log("invita", selected, eventId);
  fetch("/invitaUtenti", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      userIds: users,
      eventId: eventId,
    }),
  });
  console.log("go back");
  window.history.back();
};
const render = () => {
  let html = "";
  users.forEach((user) => {
    html +=
      "<tr><td ><input type='checkbox' id='user-" +
      user.id +
      "'> <label for='user-" +
      user.id +
      "'>" +
      user.username +
      "</label></td></tr>";
  });
  tableUsers.innerHTML = html;
};
