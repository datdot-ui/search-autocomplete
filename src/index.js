const bel = require('bel')
const csjs = require('csjs-inject')
const path = require('path')
const filename = path.basename(__filename)
const button = require('datdot-ui-button')
const svg = require('datdot-ui-graphic')
const searchResult = require('search-result')
const filterOption = require('datdot-ui-filter-option')

module.exports = autocomplete

function autocomplete ({page, flow, name, data}, protocol) {
    // * navigator.platform display: iPad, iPhone, MacIntel ...etc
    // alert(navigator.platform) it is only work for real platform, simulator is only displaying current OS name
    // * navigator.userAgent display: iPhone, iPad, iPod ...etc
    const device =  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'laptop/desktop'
    const search = bel`<div role="search" class=${css.search} aria-label="search"></div>`
    data.then( args => {
        let arr = []
        arr = [...args]
        return elements(arr)
    })

    return search
    
    function elements (data) {
        const widget = 'ui-autocomplete'
        const send2Parent = protocol( receive )
        let recipients = []
        let optionList = [
            {id: 1, status: "Available", active: true}, 
            {id: 2, status: "Not available", active: true}, 
            {id: 3, status: "Hypercore", active: true},
            {id: 4, status: "Hyperdrive", active: true},
            {id: 5, status: "Cabal", active: true}
        ]
        let val, selectSwarm
        let feeds = data
        const iconClear = svg({css: `${css.icon} ${css['icon-clear']}`, path: 'assets/cancel.svg'})
        const clear = button({page, name: 'clear', content: iconClear, style: ['circle-solid', 'small'], color: 'light-grey', custom: [css.clear]}, clearProtocol('clear'))
        const input = bel`<input type="text" class=${css['search-input']} name=${name} role="search input" aria-label="search input" tabindex=0>`
        const controlForm = bel`<div class=${css['control-form']}>${input}</div>`
        const list = searchResult({page, name: 'swarm', data: feeds}, searchResultProtocol('swarm-key-result'))
        // option dropdown
        const option = filterOption({page, flow, name: 'filter-option', data: optionList}, optionProtocol('filter-option'))
        const action = bel`<aside class=${css.action}>${option}</aside>`

        list.append(action)
        send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'init', filename, line: 49 })
        
        input.onfocus = handleFocus
        input.onblur = handleBlur
        input.onchange = handleChange
        input.onkeyup = handleKey

        return search.append(controlForm, list) 
    
        /*************************
        * ------- Actions --------
        *************************/
        function removeError(element) {
            return element.classList.remove(css.error)
        }

        function inValiadUrl (string) {
            controlForm.classList.add(css.error)
            return send2Parent({page, from: 'search filter', flow: flow ? `${flow}/${widget}` : widget, type: 'error', body: `${string} is a unvalidated URL of swarm key`})
        }

        function isValidUrl (string) {
            const type = string.split('://')[0]
            const reg = /core|drive|cabal/g
            if (type.match(reg)) return true
            return false
        }

        function publish (string) {
            let type = string
            if (string.includes('://')) type = isValidUrl(string)
            if (type) { 
                removeError(controlForm)
            } else { 
                inValiadUrl(string)
            }
            list.classList.add(css.hide)
            recipients['swarm-key-result']({page, from: 'search filter', flow: widget, type: 'publish', body: string })
            return send2Parent({page, from: 'search filter', flow: widget, type: 'publish', body: string, filename, line: 87 })
        }

        function searchFilter (string) {
            optionList.forEach( item => {
                if (item.active) return filterFeeds(feeds, string)
            })
        }

        function filterFeeds(args, string) {
            // filter characters are matched with swarm key
            let searchString = string.toLowerCase()
            let arr = args.filter( item => {
                let swarm = item.swarm.toLowerCase()
                let address = `${item.type}://`
                return address.includes(searchString) || swarm.includes(searchString) || address.includes(searchString.split("://")[0]) && swarm.includes( searchString.split('://')[1] )
            })
            // if not found any match adress, then do publish new swarm, and remove status
            if ( arr.length === 0 ) {
                const statusElement = controlForm.querySelector(`.${css.status}`)
                if (statusElement) { 
                    statusElement.classList.add(css.hide)
                    setTimeout( ()=> { 
                        statusElement.remove()
                        controlForm.classList.remove(css.selected)
                    }, 100)
                }
                controlForm.classList.add(css.publish)
                return publish(string)
            }
            list.classList.remove(css.hide)
            return recipients['swarm-key-result']({page, from: 'search filter', type: 'filter', body: {data: arr, keyword: searchString.includes('://') ? searchString.split('://')[1] : searchString}})
        }

        function statusElementRemove () {
            const statusElement = controlForm.querySelector(`.${css.status}`)
            if (statusElement) {
                statusElement.remove()
                controlForm.classList.remove(css.selected)
                search.append(list)
            }
        }

        // select swarm
        function selectSwarmAction (obj) {
            const { swarm, isValid } = obj
            const type = obj.type === 'hypercore' ? 'core' : obj.type === 'hyperdrive' ? 'drive' : 'cabal'
            const span = bel`<span class="${css.status}${isValid ? ` ${css.isValid}` : '' }">`
            const statusElement = controlForm.querySelector(`.${css.status}`)
            input.value = `${type}://${swarm}`
            selectSwarm = input.value
            if ( statusElement ) statusElement.remove()
            if (controlForm.children[2] === undefined) controlForm.append(clear)
            if (clear.classList.contains(css.hide)) clear.classList.remove(css.hide)
            list.classList.add(css.hide)
            controlForm.classList.add(css.selected)
            controlForm.insertBefore(span, input)
            recipients['swarm-key-result']({page, from: 'feeds list', type: 'selected', body:obj})
            return send2Parent({page, from: 'feeds list', flow: flow ? `${flow}/${widget}` : widget, type: 'selected', body: obj, filename, line: 145 })
        }

        function online(args) {
            return args.filter(obj => obj.feeds.find( feed => feed.match(/https/ig) ) )
        }

        function offline(args) {
            return args.filter(obj => !obj.feeds.find( feed => feed.match(/https/ig) ) )
        }

        function actionToggleCheck (message) {
            const { from, body } = message
            let on, off
            let result = []
            let options = optionList.map( item => { 
                                        // * better to use return item for add more conditions
                                        if (item.id === body ) item.active = !item.active
                                        if (/^Available/.test(item.status) && item.active ) on = online(data)
                                        if (/^Not available/.test(item.status) && item.active ) off = offline(data)
                                        return item
                                    }).map( item => {
                                        if (/core/i.test(item.status) && item.active) {
                                            let arr = data.filter( obj => /core/i.test(obj.type))
                                            console.log('core', arr);
                                            return result.push(...arr)
                                        }
                                        if (/drive/i.test(item.status) && item.active) {
                                            let arr = data.filter( obj => /drive/i.test(obj.type)) 
                                            console.log('drive', arr )
                                            return result.push(...arr)
                                        }
                                        if (/cabal/i.test(item.status) && item.active) {
                                            let arr = data.filter( obj => /cabal/i.test(obj.type))
                                            console.log('cabal', arr )
                                            return result.push(...arr)
                                        }
                                        return item
                                    })

            result.sort( (a, b) => a.id - b.id)

            if (on === undefined && off === undefined) return filterResult(undefined)
            if (on !== undefined && off !== undefined) { 
                if (result !== undefined) return filterResult(result)
                return filterResult(data)
            }
            if (on !== undefined && off === undefined) { 
                if (result !== undefined) on = online(result)
                return filterResult(on)
            }
            if (on === undefined && off !== undefined) {
                if (result !== undefined) off = offline(result)
                return filterResult(off)
            }
            send2Parent({...message, filename, line: 199})
        }

        function filterResult(result) {
            feeds = result
            recipients['swarm-key-result']({page, from: 'filter-option', flow, type: 'filter', body: {data: feeds}})
            return send2Parent({page, from: 'filter-option', flow, type: 'filter', body: feeds ? `${feeds.length} feeds` : `feeds not found`, filename, line: 206 })
        }

        function activeOption (message) {
            const { page, from, flow } = message
            let state = recipients[from].state
            if (state === undefined) recipients[from].state = 'self-active'
            if (state === 'self-active') recipients[from].state = 'remove-active'
            if (state === 'remove-active') recipients[from].state = 'self-active'
            recipients[from]({page, from, flow, type: recipients[from].state, filename, line: 215 })
        }

        function handleClearSearch (name) {
            val = ''
            input.value = val
            clear.classList.toggle(css.hide)
            optionList.forEach( item => {
                if (item.status === 'Available' && item.active === false && item.status === 'Not available' && item.active === false) return
            })
            list.classList.remove(css.hide)
            setTimeout(()=> {
                clear.classList.add(css.hide)
                // clear.remove()
            }, 300)
            statusElementRemove()
            removeError(controlForm)
            send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'clear search', body: val, filename, line: 232 })
            recipients['swarm-key-result']({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'clear', body: feeds})
        }

        function handleKey (event) {
            const target = event.target
            val = target.value
            if (selectSwarm.includes(val) && target.value.length < selectSwarm.length ) statusElementRemove()
            if (!controlForm.querySelector(`.${css.clear}`)) controlForm.append(clear)
            if (clear.classList.contains(css.hide)) clear.classList.remove(css.hide)
            if (val === '' ) {
                controlForm.removeChild(clear)
                removeError(controlForm)
                statusElementRemove()
            }
            searchFilter(val)
            recipients['swarm-key-result']({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'keyup', body: target.value })
            return send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'keyup', body: val, filename, line: 249 })
        }

        function handleBlur (event) {
            const target = event.target
            return send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'blur', body: target.value, filename, line: 254 })
        }

        function handleFocus (event) {
            const target = event.target
            return send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'focus', body: target.value, filename, line: 259 })
        }

        function handleChange (event) {
            const target = event.target
            val = target.value
            return send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'change', body: target.value, filename, line: 265 })
        }

        /*************************
        * ------- Protocol --------
        *************************/
        function searchResultProtocol (name) {
            return send => {
                recipients[name] = send
                return function receiveSearchResult (message) {
                    const { page, from, flow, type, body } = message
                    if (type === 'click') selectSwarmAction(body)
                }
            }
        }

        function optionProtocol (name) {
            return send => {
                recipients[name] = send
                return function receiveOption (message) {
                    const { page, from, flow, type, action, body, filename, line } = message
                    // received message from clear button
                    send2Parent(message)
                    if (type === 'click') {
                        if (from === 'filter-option') return activeOption(message)
                    }
                    // close dropdown menu of filter-option  when document.body clicked
                    if (type === 'remove-active') return recipients[from].state = type
                    if (type === 'unchecked') return actionToggleCheck(message)
                    if (type === 'checked') return actionToggleCheck(message)
                }
            }
        }

        function clearProtocol (name) {
            return send => {
                recipients[name] = send
                return function receiveClear (message) {
                    const { page, from, flow, type, action, body, filename, line } = message
                    // received message from clear button
                    if (type === 'click') handleClearSearch(name)
                }
            }
        }

        function receive (message) {
            const {page, from, type, action, body} = message
            // console.log(`${page} => ${widget} ${type}`);
        }
    }
}


