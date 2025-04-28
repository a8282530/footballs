document.addEventListener('alpine:init', () => {
    // let alert = new AlertClass();
    // const host = 'https://ball.duole.lol';
    const host = 'https://test-test-vmhappqoeo.cn-hangzhou.fcapp.run';
    const voices = window.speechSynthesis.getVoices();
    const Toast = Swal.mixin({
        toast: true,
        position: "center",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        didOpen: (toast) => {
            // toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });
    document.addEventListener('click', e => {
        // 播放一个静音的音频来解锁
        console.log('解锁音频');
        // this.playsound('0');
        const audio = new Audio();
        audio.play()
            .then(() => {
                console.log('音频解锁成功');

            })
            .catch(err => {
                console.error('无法解锁音频:', err);
            });
    });


    function createEventSource(url, options = {}, callback) {
        const config = {
            retry: 3000,
            maxRetries: 5,
            ...options
        };

        let retryCount = 0;
        let eventSource = null;

        function connect() {
            eventSource = new EventSource(url);

            eventSource.onopen = () => {
                console.log('Connection opened');
                retryCount = 0;
            };

            eventSource.onmessage = (event) => {
                try {
                    callback && callback(event);
                } catch (error) {
                    // console.error('Error parsing message:', error);
                }
            };
            eventSource.addEventListener('close', events => {
                callback && callback(events);
            });

            eventSource.onerror = (error) => {
                // console.error('EventSource error:', error);
                eventSource.close();
                setTimeout(connect, config.retry);
                // if (retryCount < config.maxRetries) {
                //     retryCount++;
                //     console.log(`Retrying in ${config.retry}ms...`);
                //     setTimeout(connect, config.retry);
                // } else {
                //     console.error('Max retries reached');
                // }
            };
        }

        function close() {
            if (eventSource) {
                eventSource.close();
            }
        }

        // 初始连接
        connect();

        // 返回控制接口
        return {
            close,
            getEventSource: () => eventSource
        };
    };


    async function sleep(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }
    window.playsound = async function (name) {
        const audio = document.querySelector(`audio[name="${name}"]`);
        await audio.play();
    }

    function formatTimestamp(timestamp, isFull = true) {
        // 1. 判断时间戳单位，如果是秒级（10位），则乘以1000转为毫秒
        if (timestamp.toString().length === 10) {
            timestamp *= 1000;
        }

        const date = new Date(timestamp);

        const year = date.getFullYear();
        // getMonth() 返回 0-11，所以需要 +1
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        return isFull ? `${year}-${month}-${day} ${hours}:${minutes}:${seconds}` : `${year}-${month}-${day}`;
    };

    function parseData(key, data) {
        if (!data) {
            return [];
        }
        data = data.split(';').map(item => {
            item = item.trim();
            try {
                let [time, ptime, team, status, pscore, fteam, score, lteam, bcscore, rtime, shezheng, hattack, attack, biglow, height, intime, outime, overtime] = item.split('|');
                rtime && (rtime = rtime.replace('&', ''));
                rtime && (rtime = rtime.split(',')[0]);
                rtime && (rtime = `${rtime} ⚑ 谨慎行动`);
                outime && (outime = outime.replace('&', ''));
                overtime && (overtime = overtime.replace('&', ''));
                let [p, m] = pscore.split('-'),
                    _p = parseInt(p),
                    _m = parseInt(m);
                let [a, b] = key === '1' ? bcscore.split('-') : score.split('(')[0].split('-'),
                    _a = parseInt(a),
                    _b = parseInt(b),
                    bot = (_a + _b) - (_p + _m) > 0,
                    flag = key === '1' ? _a > 0 || _b > 0 : bot,
                    rec = key === '1' ? '1球内大' : `${_p + _m + 1}球内大`,
                    ico = flag && overtime.trim() !== '' ? '✅' : overtime.trim() !== '' ? '❌' : '⌛️';
                return [time, ptime, team, status, pscore, fteam, score, lteam, bcscore, rtime, shezheng, hattack, attack, biglow, height, intime, outime, rec, ico, overtime, flag]
            } catch (error) {
                return [];
            }

        });
        return data;
    };

    function parseDatafull(key, data) {
        if (!data) {
            return [];
        }
        const m = {'赢':{ico:'✅',color:'#f00'}, '输':{ico:'❌',color:'#1aa282'}, '走': {ico:'💧',color:'#e97489'}};
        // #e97489
        data = data.split(';').filter(item => item.trim() !== '')
        data = data.map(item => {
            try {
                let [time, ptime, team, status, pscore, fteam, score, lteam, bcscore, rtime, shezheng, hattack, attack, biglow, height, rec, win, pan] = item.split('|'),
                // let flag = win === '赢';
                overtime = '',
                ico = status === '完场' ? m[win]?.ico || '⌛️' : '⌛️';
                return [time, ptime, team, status, '', fteam, score, lteam, pan, '', '', '', '', '', '', '', '', rec, ico, overtime, m[win]?.color || '#e97489']
            } catch (error) {
                console.log(error);

                return [];
            }

        });
        return data;
    };
    function symmetricDifference(arr1, arr2) {
        const set1 = new Set(arr1);
        const set2 = new Set(arr2);
        const diff1 = new Set([...set1].filter(x => !set2.has(x)));
        const diff2 = new Set([...set2].filter(x => !set1.has(x)));
        return [...diff1, ...diff2].join(' ').trim();
    };

    Alpine.data('app', () => ({
        isVisible: true,
        menutypes: ['上半场', '全场', '走地', '初盘', '历史', '退出'],
        unreadmsgList: [],
        isshowmsglist: false,
        card: '',
        now: '',
        toastMsg: '',
        toastisShow: true,
        title: '龙头AI卡密登录',
        now_time: formatTimestamp(Date.now()),
        online_count: 0,
        eventsources: null,
        objmsgList: {
            '1': [],
            '2': [],
            '3': [],
            '4': [],
            '5': [],
        },
        msgindex: '1',
        expiry_time: '',
        async showtoast(content, timer = 20000) {
            if (timer < 1000) return;
            if (this.toastMsg == content && this.toastisShow) {
                this.toastisShow = true;
                return;
            };
            this.toastMsg = content;
            this.toastisShow = false;
            await sleep(timer);
            this.toastisShow = true;
        },
        async login() {
            const { value: card } = await Swal.fire({
                title: this.title,
                width: 400,
                padding: "1em",
                color: "#716add",
                background: "#eee",
                focusConfirm: false,
                confirmButtonText: '登录',
                allowOutsideClick: false,
                input: "text",
                inputValidator: (result) => {
                    return !result && "请输入卡密";
                },
                inputPlaceholder: "请输入卡密"
            });
            if (card) {
                this.isVisible = true;
                let result = await fetch(`${host}/user/login/${card}`);
                let { token, expire_time, days, code, msg, now } = await result.json();

                this.isVisible = false;
                if (code !== 200) {
                    this.title = `${msg}, 如果提示已在线，请等待5秒重试!`;
                    return Toast.fire({
                        icon: "error",
                        title: this.title
                    }).then(() => {
                        this.login();
                    });

                }
                this.expiry_time = formatTimestamp(expire_time);
                this.now = now;
                Toast.fire({
                    icon: "success",
                    title: msg
                }).then(() => {
                    this.recvdata(token);
                    this.card = card;
                    playsound('sort');
                    Object.keys(localStorage).map(key => {
                        let value = localStorage.getItem(key);
                        let obj = JSON.parse(value);
                        if (obj.card === card) {
                            this.unreadmsgList.push(obj);
                        }
                        
                    });
                });
            }
        },
        async showMsgList(event){
            app.isshowmsglist = true;
            let html = `<div class="msg-readlist"><div class="msg-header">
                <span>消息时间</span>
                <span>开赛时间</span>
                <span>提示时间</span>
                <span>联赛</span>
                <span>状态</span>
                <span>主队</span>
                <span>比分</span>
                <span>客队</span>
                <span>推荐</span>
                <span>是否命中</span>
            </div><div class="msg-content">`;
            this.unreadmsgList.some(item => {
                let [time, ptime, team, status, pscore, fteam, score, lteam, bcscore, rtime, shezheng, hattack, attack, biglow, height, intime, outime, rec, ico, overtime, flag] = item.msglist,
                name = this.menutypes[item.index-1];
                html += `
                <div class="msg-item">
                    <span title="点击前往赛事详情" onclick="app.msgindex='${item.index}'">
                        <h1 class="nav-link">⬅️ ${name}</h1>
                        <h1>${item.date.slice(5)}</h1>
                    </span>
                    <span>${time}</span>
                    <span>${ptime}</span>
                    <span>${team}</span>
                    <span>${status}</span>
                    <span>${fteam}</span>
                    <span>${score}</span>
                    <span>${lteam}</span>
                    <span>${rec}</span>
                    <span>${ico}</span>
                    <span title='删除' class="msg-delete" id="${item.key}" onclick="playsound('delete'),app.removeread(parseInt(this.id)),this.parentNode.parentNode.removeChild(this.parentNode)">🗑️</span>
                </div>
                `;
            });
            html += `</div></div>`;
            Swal.fire({
                title: `📯 未读消息 📯`,
                width: '780px',
                color: "#716add",
                html,
                focusConfirm: false,
                confirmButtonText: '删除全部',
            }).then(({ isConfirmed }) => {
                app.isshowmsglist = false;
                if (!isConfirmed) {
                    return;
                }
                playsound('delete');
                this.unreadmsgList = [];
                localStorage.clear();
            });
        },
        removeread(key) {
            if (!key) return localStorage.clear();
            localStorage.removeItem(key)
            this.unreadmsgList = this.unreadmsgList.filter(item => item.key !== key);
        },
        onMsg5Change(index, msglist) {
            const key = Date.now(),
            date = formatTimestamp(key),
            vauleobj = {
                index,
                key,
                date,
                msglist
            };
            this.card && (vauleobj.card = this.card);
            const value = JSON.stringify(vauleobj);
            localStorage.setItem(key, value);
            this.unreadmsgList.push(vauleobj);
            playsound('message');
            !app.isshowmsglist && Swal.fire({
                color: '#eee',
                width: 500,
                position: "top-end",
                background: '#0053de',
                timerProgressBar: true,
                title: `✉️ ${this.menutypes[index-1]}  ${msglist[5]} 🆚 ${msglist[7]}`,
                showConfirmButton: false,
                timer: 25000
            })
        },
        async recvdata(token) {
            this.eventsources = createEventSource(
                `${host}/user/stream/${token}/${this.now}`,
                {
                    retry: 5000,
                    maxRetries: 10
                },
                async (event) => {
                    // console.log(event);
                    let { data, type } = event;
                    if (type === 'message' && this.eventsources) {
                        let decdata = decrypt(data, token);
                        if (!decdata) {
                            return;
                        }
                        let key = decdata[0];
                        decdata = decdata.slice(1);
                        if (key === '7'){
                            const log =  parseData('1', decdata);
                            return log.some(item => {
                                this.onMsg5Change(1, item);
                            });
                        }
                        if (key === '8'){
                            const log =  parseData('2', decdata);
                            return log.some(item => {
                                this.onMsg5Change(2, item);
                            });
                        }
                        if (key === '9'){
                            const log =  parseDatafull('3', decdata);
                            return log.some(item => {
                                this.onMsg5Change(3, item);
                            });
                        }
                        if (key === '0') {
                            let [timer, content] = decdata.split('|');
                            return this.showtoast(content, parseInt(timer) * 1000);
                        }
                        
                        let msgList = '1 2'.includes(key) ? parseData(key, decdata) : parseDatafull(key, decdata);
                        msgList = msgList.filter(item => item.length > 0);
                        if (msgList.length < 1) return;
                        // const [origin, pan] = this.objmsgList[key].map(item => [item[5],item[17]]);
                        // const newmsg = key === '1' ?  msgList.filter(item => !origin.includes(item[5])) : msgList.filter(item => !origin.includes(item[5]) || !pan.includes(item[17]));
                        // newmsg.length > 0 && this.onMsg5Change(key, newmsg[0]);
                        this.objmsgList[key] = msgList;
                        return
                    };
                    if (type === 'close' && this.eventsources) {
                        this.eventsources.close();
                        this.eventsources = null;
                        Swal.fire({
                            title: data,
                            icon: 'error',
                            confirmButtonText: '确定'
                        }).then(() => {
                            this.login();
                        });
                    }
                }
            );
        },
        async userlogin(evt) {
            let name = evt.target.title;
            switch (name) {
                case 'top':
                    this.msgindex = '1';
                    return;
                case 'bottom':
                    this.msgindex = '2';
                    return;
                case 'full':
                    this.msgindex = '3';
                    return;
                case 'init':
                    this.msgindex = '4';
                    Toast.fire({
                        icon: "info",
                        title: '初盘赛事正在完善中，请耐心等待！'
                    });
                    return;
                case 'history':
                    Toast.fire({
                        icon: "info",
                        title: '暂未开放，敬请期待！'
                    });
                    return;
                case 'logout':
                    break;
                default:
                    break;
            }
            Swal.fire({
                title: '确定退出当前用户？',
                icon: 'warning',
                confirmButtonText: '确定退出'
            }).then(({ isConfirmed }) => {
                if (!isConfirmed) {
                    return;
                }
                this.eventsources && this.eventsources.close();
                this.eventsources = null;
                this.msgList = [];
                this.expiry_time = '';
                this.title = '龙头AI卡密登录';
                this.login();
            });

        },
        async init() {
            window.app = this;
            this.login();
            this.isVisible = false;
            setInterval(async () => {
                this.now_time = formatTimestamp(Date.now());
            }, 1000);
        }

    }));
});
