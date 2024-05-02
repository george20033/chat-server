import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { fileURLToPath } from "url";
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  console.log(__dirname);

  const app = express();
  const port = process.env.PORT || 3550;
  const ADMIN = process.env.ADMIN || "Admin";

  //state
  const usersState = {
    users: [],
    setUsers: function (newUsersArray) {
      this.users = newUsersArray;
    },
  };

  const expressServer = app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`)
  );
  // the backend server and frontend server are on the same server
  app.use(express.static(path.join(__dirname, "public")));

  const ioServer = new Server(expressServer, {
    cors: {
      origin:
        process.env.CLIENT_URL === "production"
          ? false
          : ["http://localhost:5500", "http://127.0.0.1:5500"],
    },
  });

  ioServer.on("connection", (socket) => {
    //when connected - only to user
    socket.emit("message", createMessage(ADMIN, "Welcome to the chat"));
    //when connected - to all client except the user

    socket.on("enterRoom", ({ name, room }) => {
      const previousRoom = findUser(socket.id)?.room;
      if (previousRoom) {
        socket.leave(previousRoom);
        ioServer
          .to(previousRoom)
          .emit("message", createMessage(ADMIN, `${name} has left the room`));
      }
      //activate the user
      const user = activateUser(socket.id, name, room);
      //update previous room  users list
      if (previousRoom)
        ioServer
          .to(previousRoom)
          .emit("usersList", getUsersInRoom(previousRoom));
      // user joins the room
      socket.join(user.room);
      //message to the joined user
      socket.emit("message", createMessage(ADMIN, `Welcome ${user.name}`));
      //send message to the room
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          createMessage(ADMIN, `${user.name} has joined the room`)
        );

      //send the list of users in the room
      ioServer.to(user.room).emit("usersList", getUsersInRoom(user.room));
      //update the list of rooms
      ioServer.emit("roomList", activeRooms());
    });
    // here we listen for the message event
    socket.on("message", ({ name, text }) => {
      const user = findUser(socket.id);
      // .emit sends the message to all connected clients in the room
      if (user.room) {
        ioServer.to(user.room).emit("message", createMessage(name, text));
      }
    });
    socket.on("disconnect", () => {
      const user = findUser(socket.id);
      if (user) {
        userLeaves(socket.id);

        ioServer
          .to(user.room)
          .emit(
            "message",
            createMessage(ADMIN, `${user.name} has left the room`)
          );
        ioServer.to(user.room).emit("usersList", getUsersInRoom(user.room));
      }
      //the user can be the last one in the room
      ioServer.emit("roomList", activeRooms());
    });
    socket.on("activity", (name) => {
      const user = findUser(socket.id);
      if (user.room) {
        socket.broadcast.to(user.room).emit("activity", name);
      }
    });
  });

  function createMessage(name, message) {
    return {
      name,

      message,
      time: new Intl.DateTimeFormat("default", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      }).format(new Date()),
    };
  }

  // user
  function activateUser(id, name, room) {
    const user = { id, name, room };
    usersState.setUsers([
      ...usersState.users.filter((user) => user.id !== id),
      user,
    ]);
    return user;
  }
  function userLeaves(id) {
    usersState.setUsers(usersState.users.filter((user) => user.id !== id));
  }

  function findUser(id) {
    return usersState.users.find((user) => user.id === id);
  }
  function getUsersInRoom(room) {
    return usersState.users.filter((user) => user.room === room);
  }
  function activeRooms() {
    return Array.from(new Set(usersState.users.map((user) => user.room)));
  }
} catch (error) {
  console.log(error);
}
