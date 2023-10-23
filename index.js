const express = require("express");
const prompts = require("prompts");
const path = require("path");
const MTProto = require("@mtproto/core");

const app = express();

const api_id = 27951906;
const api_hash = "0ba05a8b52d61bdc5ce8523eed82c59e";

async function getPhone() {
  return (
    await prompts({
      type: "text",
      name: "phone",
      message: "Enter your phone number:",
    })
  ).phone;
}

async function getCode() {
  return (
    await prompts({
      type: "text",
      name: "code",
      message: "Enter the code sent:",
    })
  ).code;
}

async function getPassword() {
  return (
    await prompts({
      type: "text",
      name: "password",
      message: "Enter Password:",
    })
  ).password;
}

app.get("/", (req, res) => {
  const mtproto = new MTProto({
    api_id,
    api_hash,
    storageOptions: {
      path: path.resolve(__dirname, "./data/1.json"),
    },
  });

  mtproto
    .call("users.getFullUser", {
      id: {
        _: "inputUserSelf",
      },
    })
    .then(() => {
      mtproto.updates.on("updateShortChatMessage", (updateInfo) => {
        console.log("updateShortChatMessage:", updateInfo);
      });
    })
    .catch(async (error) => {
      console.log("[+] You must log in");
      const phone_number = await getPhone();

      mtproto
        .call("auth.sendCode", {
          phone_number: phone_number,
          settings: {
            _: "codeSettings",
          },
        })
        .catch((error) => {
          if (error.error_message.includes("_MIGRATE_")) {
            const [type, nextDcId] = error.error_message.split("_MIGRATE_");

            mtproto.setDefaultDc(+nextDcId);

            return sendCode(phone_number);
          }
        })
        .then(async (result) => {
          return mtproto.call("auth.signIn", {
            phone_code: await getCode(),
            phone_number: phone_number,
            phone_code_hash: result.phone_code_hash,
          });
        })
        .catch((error) => {
          if (error.error_message === "SESSION_PASSWORD_NEEDED") {
          }
        })
        .then((result) => {
          console.log("[+] successfully authenticated");
          startListener();
        });
    });

  res.send("main");
});

app.get("/send", async (req, res) => {
  mtproto.call("messages.sendMessage", {
    clear_draft: true,
    peer: {
      _: "inputPeerChat",
      chat_id: "4039272201",
    },
    message: "Hello @mtproto_core",
    entities: [
      {
        _: "messageEntityBold",
        offset: 6,
        length: 13,
      },
    ],

    random_id:
      Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
  });

  res.send("success");
});

app.listen(3000);
