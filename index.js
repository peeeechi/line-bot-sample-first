"use strict";

const express = require("express");
const line = require("@line/bot-sdk");
const PORT = process.env.PORT || 3000;

const reservedWord = {
  yes: "はい",
  no: "いいえ",
  good: "良好",
  unGood: "不調",
  holiday: "休み"
};

const users = {};

const config = {
  channelSecret: "f3fd80f24af5af197518ab687a0dfc84",
  channelAccessToken:
    "qMnvcRLPrdWgt49tTgaKN8i9TjrAlFuwddw9q/f9fXuTFLpicsXGDq8jW7BtLr0VtxVE/JlXjgHbWGJAVNi3NNdRxZPE/QmwYRX4+7FctXKQ0e0gm7+/D1KalHk9qzSe6RMkHOvFDpajlGbnm4RMDwdB04t89/1O/w1cDnyilFU="
};

const app = express();

app.get("/", (req, res) => res.send("Hello LINE BOT!(GET)")); //ブラウザ確認用(無くても問題ない)
app.post("/webhook", line.middleware(config), (req, res) => {
  console.log(req.body.events);
  console.log(new Date(req.body.events[0].timestamp + 3600 * 1000 * 9));

  //ここのif分はdeveloper consoleの"接続確認"用なので削除して問題ないです。
  if (
    req.body.events[0].replyToken === "00000000000000000000000000000000" &&
    req.body.events[1].replyToken === "ffffffffffffffffffffffffffffffff"
  ) {
    res.send("Hello LINE BOT!(POST)");
    console.log("疎通確認用");
    return;
  }

  req.body.events.forEach(event => {
    users[event.source.userId] = event.replayToken;
  });

  const crypto = require("crypto");

  const channelSecret = "..."; // Channel secret string
  const body = "..."; // Request body string
  const signature = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  // Compare X-Line-Signature request header and the signature

  // res.status(200).end();

  Promise.all(req.body.events.map(handleEvent)).then(result =>
    res.json(result)
  );
});

const client = new line.Client(config);

async function handleEvent(event) {
  switch (event.type) {
    // フォロー時の処理
    case "follow":
      return replayFolloMessage(event);
      break;
    // フォロー解除時の処理
    case "unfollow":
      return unReplayFolloMessage(event);
      break;

    // メッセージ受信時の処理
    case "message":
      return sendTestMessage(event);
      break;
    // ポストバック受信時の処理
    case "postback":
      return getPostBack(event);
      break;

    default:
      return Promise.resolve(null);
      break;
  }
}

const getPostBack = async event => {
  console.log(JSON.parse(event.postback.data));

  const name = await client.getProfile(event.source.userId);
  return client.replyMessage(event.replyToken, {
    type: "text",
    text: "受け付けました"
  });
};

const replayFolloMessage = async event => {
  const profile = await client.getProfile(event.source.userId);
  const message = `${profile.displayName} さん、登録名(表示名)を送信してください`;

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: message
  });
};
const unReplayFolloMessage = async event => {
  const profile = await client.getProfile(event.source.userId);
  // const message = `${profile.displayName} さん、登録名(表示名)を送信してください`

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: "バイバイ"
  });
};

const sendTestMessage = async event => {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  // const confirm = {
  //   "type": "template",
  //   "altText": "this is a confirm template",
  //   "template": {
  //       "type": "confirm",
  //       "text": "Are you sure?",
  //       "actions": [
  //           {
  //             "type": "message",
  //             "label": "Yes",
  //             "text": "yes"
  //           },
  //           {
  //             "type": "message",
  //             "label": "No",
  //             "text": "no"
  //           }
  //       ]
  //   }
  // }

  const temp = {
    type: "template",
    altText: "This is a buttons template",
    template: {
      type: "buttons",
      thumbnailImageUrl: "https://example.com/bot/images/image.jpg",
      imageAspectRatio: "rectangle",
      imageSize: "cover",
      imageBackgroundColor: "#FFFFFF",
      title: "Menu",
      text: "Please select",
      defaultAction: {
        type: "uri",
        label: "View detail",
        uri: "http://example.com/page/123"
      },
      actions: [
        {
          type: "postback",
          label: "Buy",
          data: "action=buy&itemid=123"
        },
        {
          type: "postback",
          label: reservedWord.unGood,
          data: JSON.stringify({
            id: event.source.userId,
            status: reservedWord.unGood
          })
        },
        {
          type: "uri",
          label: "View detail",
          uri: "http://example.com/page/123"
        }
      ]
    }
  };
  // const name = await client.getProfile(event.source.userId);

  // return client.replyMessage(event.replyToken, {
  //   type: 'text',
  //   text: `${name.displayName}: ${name.userId}さん,${event.message.text}` //実際に返信の言葉を入れる箇所
  // });

  const requestName = event.message.text;

  return client.replyMessage(event.replyToken, temp);
  // return client.replyMessage(event.replyToken, {
  //   type: 'template',
  //   altText: 'alt',
  //   template: {
  //     type: 'confirm',
  //     text: `「${requestName}」で登録してよろしいですか？`,
  //     actions: [
  //       {
  //         type: 'message',
  //         label: reservedWord.yes,
  //         text: reservedWord.yes
  //       },
  //       {
  //         type: 'message',
  //         label: reservedWord.no,
  //         text: reservedWord.no
  //       }
  //     ]
  //   }
  // })
};

setInterval(() => {
  // const userArray = [];
  // Object.keys(users).forEach(key => {
  //   userArray.push(users[key]);
  // })
  // if (userArray.length > 0) {
  //   userArray.forEach(replayID => {
  //     client.replyMessage(replayID, {
  //       type: 'text',
  //       text: new Date().toDateString()
  //     })
  //   });
  // }

  client.broadcast([
    {
      type: "text",
      text: "broadcast1"
    },
    {
      type: "text",
      text: "broadcast2"
    }
  ]);
}, 5000);

app.listen(PORT);
console.log(`Server running at ${PORT}`);
