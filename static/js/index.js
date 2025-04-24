document.addEventListener('alpine:init', () => {
    // let alert = new AlertClass();
    const host = 'https://footballs.duole.lol';
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
    let msgobjct = {};
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

                if (retryCount < config.maxRetries) {
                    retryCount++;
                    console.log(`Retrying in ${config.retry}ms...`);
                    setTimeout(connect, config.retry);
                } else {
                    console.error('Max retries reached');
                }
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
    async function playsound(name) {
        const audio = document.querySelector(`audio[name="${name}"]`);
        await audio.play();
    }

    function formatTimestamp(timestamp) {
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

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    async function parseData(key,data) {
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
            let [p,m] = pscore.split('-'),
                _p = parseInt(p),
                _m = parseInt(m);
            let [a, b] = bcscore.split('-'),
                _a = parseInt(a),
                _b = parseInt(b),
                bot =  (_a + _b) - (_p + _m) > 0,
                flag = key === '1' ? _a > 0 || _b > 0 : bot,
                rec = key === '1' ? '半场大' : `${_p + _m +1}内大`, 
                ico = flag && overtime.trim() !== '' ? '✅' : overtime.trim() !== '' ? '❌' : '⌛️';
            return [time, ptime, team, status, pscore, fteam, score, lteam, bcscore, rtime, shezheng, hattack, attack, biglow, height, intime, outime, rec, ico, overtime, flag]
            } catch (error) {
                return [];
            }
            
        });
        return data;
    }

    Alpine.data('app', () => ({
        isVisible: true,
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
        uname: '上半场',
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
                let { token, expire_time, days, code, msg } = await result.json();
                this.isVisible = false;
                if (code !== 200) {
                    this.title = `${msg}, 请重新输入卡密`;
                    return Toast.fire({
                        icon: "error",
                        title: this.title
                    }).then(() => {
                        this.login();
                    });

                }
                this.expiry_time = formatTimestamp(expire_time);
                Toast.fire({
                    icon: "success",
                    title: msg
                }).then(() => {
                    this.recvdata(token);
                    playsound('sort');
                });
            }
        },
        async recvdata(token) {
            this.eventsources = createEventSource(
                `${host}/user/stream/${token}`,
                {
                    retry: 5000,
                    maxRetries: 10
                },
                async (event) => {
                    // console.log(event);
                    let { data, type } = event;
                    if(type === 'message' && this.eventsources){
                        let decdata = decrypt(data, token);
                        if (!decdata) {
                            return;
                        }
                        let key = decdata[0];
                        decdata = decdata.slice(1);
                        let msgList = await parseData(key,decdata);
                        if (msgList.length < 1) return;
                        msgList = msgList.filter(item => item.length > 0);
                        let originlnames = msgList.map(item=>item[5]),
                        oldnames = this.objmsgList[key].map(item=>item[5]),
                        name = originlnames.lenght !== oldnames.length ? 
                            originlnames.filter(item => {
                                !oldnames.includes(item)
                            }).join(' ').trim() : '';
                        name && (
                            playsound('message'),
                                 Swal.fire({
                                color:'#eee',
                                position: "top-end",
                                background:'#0053de',
                                timerProgressBar: true,
                                title: `有新的赛事消息： ${items[index]}`,
                                showConfirmButton: false,
                                timer: 2500
                            })
                        )
                        this.objmsgList[key] = [...msgList]
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
        async userlogin(evt){
            let name = evt.target.title;
            this.uname = evt.target.innerText;
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
                    return;
                case 'history':

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
            }).then(({isConfirmed}) => {
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
            this.login();
            this.isVisible = false;
            setInterval(async () => {
                this.now_time = formatTimestamp(Date.now());
            }, 1000);
        }

    }));
});
