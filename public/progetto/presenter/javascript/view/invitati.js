const tableUsers = document.getElementById("table-users");

export const render = (users) => {
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