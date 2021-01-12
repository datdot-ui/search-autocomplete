const bel = require('bel')
const csjs = require('csjs-inject')
const path = require('path')
const filename = path.basename(__filename)
const autocomplete = require('..')
const domlog = require('ui-domlog')

function demoComponent () {
    let recipients = []
    let result = fetchData('./src/data.json')
    // show logs
    const terminal = bel`<div class=${css.terminal}></div>`
    const searchBox = autocomplete({page: 'PLANS', flow: 'search', name: 'swarm key', data: result }, protocol('swarmkey'))
    // container
    const container = wrap(searchBox, terminal)
    return container

    function wrap (content, terminal) {
        const container = bel`
        <div class=${css.wrap}>
            <section class=${css.container}>
                ${content}
            </section>
            ${terminal}
        </div>
        `
        return container
    }

    function renderPublish (message) {
        showLog({...message, filename, line: 31})
    }

    function protocol (name) {
        return send => {
            recipients[name] = send
            return receive
        }
    }

    function receive (message) {
        const { page, from, flow, type, action, body } = message
        // console.log(`DEMO <= ${page}/${from} ${type}` );
        showLog(message)
        if (type === 'init') return showLog({page, from, flow, type: 'ready', body, filename, line: 45})
        if (type === 'clear search') return 
        if (type === 'publish') return renderPublish(message)
    }

    // keep the scroll on bottom when the log displayed on the terminal
    function showLog (message) { 
        sendMessage(message)
        .then( log => {
            terminal.append(log)
            terminal.scrollTop = terminal.scrollHeight
        }
    )}

    async function fetchData (path) {
        const response = await fetch(path)  
        if ( response.ok ) return response.json().then(data => data)
        if ( response.status === 404 ) {
            sendMessage({page: 'demo', from: 'data', flow: 'getData', type: 'error', body: `GET ${response.url} 404 (not found)`, filename, line: 63})
            .then( log => terminal.append(log) )
            // throw new Error(`Failed load file from ${response.url}`)
        }
    }

    async function sendMessage (message) {
        return await new Promise( (resolve, reject) => {
            if (message === undefined) reject('no message import')
            const log = domlog(message)
            return resolve(log)
        }).catch( err => { 
            throw new Error(err.message) 
        })
    }
}

const css = csjs`
html {
    font-size: 62.5%;
    box-sizing: border-box;
    height: 100%;
}
*, *::before, *::after {
    box-sizing: inherit;
}
body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 100%;
    background-color: rgba(0, 0, 0, .1);
    height: 100%;
}
.wrap {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 75% 25%;
    height: 100%;
}
.container {
    width: 80%;
    max-width: 98%;
    margin: 20px auto 0 auto;
}
.terminal {
    background-color: #212121;
    color: #f2f2f2;
    font-size: 13px;
    overflow-y: auto;
}
`

document.body.append( demoComponent() )