import axios from "axios";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

require("dotenv").config();

import fetch from "node-fetch";
import { createApi } from "unsplash-js";

const unsplash = createApi({
  accessKey: "l5-9nKCv87CloykqBAy3yuDn5iFiLkZ9As6FATkGoOE",
  fetch: fetch,
});

const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.MEDIA_KEY);

bot.start((ctx) => {
  ctx.reply("Hello World!");
});

//! sends image of the query
bot.command("image", async (ctx, next) => {
  const chatId = ctx.chat.id;
  const query = ctx.message.text.slice(6);

  bot.telegram.sendChatAction(chatId, "upload_photo");

  if (query.length > 0) {
    await unsplash.search
      .getPhotos({
        query: query,
        page: 1,
      })
      .then((photos) => {
        if (photos.response.total <= 1) throw new Error("Query Invalid");

        let random = Math.floor(Math.random() * 8);
        [...photos.response.results].forEach((photo, index) => {
          if (index === random) {
            const url = photo.urls.regular;
            ctx.telegram.sendPhoto(chatId, url);
          }
        });
      })
      .catch((e) => {
        console.log(e.message);
        ctx.reply("Sorry, We couldn't find any photos matching the query");
      });
  } else {
    ctx.reply("Please enter a valid query");
  }
});

//! sends the cities from the city folder
bot.command("cities", (ctx, next) => {
  const chatId = ctx.chat.id;

  bot.telegram.sendChatAction(chatId, "upload_photo");

  let cities = [
    "media/ahmedabad.jpg",
    "media/mumbai.jpg",
    "media/delhi.jpg",
    "media/chennai.jpg",
  ];

  let result = cities.map((city) => {
    return {
      type: "photo",
      media: {
        source: city,
      },
    };
  });

  bot.telegram.sendMediaGroup(chatId, result);
});

//! send the document with source and then thumbnail with the source
bot.command("docus", (ctx, next) => {
  const chatId = ctx.chat.id;
  bot.telegram.sendChatAction(chatId, "upload_document");
  bot.telegram.sendDocument(
    chatId,
    {
      source: "./media/city_list.txt",
    },
    {
      thumb: { source: "media/ahmedabad.jpg" },
      caption: "Here is the list of cities",
      parse_mode: "Markdown",
    }
  );
});

//! sends the location using the geolocation api
bot.command("location", async (ctx, next) => {
  const params = {
    access_key: process.env.LOCATION_API,
    query: ctx.message.text.slice(10),
    limit: 1,
  };

  await axios
    .get("http://api.positionstack.com/v1/forward", { params })
    .then((response) => {
      return response.data;
    })
    .then((res) => {
      console.log(res.data[0]);
      const lat = res.data[0].latitude;
      const lon = res.data[0].longitude;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}`;

      bot.telegram.sendLocation(ctx.chat.id, lat, lon, {
        caption: "Hello",
        reply_to_message_id: ctx.message.message_id,
      });
      bot.reply(`Google Maps: ${url}`);
    })
    .catch((e) => console.log("error", e.message));
});


bot.launch();
