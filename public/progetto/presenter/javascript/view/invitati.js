const tableUsers = document.getElementById("table-users");

export const render = (users) => {
    let html = "";
    users.forEach((user) => {
      html +=
        "<tr><td ><input type='checkbox' id='user-" +
        user.id +
        "'> <td " +
        user.id +
        ">" +
        user.username +
        "</td></td></tr>";
    });
    tableUsers.innerHTML = html;
  };