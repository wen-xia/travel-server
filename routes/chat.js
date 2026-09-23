const express = require('express');
const ChatService = require('../service/chatService');
const router = express.Router();
const { model, modelKey, modelUrl } = require('../config/index');
const chatService = new ChatService(model, modelKey, modelUrl);

/* POST plan. */
router.post('/plan', async function(req, res, next) {
  const body = req.body;
  console.log('body', body);
  const data = { 
    city: body.city,
    budget: body.budget,
    days: body.days
  };
  await chatService.initLLm();
  const initMsg = await chatService.plan(data);
  res.contentType('application/json');
  // res.contentType('text/stream');
  res.status(200).send(initMsg);
});

/* POST chat. */
router.post('/chat', function(req, res, next) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const body = req.body;
  console.log('body', body);
  chatService.initLLm();
  chatService.chat(body.historyMsg, (msg) => {
    if(msg.id === '[START]'){
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
      return;
    }
    if(msg.id === '[DONE]'){
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
      res.end();
      return;
    }
    if(msg.id === '[ERROR]'){
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
      res.end()
      return;
    }

    // console.log('msg', msg);
    // SSE协议规定的消息结束分隔标记格式：SSE 服务端推送的每一条事件，必须用连续两个换行来告诉浏览器：本条消息到此结束，可以触发 onmessage
    // data:内容 + 两个换行！！两个换行是分隔符，不能少
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
  });

  // res.contentType('text/stream');
  // res.status(200).send('你好');
});

module.exports = router;
