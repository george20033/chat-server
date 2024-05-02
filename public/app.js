try {
  // Code for the client side of the chat application is shown below:
  //io imported from the cdn
  //put the base url of the server
  const socket = io("https://chat-server-tnzh.onrender.com/");
  const msgInput = document.querySelector("#message");
  const nameInput = document.querySelector("#name");
  const chatRoom = document.querySelector("#room");
  const activity = document.querySelector(".activity");
  const usersList = document.querySelector(".user-list");
  const roomList = document.querySelector(".room-list");
  const chatDisplay = document.querySelector(".chat-display");
  socket.addEventListener("open", () => {
    console.log("Connected to server");
  });
  const sendMessage = function (e) {
    e.preventDefault();

    if (msgInput.value && nameInput.value && chatRoom.value) {
      socket.emit("message", {
        name: nameInput.value,
        message: msgInput.value,
      });
      msgInput.value = "";
    }
    msgInput.focus();
  };
  function joinChat(e) {
    e.preventDefault();
    if (nameInput.value && chatRoom.value) {
      socket.emit("enterRoom", {
        name: nameInput.value,
        room: chatRoom.value,
      });
    }
  }

  document.querySelector(".form-msg").addEventListener("submit", sendMessage);
  document.querySelector(".form-join").addEventListener("submit", joinChat);

  msgInput.addEventListener("keypress", () => {
    socket.emit("activity", nameInput.value);
  });
  socket.on("message", ({ name, message, time }) => {
    console.log(message);
    document.querySelector(".activity").textContent = "";
    const li = document.createElement("li");
    li.className = "post";
    //position the message to the left or right
    if (name === nameInput.value) li.className = "post post--left";
    if (name !== nameInput.value && name !== "Admin")
      li.className = "post post--right";
    //identify the kind of message
    if (name !== "Admin") {
      //message header color
      li.innerHTML = `<div class="post__header ${
        name === nameInput.value ? "post__header--user" : "post__header--reply"
      }">
      <span class="post__header--name">${name}</span> 
      <span class="post__header--time">${time}</span> 
      </div>
      <div class="post__text">${message}</div>`;
    } else {
      li.innerHTML = `<div class="post__text">${message}</div>`;
    }

    document.querySelector(".chat-display").appendChild(li);
    //scroll to the bottom of the chat display
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  });
  // listen for the activity event
  let timeOut;
  socket.on("activity", (name) => {
    document.querySelector(".activity").textContent = `${name}is typing... `;
    //clear the activity message after 2 seconds
    clearTimeout(timeOut);
    setTimeout(() => {
      document.querySelector(".activity").textContent = "";
    }, 2000);
  });
  //listen for the usersList event
  socket.on("usersList", (users) => {
    showUsers(users);
    console.log(users);
  });
  //listen for the roomList event
  socket.on("roomList", (rooms) => {
    showRooms(rooms);
  });

  //show the list of users in the room
  function showUsers(users) {
    usersList.textContent = "";
    if (users) {
      usersList.innerHTML = `<em> users in ${chatRoom.value}:</em>`;
      users.forEach((user, i) => {
        usersList.innerHTML += `${i + 1}. ${user.name}`;
        if (i < users.length - 1) usersList.innerHTML += ", ";
      });
    }
  }
  function showRooms(rooms) {
    roomList.textContent = "";
    if (rooms.length <= 0) return;
    if (rooms) {
      console.log(rooms);
      roomList.innerHTML = `<em> Active Rooms:</em>`;
      rooms.forEach((room, i) => {
        roomList.innerHTML += `${i + 1}. ${room}`;
        if (i < rooms.length - 1) roomList.innerHTML += ", ";
      });
    }
  }
} catch (error) {
  console.log(error);
}
