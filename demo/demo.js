const bel = require('bel')
const csjs = require('csjs-inject')
const path = require('path')
const filename = path.basename(__filename)
const autocomplete = require('..')

function demoComponent () {
    let count = 1
    let number = 0
    let recipients = []
    // logs
    const terminal = bel`<div class=${css.terminal}></div>`
    const searchBox = autocomplete({page: 'PLANS', name: 'swarm key'}, protocol('swarmkey'))
    const element = bel`
    <div class=${css.wrap}>
        <div class=${css.container}>${searchBox}</div>
        ${terminal}
    </div>`
    return element

    function protocol (name) {
        return send => {
            send({page: 'PLANS', from: 'demo page', type: 'ready'})
            return receive
        }
    }

    function receive (message) {
        const { page, from, flow, type, action, body, filename, line } = message
        if ( type === 'click') console.log(from, message);
        domlog(message)
    }

    function domlog (message) {
        const { page, from, flow, type, body, action, filename, line } = message
        const log = bel`
        <div class=${css.log} role="log">
            <div class=${css.badge}>${count}</div>
            <div class=${css.output}>${page}/${flow}: ${from} ${type} ${body}</div>
            <div class=${css['code-line']}>${filename}:${line}</div>
        </div>`
        // console.log( message )
        terminal.append(log)
        terminal.scrollTop = terminal.scrollHeight
        count++
    }
}

const css = csjs`
body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    background-color: rgba(0, 0, 0, .1);
    height: 100%;
}
.wrap {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 75vh 25vh;
}
.container {
    width: 500px;
    margin: 20px auto 0 auto;
}
.terminal {
    background-color: #212121;
    color: #f2f2f2;
    font-size: 13px;
    overflow-y: auto;
}
.log:last-child {
    color: #FFF500;
    font-weight: bold;
}
.log {
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    padding: 2px 12px 0 0;
    border-bottom: 1px solid #333;
}
.output {

}
.badge {
    background-color: #333;
    padding: 6px;
    margin-right: 10px;
    font-size: 14px;
    display: inline-block;
}
.code-line {}
`

document.body.append( demoComponent() )