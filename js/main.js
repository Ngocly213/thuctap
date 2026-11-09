fetch("data/conversations.json")
  .then((res) => res.json())
  .then((data) => {
    console.log(data.length);
    console.log(data.slice(0, 20));
  });

const channelIcons = {
  whatsapp: "images/icon-whatsapp.svg",
  zalo: "images/icon-zalo.webp",
  message: "images/icon-message.png",
};