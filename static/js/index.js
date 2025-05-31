document.addEventListener('alpine:init', () => {
    // let alert = new AlertClass();
    // const host = 'https://ball.duole.lol';
    const host = 'https://ball-v1.duole.lol';
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

    async function sleep(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    };
    window.playsound = async function (name) {
        const audio = document.querySelector(`audio[name="${name}"]`);
        audio && await audio.play();
    };

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

    Alpine.data('app', () => ({
        isVisible: true,
        menutypes: ['上半场', '全场', '走地', '皇冠上半场', '初盘', '历史', '退出'],
        unreadmsgList: [],
        isshowmsglist: false,
        card: '',
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
        // 计算动画持续时间的函数
        calculateAnimationDuration() {
            // 估算文本长度 (字符数作为简单估算)
            const textLength = this.toastMsg.length;

            // 基础速度系数
            const baseSpeed = 0.2; // 每字符秒数

            // 计算持续时间 (最小8秒，最大30秒)
            return Math.min(Math.max(textLength * baseSpeed, 8), 30);
        },
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
                let { token, expire_time, days, code, msg } = await result.json();

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
                Toast.fire({
                    icon: "success",
                    title: msg
                }).then(() => {
                    this.card = card;
                    playsound('sort');
                    sessionStorage.setItem('topicsession', JSON.stringify({ token, card, expire_time }));
                    const event = new CustomEvent('action_event', {
                        detail: { token, card, type: 'recvdata', host } // 可以传递自定义数据
                    });
                    document.dispatchEvent(event);

                });
            }
        },
        async showMsgList(event) {
            app.isshowmsglist = true;
            this.unreadmsgList.sort((a, b) => a.item.overtime.localeCompare(b.item.overtime)).reverse();
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
                let { starttime, prompttime, league, status, hometeam, score, awayteam, rec, hit } = item.item,
                    name = this.menutypes[item.index - 1];
                html += `
                <div class="msg-item">
                    <span title="点击前往赛事详情" onclick="app.msgindex='${item.index}'">
                        <h1 class="nav-link">⬅️ ${name}</h1>
                        <h1>${item.date.slice(5)}</h1>
                    </span>
                    <span>${starttime}</span>
                    <span>${prompttime}</span>
                    <span>${league}</span>
                    <span>${status}</span>
                    <span>${hometeam}</span>
                    <span>${score}</span>
                    <span>${awayteam}</span>
                    <span>${rec}</span>
                    <span>${hit}</span>
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
        onMsgChange(index, item) {
            const key = Date.now(),
                date = formatTimestamp(key),
                vauleobj = {
                    index,
                    key,
                    date,
                    item
                };
            let olddata = localStorage.getItem(key);
            if (olddata) {
                let obj = JSON.parse(olddata)
                if (JSON.stringify(obj.item) === JSON.stringify(item)) {
                    return;
                }
            }
            this.card && (vauleobj.card = this.card);
            const value = JSON.stringify(vauleobj);
            localStorage.setItem(key, value);
            this.unreadmsgList.push(vauleobj);

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
                case 'huangguan':
                    this.msgindex = '4';
                    return;
                case 'init':
                    this.msgindex = '5';
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
                const newEvent = new CustomEvent('action_event', {
                    detail: { type: 'logout', card: this.card, host } // 可以传递自定义数据
                });
                document.dispatchEvent(newEvent);
                this.login();
            });

        },
        async init() {
            window.app = this;
            document.addEventListener('render_event', event => {
                let { code, data, msg } = event.detail;
                if (code !== 200) {
                    return Swal.fire({
                        title: msg || '登录失败，请重新登录！',
                        icon: 'error',
                        confirmButtonText: '确定'
                    }).then(() => {
                        this.login();
                    });
                }
                data.length > 0 && data.some(item => {
                    const { type, value } = item;
                    if (type === '0') {
                        let { content, timer } = value;
                        return this.showtoast(content, timer);
                    }
                    try {
                        value.sort((a, b) => a.overtime.localeCompare(b.overtime)).reverse();
                    } catch (e) {
                        console.log('sort error:', e);
                    }

                    if (this.objmsgList[type].length > 0) {
                        let res = getChangedItems(this.objmsgList[type], value);
                        if (res.length > 0) {
                            playsound('message');
                            res.some(item =>{
                                this.onMsgChange(type, item);
                            });
                            !app.isshowmsglist && this.showMsgList();
                        }
                    }
                    this.objmsgList[type] = value;
                });

            })
            const topicsession = sessionStorage.getItem('topicsession');
            try {
                const { token, card, expire_time } = topicsession ? JSON.parse(topicsession) : {};
                if (token && card) {
                    this.card = card;
                    this.expiry_time = formatTimestamp(expire_time);
                    const event = new CustomEvent('action_event', {
                        detail: { token, card, type: 'recvdata', host }
                    });
                    // await sleep(1000);
                    document.dispatchEvent(event);
                    this.isVisible = false;
                } else {
                    this.isVisible = false;
                    this.login();
                }
            } catch (error) {
                this.isVisible = false;
                this.login();
            }
            setInterval(async () => {
                this.now_time = formatTimestamp(Date.now());
            }, 1000);
            this.card && Object.keys(localStorage).map(key => {
                let value = localStorage.getItem(key);
                let obj = JSON.parse(value);
                obj.card === this.card && this.unreadmsgList.push(obj);
            });
        }

    }));
});
