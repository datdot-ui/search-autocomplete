const bel = require('bel')
const csjs = require('csjs-inject')
const path = require('path')
const filename = path.basename(__filename)
const button = require('datdot-ui-button')
const svg = require('datdot-ui-graphic')
const searchResult = require('search-result')

module.exports = autocomplete

function autocomplete ({page, flow, name, data}, protocol) {
    const widget = 'ui-autocomplete'
    let recipients = []
    let val
    const send2Parent = protocol( receive )
    const iconClear = svg({css: `${css.icon} ${css['icon-clear']}`, path: 'assets/cancel.svg'})
    const iconOption = svg({css: `${css.icon} ${css['icon-option']}`, path: 'assets/option.svg'})
    const clear = button({page, name: 'clear', content: iconClear, style: ['circle-solid', 'small'], color: 'light-grey', custom: [css.clear]}, clearProtocol('clear'))
    const input = bel`<input type="text" class=${css['search-input']} name=${name} role="search input" aria-label="search input" tabindex=0>`
    const controlForm = bel`<div class=${css['control-form']}>${input}</div>`
    const list = searchResult({page, name: 'swarm', data}, searchResultProtocol('swarm-key-result'))
    const search = bel`<div role="search" class=${css.search} aria-label="search">${controlForm}${list}</div>`
    // option dropdown
    const option = button({page, name: 'option', content: iconOption, style: 'default', color: 'fill-grey', custom: [css.option]}, optionProtocol('option'))
    const action = bel`<aside class=${css.action}>${option}</aside>`
    list.append(action)

    send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'init', filename, line: 28})
    
    // search.onclick = handleClick
    input.onfocus = handleFocus
    input.onblur = handleBlur
    input.onchange = handleChange
    input.onkeyup = handleKey

    return search

    function publish (string) {
        list.classList.add(css.hide)
        return send2Parent({page, from: `${widget}/search filter`, type: 'publish data', body: string, filename, line: 40 })
    }

    function searchFilter (string) {
        // filter characters are matched with swarm key
        let searchString = string.toLowerCase()
        data.then( args => { 
            let arr = args.filter( item => {
                let swarm = item.swarm.toLowerCase()
                let address = `${item.type}://`
                return address.includes(searchString) || swarm.includes(searchString) || address.includes(searchString.split("://")[0]) && swarm.includes( searchString.split('://')[1] )
            })
            if ( arr.length === 0 ) return publish(string)
            list.classList.remove(css.hide)
            return recipients['swarm-key-result']({page, from: 'search filter', type: 'filter', body: {data: arr, keyword: searchString.includes('://') ? searchString.split('://')[1] : searchString}})
        })
    }

    function statusElementRemove () {
        const statusElement = controlForm.querySelector(`.${css.status}`)
        if (statusElement) {
            statusElement.remove()
            controlForm.classList.remove(css.selected)
            search.append(list)
        }
    }

    function selectSwarmAction (obj) {
        const { swarm, isValid } = obj
        const type = obj.type === 'hypercore' ? 'core' : obj.type === 'hyperdrive' ? 'drive' : 'cabal'
        const span = bel`<span class="${css.status}${isValid ? ` ${css.isValid}` : '' }">`
        const statusElement = controlForm.querySelector(`.${css.status}`)
        input.value = `${type}://${swarm}`
        if ( statusElement ) statusElement.remove()
        controlForm.classList.add(css.selected)
        controlForm.insertBefore(span, input)
        controlForm.append(clear)
        list.classList.add(css.hide)
        send2Parent({page, from: 'feeds list', flow: flow ? `${flow}/${widget}` : widget, type: 'selected', body: obj, filename, line: 77})
    }

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
                if (type === 'click') handleOption(name)
            }
        }
    }

    function handleOption (name) {
        send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'click', filename, line: 103})
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

    function handleClearSearch (name) {
        val = ''
        input.value = val
        clear.classList.toggle(css.hide)
        list.classList.remove(css.hide)
        setTimeout(()=> {
            clear.classList.toggle(css.hide)
            clear.remove()
        }, 300)
        statusElementRemove()
        send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'clear search', body: val, filename, line: 126})
        recipients['swarm-key-result']({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'clear', body: data})
    }

    // function handleClick (event) {
    //     const target = event.target
    //     if ( target.tagName === 'INPUT' ) send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}`: widget, body: target.value, type: 'click', filename, line: 132})
    //     // if ( target.tagName === 'BUTTON') handleClearSearch(event)
    // }

    function handleKey (event) {
        const target = event.target
        val = target.value
        if ( !controlForm.querySelector(`.${css.clear}`) ) controlForm.append(clear)
        if (val === '' ) {
            controlForm.removeChild(clear)
            statusElementRemove()
        }
        searchFilter(val)
        recipients['swarm-key-result']({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'keyup', body: target.value})
        send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'keyup', body: val, filename, line: 146})
    }

    function handleBlur (event) {
        const target = event.target
        send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'blur', body: target.value, filename, line: 151})
    }

    function handleFocus (event) {
        const target = event.target
        send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'focus', body: target.value, filename, line: 156})
    }

    function handleChange (event) {
        const target = event.target
        val = target.value
        send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'change', body: target.value, filename, line: 162})
    }

    function receive (message) {
        const {page, from, type, action, body} = message
        // console.log(`${page} => ${widget} ${type}`);
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
}
.clear {
    transform: scale(0.6);
    animation: showup .25s linear forwards;
}
.hide {
    animation: disppear .25s linear forwards;
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
.option {
    transition: background-color 0.4s ease-in-out;
    padding: 7px 10px;
}
.option:hover {
    background-color: #000;
}
.icon-option {
    width: 24px;
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