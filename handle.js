const define = require('./define');
const request = require('request');
const database = require('./database');
const userdata = database.ref('userdata');
const leaderBoard = database.ref('leaderBoard');
const type = require('./type')
const util = require('./util')

module.exports = {
    sendMessage(senderId, msg) {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: define.TOKKEN,
            },
            method: 'POST',
            json: {
                recipient: {
                    id: senderId,
                },
                message: {
                    text: msg
                },
            }
        })
    },

    randomMath(level) {
        let index = Math.ceil(level / 2) + 1;
        let arr = Array.from(new Array(index)).map(o => Math.round(Math.random(0, 1) * (level % 2 == 0 ? index : index - 1) * 10)).join('%math%');
        while (arr.indexOf('%math%') != -1) arr = arr.replace('%math%', Math.random(0, 1) <= 0.5 ? '+' : '-');
        return arr
    },

    handleWebHookPos(req, res) {
        for (const entry of req.body.entry) {
            let id = entry.id;
            let time = entry.time;
            let db = userdata.child(`${id}`)
            for (const message of entry.messaging) {
                if (!message.sender || !message.sender.id || !message.message.text) continue;
                try {
                    let text = message.message.text;
                    db.once('value', (dat) => {
                        try {
                            let dataDB = dat.val();
                            //Add name
                            if (!dataDB) {
                                this.sendMessage(message.sender.id, 'Cho mình xin tên của bạn đi để bắt đầu trò chơi ^^');
                                dataDB = { user: message.sender.id };
                            } else if (!dataDB.name) {
                                if (text.length > 20) this.sendMessage(message.sender.id, 'Nhập tên hợp lệ và dưới 20 kí tự nhé bạn');
                                else {
                                    dataDB.name = text;
                                    this.sendMessage(message.sender.id, `Tên của bạn là: ${text}`);
                                }
                            }

                            //Check play stated
                            if (dataDB.name) {
                                if (!dataDB.gameStatus || dataDB.gameStatus == type.GAME_STATUS.NOTREADY) {
                                    this.sendMessage(message.sender.id, 'Bạn gõ "sẵn sàng" để bắt đầu chơi nhé');
                                    dataDB.gameStatus = type.GAME_STATUS.WAITING;
                                } else if (dataDB.gameStatus == type.GAME_STATUS.WAITING) {
                                    if (util.compareString(text, 'san sang')) {
                                        dataDB.gameStatus = type.GAME_STATUS.PLAYING;
                                    } else {
                                        this.sendMessage(message.sender.id, `Kí tự ${text} không hợp lệ, gõ "sẵn sàng" để bắt đầu chơi nha !`);
                                    }
                                }

                                if (dataDB.gameStatus == type.GAME_STATUS.PLAYING) {
                                    dataDB.gameData = dataDB.gameData || [];
                                    let lastMath = dataDB.gameData[dataDB.gameData.length - 1];
                                    if (lastMath) {
                                        if (eval(lastMath) == parseInt(text)) {
                                            let math = this.randomMath(dataDB.gameData.length / 5 + 1);
                                            dataDB.gameData.push(math);
                                            this.sendMessage(message.sender.id, `Chính xác: ${math}`);
                                        } else {
                                            dataDB.gameStatus = type.GAME_STATUS.WAITING;
                                            this.sendMessage(message.sender.id, `Chưa chính xác rồi\nBạn đã hoàn thành ${dataDB.gameData.length - 1} câu hỏi trong ${Math.round((new Date().getTime() - dataDB.gameTime)/1000)} giây\nGõ "sẵn sàng" để bắt đầu lại nha`);
                                            dataDB.gameData = [];
                                        }
                                    } else {
                                        let math = this.randomMath(dataDB.gameData.length / 5 + 1);
                                        dataDB.gameData.push(math);
                                        dataDB.gameTime = new Date().getTime();
                                        this.sendMessage(message.sender.id, `Bắt đầu nào: ${math}`);
                                    }
                                }
                            }

                            //Save database
                            db.set(dataDB);
                        } catch (error) {
                            console.error(error);
                            this.sendMessage(message.sender.id, 'Có chút vấn đề trong quá trình xử lý, bạn thông cảm nha');
                        }
                    })
                } catch (error) {
                    console.error(error);
                    this.sendMessage(message.sender.id, 'Có chút vấn đề trong quá trình xử lý, bạn thông cảm nha');
                }
            }
        }
    }
}