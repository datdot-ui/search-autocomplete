const bel = require('bel')
const csjs = require('csjs-inject')
const path = require('path')
const filename = path.basename(__filename)
const autocomplete = require('..')

function demoComponent () {
    let count = 1
    let number = 0
    let recipients = []
    let result = fetchData('./src/data.json')
    // logs
    const terminal = bel`<div class=${css.terminal}></div>`
    const searchBox = autocomplete({page: 'PLANS', name: 'swarm key', data: result }, protocol('swarmkey'))
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
        // console.log(`DEMO <= ${page}/${from} ${type}` );
        // if ( type === 'click') console.log(from, message);
        if ( type === 'clear-search') console.log( message );
        domlog(message)
    }

    function domlog (message) {
        const { page, from, flow, type, body, action, filename, line } = message
        const log = bel`
        <div class=${css.log} role="log">
            <div class=${css.badge}>${count}</div>
            <div class="${css.output} ${type === 'error' ? css.error : '' }">
                <span class=${css.page}>${page}</span> 
                <span class=${css.flow}>${flow}</span>
                <span class=${css.from}>${from}</span>
                <span class=${css.type}>${type}</span>
                <span class=${css.info}>${typeof body === 'string' ? body : JSON.stringify(body, ["swarm", "feeds", "links"], 3)}</span>
            </div>
            <div class=${css['code-line']}>${filename}:${line}</div>
        </div>`
        // console.log( message )
        terminal.append(log)
        terminal.scrollTop = terminal.scrollHeight
        count++
    }

    async function fetchData (path) {
        const response = await fetch(path)
        try {
            if ( response.ok ) return response.json().then(data => data)
            if ( response.status === 404 ) 
                domlog({page: 'demo', from: 'data', flow: 'getData', type: 'error', body: `GET ${response.url} 404 (not found)`, filename, line: 54})
                throw new Error(`Failed load file from ${response.url}`)
        } catch (e) {
            console.log(e.message)
        }
       
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
.log:last-child, .log:last-child .page, .log:last-child .flow, .log:last-child .type {
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
.error {
    color: #FF3F3F;
}
.page {
    display: inline-block;
    color: rgba(255,255,255,.75);
    background-color: #2A2E30;
    padding: 4px 6px;
    border-radius: 4px;
}
.flow {
    color: #1DA5FF;
}
.from {
    color: #fff;
}
.type {
    color: #FFB14A;
}
.info {}
`

document.body.append( demoComponent() )