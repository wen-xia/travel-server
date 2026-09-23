require('dotenv').config(); 
const { createAgent, HumanMessage } = require('langchain');
const { ChatOpenAI } = require("@langchain/openai");
const { initChatModel } = require("langchain/chat_models/universal");
const { initStructuredPrompt, systemPrompt } = require('../prompts/prompt');

module.exports = class ChatService {

  model = '';

  modelKey = '';

  modelUrl = '';

  llm = null;
  
  agent = null;

  constructor(model, modeKey, modelUrl) {
    this.model = model;
    this.modelKey = modeKey;
    this.modelUrl = modelUrl;
  }

  init() {
    console.log('init model');
    return '模型已经初始化';
  }

  initLLm(){
    //一直超时
    // this.llm = await initChatModel(this.model,{
    //         modelProvider: "openai",
    //         apiKey: this.modelKey, 
    //         baseURL: this.modelUrl,
    //         // temperature: 0.7,
    //         // timeout: 60000,
    //         // maxTokens: 1024,
    //         // maxRetries: 0,
    //     });
    // console.log('llm', this.llm);

    this.llm = new ChatOpenAI(
        this.model, 
        {
            configuration:{
                apiKey: this.modelKey, 
                baseURL: this.modelUrl,
            },
            temperature: 0.7,
            timeout: 10000,
            // streaming: true,
            // maxTokens: 1024,
        },
    );
  }

  async plan(msg) {
    const { city, budget, days } = msg;
    return await this.llm.invoke(initStructuredPrompt(city, budget, days))
    // return await this.llm.invoke([new HumanMessage('你好')])
  }

  chat(msg, callback) {
    try{
        console.log('systemPrompt(content)', systemPrompt(msg));
        this.llm.stream(systemPrompt(msg)).then(async (res) => {
            callback({ id: '[START]', role: 'assistant', content: '' });
            for await (const chunk of res) {
                if(chunk.content){
                    callback({ id: chunk.id, role: 'assistant', content: chunk.content });
                }
            }

            callback({ id: '[DONE]', role: 'assistant', content: '' });
        })
    } catch(err) {
        console.log('err', err);
        callback({ id: '[ERROR]', role: 'assistant', content: '' });
    }
  }

  initAgent() {
    this.agent = createAgent({
      model: new ChatOpenAI({ model: 'deepseek-ai/DeepSeek-V4-Flash', apiKey: this.modelKey, baseURL: this.modelUrl}),
      tools: [],
      systemPrompt: "你是旅行助手，帮用户规划旅游行程"
    });
  }
}