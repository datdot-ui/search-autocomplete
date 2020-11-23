const bel = require('bel')
const csjs = require('csjs-inject')
const path = require('path')
const filename = path.basename(__filename)
const button = require('datdot-ui-button')
const svg = require('datdot-ui-graphic')

module.exports = autocomplete

function autocomplete ({page, name}, protocol) {
    const widget = 'ui-autocomplete'
    let receipients = []
    let val
    const send2Parent = protocol( receive )
    const iconClear = svg({css: `${css.icon} ${css['icon-clear']}`, path: 'assets/cancel.svg'})
    const clear = button({page, name: 'clear', content: iconClear, style: ['circle-solid', 'small'], color: 'light-grey', custom: [css.clear]}, clearProtocol('clear'))
    send2Parent({page, from: name, flow: widget, type: 'init', filename, line: 11})

    const input = bel`<input type="text" class=${css['search-input']} name=${name} role="search input" aria-label="search input" tabindex=0>`
    const controlForm = bel`<div class=${css['control-form']}>${input}</div>`
    const search = bel`<div class=${css.search} onclick=${handleClick}>${controlForm}</div>`

    search.onclick = handleClick
    input.onfocus = handleFocus
    input.onblur = handleBlur
    input.onchange = handleChange
    input.onkeypress = handleKey
    input.onkeyup = handleKey

    return search

    function clearProtocol (name) {
        return send => {
            receipients[name] = send
            return function clearReceive (message) {
                const { page, from, flow, type, action, body, filename, line } = message
            }
        }
    }

    function handleClearInput (event) {
        const target = event.target
        val = ''
        input.value = val
        target.classList.toggle(css.hide)
        setTimeout(()=> {
            event.target.remove()
            target.classList.toggle(css.hide)
        }, 300)
        
    }


    function handleClick (event) {
        const target = event.target
        if ( target.tagName === 'INPUT' ) send2Parent({page, from: target.name, flow: widget, body: target.value, type: 'click', filename, line: 39})
        if ( target.tagName === 'BUTTON') handleClearInput(event)
    }

    function handleKey (event) {
        const target = event.target
        val = target.value
        if ( !controlForm.querySelector(`.${css.clear}`) ) { 
            controlForm.append(clear)
        }
        if (val === '' ) controlForm.removeChild(clear)
    }

    function handleBlur (event) {
        const target = event.target
        send2Parent({page, from: target.name, flow: widget, type: 'blur', body: target.value, filename, line: 44})
    }

    function handleFocus (event) {
        const target = event.target
        send2Parent({page, from: target.name, flow: widget, type: 'focus', body: target.value, filename, line: 49})
    }

    function handleChange (event) {
        const target = event.target
        send2Parent({page, from: target.name, flow: widget, type: 'change', body: target.value, filename, line: 54})
    }

    function receive (message) {
        const {page, from, type, action, body} = message
    }
}

const css = csjs`
.search {}
.control-form {
    display: grid;
    grid-template: auto / 1fr 30px;
    background-color: #fff;
    border-radius: 8px;
    align-items: center;
    padding-left: 10px;
}
.search-input {
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