const css = csjs`
.search {
    position: relative;
}
.control-form {
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: 1fr 30px;
    background-color: #fff;
    border-radius: 8px;
    align-items: center;
    padding-left: 10px;
    transition: color 0.15s, background-color 0.15s linear;
}
.selected {
    grid-template-columns: 20px 1fr 30px;
}
.search-input {
    width: 100%;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 14px 0;
    background-color: transparent;
}
.clear {
    transform: scale(0.6);
    animation: showup .15s linear forwards;
}
.hide {
    pointer-events: none;
    animation: disppear .15s linear forwards;
}
.icon {}
.icon-clear {
    pointer-events: none;
}
.status {
    display: inline-block;
    width: 12px;
    height: 12px;
    background-color: #D9D9D9;
    border-radius: 50px;
}
.isValid {
    background-color: #109B36;
}
.action {
    position: absolute;
    right: 5px;
    top: 5px;
}
.icon-option {
    width: 24px;
}
.hide {
    animation: disppear .5s linear forwards;
}
.publish {}
.error {
    background-color: #FFEAE8;
}

@keyframes disppear {
    0% {
        opacity: 1;
        top: 53px;
    }
    100% {
        opacity: 0;
        top: 45px;
    }
}
@keyframes showup {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}
@keyframes disppear {
    0% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}
`