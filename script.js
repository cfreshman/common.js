// common.js @ https://freshman.dev/lib/2/common/script.js https://freshman.dev/copyright.js

if (globalThis.is_server === undefined) globalThis.is_server = !globalThis['window']
globalThis['window']=globalThis;window['document']=window['document']||{}
if (!window['common.js']) {
    window['common.js'] = Date.now()
    console.debug(window['common.js'])
    
    // const window = globalThis.window || Object.assign({}, {
    //     XMLHttpRequest: class {open=()=>{};send=()=>{}},
    //     location: {origin:'node'},
    //     document: {querySelector:()=>undefined,querySelectorAll:()=>[]}
    // }, globalThis)

    window.debug = console.debug.bind(console)
    window.named_log = (name, print=console.debug.bind(console)) => (...x) => print(`[${name}]`, ...x)
    'c' in window || Object.defineProperties(window, {
        c: {
            get: () => console.clear()
        },
    })
    const log = named_log('common.js')

    window.xhr = src => {
        log('xhr', src)
        return (x => {
            x.withCredentials = false
            x.open('GET', src, false)
            x.send()
            return x.responseText
        })(new XMLHttpRequest())
    }
    const _dependencies = {}
    window.dependency = src => {
        if (!_dependencies[src]) {
            _dependencies[src] = true
            document.head.append((x => Object.assign(x, { innerHTML:xhr(src) }))(document.createElement('script')))
        }
    }
    if (!is_server) {
        window.server = (location.port === '3030') ? location.origin : 'https://freshman.dev'
        dependency(server + '/lib/2/ve/ve.js')
        dependency(server + '/lib/2/css/script.js')
    }

    // window.dependency_import = /* synchronous import with parallelized calls */ (import_definition={
    //     'common': ['/lib/2/common/script.js', []],
    //     '/lib/2/ve/ve.js': ['common'],
    // }, opts={domain='https://freshman.dev'}={}) => {

    //     // 

        

    //     // transform into list of parallelizable sequential import chains
    //     const parallel_import_chains = []

    //     parallel_import_chains.map(x => dependency(new URL(x, opts.domain).toString()))
    // }
    // dependency_import([
    //     '/lib/2/ve/ve.js',
    // ])

    if (!is_server) window.devices = {
        is_mobile: JSON.parse(localStorage.getItem('dev-mobile') || '0') || /iPhone|iPod|Android|Pixel|Windows Phone/i.test(navigator.userAgent),
        toggle_mobile: () => {
            localStorage.setItem('dev-mobile', JSON.stringify(!devices.is_mobile))
            location.reload()
        },
        is_watch: (() => {
            // true if physical screen is small and square-ish
            const physical = {
              width: screen.width / devicePixelRatio,
              height: screen.height / devicePixelRatio,
            }
            return physical.width < 400 && Math.abs(1 - (physical.width / physical.height)) < .5
        })(),
        get is_non_watch_mobile() {return devices.is_mobile && !devices.is_watch}, get is_mobile_not_watch() {return this.is_non_watch_mobile},
        get is_desktop() {return !devices.is_mobile},
    }

    window.pass = x=>x
    window.exists = x=>x!==undefined
    window.truthy = x=>!!x
    window.apply = (f, ...x) => typeof f === 'function' ? f(...x) : f
    window.compose = (...fs) => (...x) => fs.slice(1).reduce((v, fs) => f(v), funcs[0] && funcs[0](...args))
    window.pipe = (value, ...funcs) => compose(...funcs)(value)
    window.fs = (x) => {
        return {
            pipe: (f) => fs(f(x)),
            with(f) { f(x); return this },
            x, value:x,
        }
    }
    window.fnot = (f) => !apply(f)

    Promise.prototype.with = function(f) { return this.then(async x => { await f(x); return x }) }
    window.ActionablePromise = class extends Promise {
        constructor(executor=()=>{}) {
            let resolve, reject
            super((_resolve, _reject) => {
                resolve = _resolve
                reject = _reject
                executor(resolve, reject)
            })
            this.resolve = resolve
            this.reject = reject
        }
    }

    window.isNonArrayObject = (x) => !Array.isArray(x) && typeof(x) === 'object'
    window.isString = (x) => typeof(x) === 'string'
    window.strings = {
        json: {
            parse: JSON.parse,
            stringify: JSON.stringify,
            pretty: (object) => JSON.stringify(object, null, 2),
            equal: (a, b) => JSON.stringify(a) === JSON.stringify(b), eq:(...x)=>strings.json.equal(...x),
        },
    }

    window.list = (data='', seperator=' ') => typeof(data) === 'string' ? data.split(seperator) : Array.from(data)
    window.set = (data='', seperator=' ') => new Set(list(data, seperator))
    window.lists = {
        of: list,
        remove: (xs, x) => {
            const i = xs.indexOf(x)
            if (i > -1) xs.splice(i, 1)
            return xs
        },
        clear: (xs) => {
            xs.splice(0, xs.length)
            return xs
        },
        joins: (xs, ...separators) => (separators.length === 1 ? xs : xs.map(x => lists.joins(x, ...separators.slice(1)))).join(separators[0]),
        order: (xs, is) => is.map(i => xs[i]),
        first: (xs, n) => xs.slice(0,n),
        last: (xs, n) => xs.slice(n-1),

        objectable: (data='', seperator=' ') => {
            const _objectable = (x) => {
                x._keys = x._keys ?? x
                // Object.defineProperty(x, 'object', {
                //     get: function() {
                //         if (!this._keys) throw 'objectable(array) required'
                //         return from(zip(this._keys, this))
                //     }
                // })
                return x
            }
            const Objectable = class extends Array {
                constructor(...x) {return _objectable(super(...x))}
                // map(...x) {return _objectable(Object.assign(super.map.apply(this, x), {_keys:this._keys||this}))}
                map(...x) {return Object.assign(super.map.apply(this, x), {_keys:this._keys||this})}
                filter(...x) {return _objectable(super.filter.apply(this, x))}
                slice(...x) {return _objectable(super.slice.apply(this, x))}
                get object() {
                    if (!this._keys) throw 'objectable(array) required'
                    return from(zip(this._keys, this))
                }
            }
            return new Objectable(...list(data, seperator))
        },
        init_object: (xs) => objectable(xs),
        finalize_object: (xs) => {
            const result = xs.object
            if (!xs._keys || !result) throw 'init_object(array) required'
            return result
        }
    }

    window.keys = (data=[], sep=' ') => isNonArrayObject(data) ? list(Object.keys(data)) : list(data, sep)
    window.values = (data=[], sep=' ') => isNonArrayObject(data) ? list(Object.values(data)) : list(data, sep)
    window.entries = (data=[], sep=' ') => {
        const vs = values(data, sep)
        return keys(data, sep).map((k,i) => [k, vs[i]])
    }
    window.from = (data=[], sep=' ') => {
        if (isNonArrayObject(data)) return data
        if (isString(data)) return from(list(data, sep).map(x => [x,x]))
        return Object.fromEntries((data).filter(truthy))
    }
    window.zip = (...x) => Array.from(x[0]).map((_,i) => x.map(y => y[i]??undefined))
    window.named = (keys=[], values=[], sep=' ') => {
        return from(zip(list(keys, sep), list(values, sep)))
    }
    window.counts = (data='', seperator=' ') => list(data, seperator).reduce((counts, x) => {
        counts[x] = 1 + (counts[x] || 0)
        return counts
    }, {})
    window.object = (data='', seperator=' ') => from(
        typeof data !== 'object' || Array.isArray(data) 
        ? list(data, seperator).map(x => [x, true])
        : entries(data))
    window.object_list = (data='', seperator=' ') => {
        const raw = object(data, seperator)
        Object.keys(raw).map((k, i) => raw[i] = raw[k])
        return raw
    }

    window.sum = (ar) => ar.reduce((a, v) => a + v, 0)
    window.product = (ar) => ar.reduce((a, v) => a * v, 1)
    window.bounds = (ar) => (x => {x.push(x[1]-x[0]);return x})([Math.min(...ar), Math.max(...ar)])
    window.bound = (ar, x) => (([min, max]) => Math.max(min, Math.min(x, max)))(bounds(ar))
    window.norm = (ar, x) => (([min, max]) => (bound(ar, x) - min) / (max - min))(bounds(ar))
    window.math = {
        sum, product,
    }

    window.elapsed = (a, b=Date.now()) => {
        ;[a, b] = [a, b].map(Number)
        return b - a
    }
    window.duration = ({ms=0,s=0,m=0,h=0,d=0,w=0,mo=0,y=0,de=0,c=0,mi=0}={}) => Math.ceil((((((mi*1000 + c*100 + de*10 + y) * 365 + (mo) * (365/12) + (w) * 7 + d) * 24 + h) * 60 + m) * 60 + s) * 1_000 + ms)
    window.offset = (d, ms) => new Date(Number(d) + ms)
    window.datetime = {
        elapsed, duration, offset,
        tz: (date=Date.now(), tz=undefined) => {
            if (typeof(date) === 'number') date = new Date(date)
            if (tz === undefined) return date.getTimezoneOffset()
            return new Date(date.getTime() - ((date.getTimezoneOffset() - tz) * 60 * 1000))
        },
        utc: (date=Date.now()) => datetime.tz(date, 0),
        ymd: (date=Date.now()) => {
          if (typeof(date) === 'number') date = new Date(date)

          return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(x => String(x).padStart(2, '0')).join('-')
        },
        yyyymmdd: (...x)=>datetime.ymd(...x),
        hms: (date=Date.now()) => {
            if (typeof(date) === 'number') date = new Date(date)
            return [date.getHours(), date.getMinutes(), date.getSeconds()].map(x => String(x).padStart(2, '0')).join(':')
        },
        ymdhms: (date=Date.now()) => [datetime.ymd(date), datetime.hms(date)].join(' '),
        yyyymmddhhmmss: (...x)=>datetime.ymd(...x),
        new: (yyyymmdd=undefined, hhmmss='12:00:00') => yyyymmdd ? new Date(yyyymmdd + ' ' + hhmmss) : new Date(),
        of: ({ Y=undefined, M=undefined, D=undefined, h=0, m=0, s=0, ms=0 }={}) => {
            const d = new Date(`${datetime.ymd(new Date())} 00:00:00`)
            Y !== undefined && d.setFullYear(Y)
            M !== undefined && d.setMonth(M)
            D !== undefined && d.setDate(D)
            h && d.setHours(h)
            m && d.setMinutes(m)
            s && d.setSeconds(s)
            ms && d.setMilliseconds(ms)
            return d
        },
    }

    window.Q = (l, s) => s ? l.querySelector(s) : document.querySelector(l)
    window.QQ = (l, s) => list(s ? l.querySelectorAll(s) : document.querySelectorAll(l))
    window.on = (l, es, f, o=undefined) => {
        const setEventListener = action => (
            (ls, es) => ls.map(l => es.map(e => l && l[action + 'EventListener'](e, f, o)))
        )(
            [l].flatMap(pass).flatMap(li => typeof(li) === 'string' ? QQ(li) : [li]),
            typeof(es) === 'string' ? es.split(' ') : es
        )
        setEventListener('add')
        return () => setEventListener('remove')
    }
    window.ons = (l, ons) => Object.keys(ons).map(e => on(l, e, ons[e]))
    window.node = (html='<div></div>') => html.trim()[0] === '<' ? (x => {
        x.innerHTML = html
        return x.children[0]
    })(document.createElement('div')) : node(`<${html}></${html}>`)
    window.nodes = (html='<div></div>') => (x => {
        x.innerHTML = html
        return list(x.children)
    })(document.createElement('div'))
    window.span = (content='') => node(`<span>${content}</span>`)
    window.div = (content='') => node(`<div>${content}</div>`)
    window.style = (x, cssText) => Object.assign(x.style, Object.fromEntries(cssText.split(/[;\n]/).filter(x=>x).map(l => l.split(':').map(x=>x.trim()))))

    window.range = (a,o,e=1) => Array.from({ length: Math.floor((o===undefined?a:o-a)/e) }).map((_, i) => i*e + (o===undefined?0:a))
    window.merge = (...os) => {
        const result = {}
        os.map(o => {
            Object.keys(o).map(k => {
                if (o[k] === undefined) delete result[k]
                else result[k] = (typeof(result[k]) === 'object' && typeof(o[k]) === 'object' && !Array.isArray(o[k])) ? merge(result[k], o[k]) : o[k]
            })
        })
        return result
    }
    window.transmute = (o, O, X=undefined) => {
        // recursively transform object with functions
        const resolved = Object.keys(o).map(k =>
            (typeof(o[k]) === 'object' && !Array.isArray(o[k]))
            ? { [k]: transmute(o[k], O) }
            : X
                ? { [k]: X(o[k]) }
                : O(k, o[k]))
        
        return merge(
            {},
            ...resolved
        )
    }
    window.deletion = (o={}) => transmute(o, (k,v)=> v ? { [k]: undefined } : {})
    window.pick = (object, delimited_keys, delimiter=' ') => list(delimited_keys, delimiter).reduce((o, k) => { o[k] = object[k]; return o }, {})
    window.unpick = (object, delimited_keys, delimiter=' ') => list(delimited_keys, delimiter).reduce((o, k) => { delete o[k]; return o }, {...object})
    window.boolean_num = (boolean, number) => !boolean || typeof boolean === 'number' ? boolean : number
    window.alias = (object, { aliases, abbreviated=false, abbreviation_length=2 }) => fs({}).with(x => keys(object).map(k => {
        []
        .concat(
            list(aliases[k] || k),
            abbreviated
            ? [k.slice(0, boolean_num(abbreviated, abbreviation_length))]
            : [])
        .map(alias => x[alias] = object[alias])
    })).x

    {
        let resolve, reject
        window.resolvable = () => Object.assign(new Promise((rs, rj) => [resolve, reject]=[rs, rj]), { resolve, reject })
    }
    window.defer = (f=()=>{}, ms=1) => (x => Object.assign(x, {
        handle: setTimeout(async () => x.resolve(typeof f === 'function' ? f() : f), ms),
        interrupt(reason) {
            clearTimeout(this.handle)
            x.reject(reason)
        },
    }))(resolvable())
    window.sleep = (ms) => defer(false, ms)
    window.loop = (f=()=>{}, ms=1) => (x => Object.assign(x, {
        handle: setInterval(async () => x.resolve(typeof f === 'function' ? f() : f), ms),
        interrupt(reason) {
            clearTimeout(this.handle)
            x.reject(reason)
        },
    }))(resolvable())

    window.string = {
        digits: range(10).join(''),
        lower: range(26).map(i => String.fromCharCode(i + 'a'.charCodeAt(0))).join(''),
        get upper() { return string.lower.toUpperCase() },

        get lowerhex() { return string.digits + string.lower.slice(0, 6) },
        get upperhex() { return string.digits + string.upper.slice(0, 6) },
        get lowernum() { return string.lower + string.digits },
        get uppernum() { return string.upper + string.digits },

        get alpha() { return string.lower },
        get alphanum() { return string.alpha + string.digits },
        get hex() { return string.digits + string.alpha.slice(0, 6) },

        get unambigious() { return '23456789ABCDEFGHJKMNPQRSTUVWXYZ' },
        get somebigious() { return string.digits + 'ABCDEFGHJKMNPQRSTUVWXYZ' },
        unsomebiguate(x) { return x.replace(/o/gi, '0').replace(/[il]/gi, '1') },
        
        get anycase() { return string.lower + string.upper },
        get anycasenum() { return string.anycase + string.digits },
        get base62() { return string.digits + string.anycase },

        prefix(...x) {
            if (x.length === 1) return x[0]
            if (x.length === 2) {
                for (let i = 0;; i++) {
                    if (x[0][i] !== x[1][i]) return x[0].slice(0, i)
                    if (i === x[0].length || i === x[1].length) return x[0]
                }
            }
            return x.reduce((p,x)=>string.prefix(p, x))
        }
    }
    window.compare = {
        stringify: (...xs) => {
            const stringified = xs.map(JSON.stringify)
            return stringified.slice(1).findIndex(x => x !== stringified[0]) === -1
        },
    }
    window.rank = {
        number: (a, b) => { // (...xs)
            return a - b
        },
        length: (a, b) => { // (...xs)
            return a.length - b.length
        },
        f_numfield: (k) => (a, b) => a[k] - b[k],
    }
    window.rand = merge({
        // () => [0,1)
        // (n) => [0,n)
        // (a, b) => [a,b)
        f: (a=1,o,e=1) => (i => i*e + (o===undefined?0:a))(Math.random() * ((o===undefined?a:o-a)/e)),
        s: (a=1,o,e=1) => (i => i*e + (o===undefined?0:a) - ((o===undefined?a:o-a)/e))(Math.random() * 2 * ((o===undefined?a:o-a)/e)),
        i: (a=2,o,e=1) => Math.floor(rand.f(a,o,e)),
        sample: (ar, n=undefined) => n === undefined ? ar[rand.i(ar.length)] : range(n).map(() => rand.sample(ar)),
        pick: (ar, n=undefined) => n === undefined ? ar.splice(rand.i(ar.length), 1)[0] : range(n).map(() => rand.pick(ar)),
        weighted: (o, n=undefined) => {
            const total = math.sum(Object.values(o))
            let picks
            for (let i = 0; i < n||1; i++) {
                let x = rand.f(total)
                // don't do this
                const pick = Object.keys(o).find(k => {
                    x -= o[k]
                    return x <= 0
                })

                // this is only kinda bad
                if (n === undefined) return pick
                picks = picks || []
                picks.push(pick)
            }
            return picks
        },
        shuffle_order: (n) => range(n.length ?? n).sort(() => rand.s()),
        shuffle: (ar) => ar.sort(() => rand.s()),
        shuffle_and_order: (ar) => {
            const order = rand.shuffle_order(ar.length)
            return {
                shuffle: lists.order(ar, order),
                order,
            }
        }
    }, transmute(string, false, x => (n=1) => range(n).map(i => rand.sample(x)).join('')), {
        hex: (n) => Math.floor(Math.random() * Math.pow(16, n)).toString(16).padStart(n, '0'),
    })
    window.base62 = x => {
        x = (typeof x === 'number') ? BigInt(x) : [...new Uint8Array(new TextEncoder().encode(x.toString()))].reverse().reduce(([power, sum],x)=>{
            sum += BigInt(x) * power
            power *= 62n
            return [power, sum]
        }, [1n, 0n])[1]
        for (let s = '';; x = x / 62n) { s = string.base62[x % 62n] + s; if (x < 62n) return s }
    }
    window.sha256 = async (str) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(x => [...new Uint8Array(x)].map(b=>b.toString(16).padStart(2, '0')).join(''))
    window.id = async (str) => location.port ? base62(str.slice(str.length/2) + str.slice(0, str.length/2)) : sha256(str)

    window.auth = { user:false, token:undefined }
    if (!is_server) window.api = (()  => {
        const origin = location.origin
        const api = {
            get:    {},
            post:   { body: true },
            put:    { body: true },
            delete: {},

            catch: ()=>{},
        }
        const _request = (url, req) => 
            fetch(url, req)
            .then(async res => ({
                'application/json': () => res.json().then(data => {
                    if (data.error) { 
                        console.debug('api error', data.error)
                        throw data
                    } else if (res.ok) {
                        console.debug('ok', url, data)
                        const { user, token } = data
                        if (user !== undefined) Object.assign(auth, { user, token })
                        return data
                    } else {
                        data.error = `failed ${service} ${path}: ${data.message}`
                        console.debug('server error', data.error)
                        throw data
                    }
                }),
            }[(res.headers.get('Content-Type') || 'application/json').split(';')[0]] || (()=>res))())
            .catch(e => {
                const error = e.error ?? e.message ?? e
                console.debug('connection error', error)
                
                if (api.catch) api.catch({ error, url })
                else throw { error }
            })
            .finally(_=>console.debug(url, req))
        Object.entries(api).map(([service, { method=service.toUpperCase(), body:has_body=false }]) => api[service] = (url, body={}, options={}) => {
            if (!has_body) options = body
            const controller = new AbortController()
            options.ms && setTimeout(() => controller.abort(), options.ms || 61_000)
            return _request(origin + url.replace(/^\/*/, '/'), {
                method,
                headers: {
                    'Content-Type': has_body ? 'application/json' : undefined,
                    'X-Freshman-Auth-User': auth.user,
                    'X-Freshman-Auth-Token': auth.token,
                },
                signal: controller.signal,
                body: has_body ? JSON.stringify(body) : undefined,
            })
        })
        return api
    })()

    if (!is_server) setTimeout(() => {
        QQ('textarea.resize').map(t => {
            t.resize = () => {
                const _temp = node('<div></div>')
                _temp.style.whiteSpace = t.style.whiteSpace = 'pre-wrap'
                _temp.style.wordBreak = t.style.wordBreak = 'break-word'

                // TODO don't
                t.parentElement.style.width = (t.parentElement.parentElement.getBoundingClientRect().width - (t.parentElement.getBoundingClientRect().x - t.parentElement.parentElement.getBoundingClientRect().x))+'px'
                t.style.width = '-webkit-fill-available'
                const rect = t.getBoundingClientRect()
                const { fontFamily, fontSize, lineHeight, padding, border, boxSizing, wordBreak } = getComputedStyle(t)
                Object.assign(_temp.style, {
                    width: rect.width+'px',
                    fontFamily, fontSize, lineHeight, padding, border, boxSizing, wordBreak
                })
                
                // TODO don't
                _temp.textContent = (t.value || ' ') + '-'.repeat(complete.textContent.length)

                document.body.append(_temp)
                t.style.height = _temp.getBoundingClientRect().height+'px'
                t.parentElement.style.width = rect.width+'px'
                _temp.remove()
            }
            t.resize()
        })
        on('textarea.resize', 'input', e => e.target.resize())
    })

    window.copy = async (text) => navigator.clipboard.writeText(text)
    window.download = async (text, name='download.txt') => {
        const href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
        const element = node(`<a download="${name}" href=${href}></a>`)
        element.click()
        return element
    }
    window.downloadCanvas = async (canvas, download='image.png') => {
        canvas.toBlob(blob => {
            const href = URL.createObjectURL(blob)
            Object.assign(node('<a></a>'), { download, href }).click()
            URL.revokeObjectURL(href)
        }, 'image/png', 1)
    }

    const _displayStatus_active = {}
    window.displayStatus = async (element, status, ms=1_500) => {
        clearTimeout((x => x&&(x[0]()||x[1]))(_displayStatus_active[element]))

        const rect = element.getBoundingClientRect()
        const display = element.insertAdjacentElement('afterend', node(`<${element.tagName} style="
        ${element.style.cssText}
        min-width: ${rect.width}px;
        min-height: ${rect.height}px;
        ">${status}</${element.tagName}>`))
        element.remove()
        const undo = () => {
            display.insertAdjacentElement('beforebegin', element)
            display.remove()
        }
        
        _displayStatus_active[element] = [undo, setTimeout(() => {
            undo()
            delete _displayStatus_active[element]
        }, ms)]
    }

    if (!is_server) window.url = {
        replace: (href) => history.replaceState(null, '', href),
        push: (href) => history.pushState(null, '', href),
        query: (query, opts={remove_false=false}={}) => {
            if (typeof query === 'object') {
                const object = Object.fromEntries(new URLSearchParams(query).entries())
                console.debug(opts, object)
                if (opts.remove_false) Object.keys(object).forEach((k) => (!object[k] || !JSON.parse(object[k])) && (delete object[k]))
                query = new URLSearchParams(object)
            }
            url.replace(location.origin + location.pathname + query.toString().replace(/^\??/, '?').replace(/^\?$/, '') + location.hash)
        },
        search: (...x) => url.query(...x),
        hash: (hash) => url.replace(location.origin + location.pathname + location.search + hash),
    }

    window.tone = (pitch, volume, ms) =>
        fs(
            new OscillatorNode(actx, { frequency: pitch })
        )
        .with(x=>x
            .connect(new GainNode(actx, { gain: volume }))
            .connect(actx.destination)
        )
        .then(x => merge(x, {
            _start: x.start.bind(x),
            start: (...a) => {
                x._start(...a)
                setTimeout(() => x.stop(), ms)
            },
        }))
        .value
    window.qr = (text, size=128) => {
        // TODO QR code implementation
        return `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${text}&choe=UTF-8`
    }
    window.icon = (options={
        color: getComputedStyle(document.documentElement).backgroundColor,
        text: document.title, text_color: getComputedStyle(document.documentElement).color,
        update: false,
    }) => {
        // icon(color) or icon(href) or icon({ color='#000', text, text_color='#fff' }) or icon({ color='#000', x256:(ctx)=>{render} })

        let href
        const DEFAULT_ICON_SIZE = 256
        if (typeof options === 'string') {
            const color = /#.{3,8}/.exec(options)
            if (color) { // color circle
                return icon({ color:false, x256: ctx => {
                    ctx.fillStyle = color
                    ctx.beginPath()
                    ctx.arc(DEFAULT_ICON_SIZE/2, DEFAULT_ICON_SIZE/2, DEFAULT_ICON_SIZE/2 * 11.5/14, 0, Math.PI * 2)
                    ctx.closePath()
                    ctx.fill()
                }})
            } else {
                href = options
                if (!href.includes(':')) href = location.origin + '/' + href.replace(location.origin + '/', '')
            }
        } else {
            if (options.text) options = merge({ text_color: '#fff', [`x${DEFAULT_ICON_SIZE}`]: ctx => {
                ctx.fillStyle = options.text_color || '#fff'
                ctx.textAlign = 'left'
                ctx.textBaseline = 'top'
                ctx.font = '32px monospace'
                ctx.fillText(`${options.text}`, 0, 32, DEFAULT_ICON_SIZE * 7/8)
            } }, options)
            const size = Math.max(...Object.keys(options).map(x => Number(x.slice(1))).filter(truthy))
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = canvas.height = size
            ctx.fillStyle = ctx.strokeStyle = options.color ?? '#000'
            if (ctx.fillStyle) ctx.fillRect(0, 0, size, size)
            options['x'+size](ctx)
            href = canvas.toDataURL()
        }
        
        if (options.update) (Q('head [rel=icon]') || (x => {
            document.head.append(x)
            return x
        })(node(`<link rel=icon />`))).href = href
        return href
    }

    window.components = {
        link_preview: (href) => {
            if (!href) return ''
            const href_display = href.replace(/(https?:\/\/)?(www\.)?/, '')
            const l = node(`<div class="link-preview column">
                <div class="link-preview-preview column wide" style="display:none"></div>
                <a class="link-preview-link" href=${href}>${href_display}</a>
            </div>`)
            const preview = Q(l, '.link-preview-preview')
            api.post('/api/link-preview', { href }).then(({ html })=> {
                if (html) {
                    preview.innerHTML = html
                    preview.style.display = 'unset'
                }
            })
            return l
        },
    }

    // [WIP] (please ignore)
    // const _fetch = window.fetch
    // window.unproto = (url) => {
    //     const proto = new URL(url).protocol
    //     console.debug('unproto', {proto,url})
    //     const special_case = {
    //         // TODO better, bad rate limits
    //         'github-tree:': (proto_url) => {
    //             const url = proto_url.replace('github-tree://', '')
    //             const path = new URL(url).search.slice(1)
    //             const prefix = url.split('/git/')[0]
    //             const tree_url = `${prefix}/git/trees/HEAD?recursive=${path.split('/').length}`
    //             return _fetch(tree_url).then(r => r.json()).then(o => {
    //                 console.debug(o)
    //                 return `${prefix}/HEAD/${item.path}`
    //             }).catch(e => {
    //                 console.error(e)
    //                 return url
    //             })
    //         },
    //     }[proto]
        
    //     return special_case ? special_case(url) : url
    // }
    // window.fetch = (url, ...x) => {
    //     const proto = new URL(url).protocol
    //     const special_case = {
    //         // TODO better, bad rate limits
    //         'github-tree:': (url) => _fetch(url.replace('github-tree://', '')).then(r => r.json()).then(o => {
    //             const { content, encoding } = o
    //             return {
    //                 text: () => content
    //                 // text: () => atob(content),
    //             } // TODO other encodings?
    //         }).catch(e => {
    //             console.error(e)
    //             return {
    //                 text: () => url,
    //             }
    //         }),
    //     }[proto]

    //     console.debug('fetch', {url, special_case})
    //     return special_case ? special_case(url, ...x) : _fetch(url, ...x)
    // }

    // defer(() => [...document.querySelectorAll('[href]')].map(L=>L.href.startsWith(origin)&&(L.href=L.href.replace(/:\d+/,':5050'))))

    window.html = document.documentElement
    window.head = document.head
    defer(() => window.body = document.body)
    
    if (!is_server) html.classList.add(...list('is_mobile is_watch is_non_watch_mobile is_desktop').filter(flag => devices[flag]).map(flag => flag.replace(/^is_/, '')))
}
