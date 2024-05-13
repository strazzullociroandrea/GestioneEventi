const tableUsers = document.getElementById("table-users");
const buttonInvita = document.getElementById("button-invita");

const userId = sessionStorage.getItem("id");
let users;

console.log("idUser", userId);

buttonInvita.onclick = () => {
  let selected = [];
  document.querySelectorAll("input[type=checkbox]").forEach((check) => {
    if (check.checked) {
      selected.push(check.id);
    }
  });

  //In selected ho l'elenco degli id degli utenti da invitare

  console.log("invita", selected);
  fetch("/invitaUtenti", {
    method: "POST",
    body: JSON.stringify({
      userIds: selected,
    }),
  });
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

fetch("/getOtherUsers?userId=" + userId, {
  method: "GET",
}).then((res) => {
  res.json().then((results) => {
    console.log(results);
    users = results;
    render();
  });
});
