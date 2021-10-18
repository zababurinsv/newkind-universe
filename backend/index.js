import express from 'express'
import cors from 'cors'
import path from 'path'
let __dirname = path.dirname(process.argv[1]);
const app = express()
app.use(cors());
app.use(express.json())
let connect = {
  initiator: (element) => ['QmcrQZ6RJdpYuGvZqD5QEHAv6qX4BrQLJLQPQUrTrzdcgm'].some((item) => element.indexOf(item) !== -1),
  dialer: (element) => ['Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP'].some((item) => element.indexOf(item) !== -1),
  broadcast: {
    initiator: [],
    dialer: []
  },
  message: {
    offer: {},
    answer: {}
  },
  options: {
    max: {
      initiator: 1,
      dialer: 1
    }
  },
  mode: {
    init: {
      static: true,
      public: false
    }
  },
  isInitiator: false,
  isDialer: false,
  isRole: false
};

let whitelist = [
  'https://zababurinsv.github.io',
  'https://web3.news',
  'http://localhost:5968',
  'http://localhost:6897',
  'https://gateway.pinata.cloud/ipfs/QmVHMv3QjdFFjK17GMkXg1F258qBC1hSqtRv3Y1iW1LF63',
  'https://gateway.pinata.cloud/ipfs/QmUb2DoYdBAeTA71q6eaq7yYb5xFQfwmX58pomJvWH9tcL'
]

let corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.get('/favicon.ico', async (req, res) => {
  res.sendFile('/favicon.ico', { root: __dirname });
})

async function sendEventsToInitiator(message, recipient) {
  connect.broadcast.initiator[`${recipient}`].res.write(`data: ${JSON.stringify({
    pathname: "",
    clientID: "",
    message: message,
    _scriptDir: import.meta.url,
    success: true,
    status:'post: incoming message answer'
  })}\n\n`)
}

async function sendEventsToDialer(message, recipient) {
  connect.broadcast.dialer[`${recipient}`].res.write(`data: ${JSON.stringify({
    pathname: "",
    clientID: "",
    message: message,
    _scriptDir: import.meta.url,
    success: true,
    status:'post: incoming message offer'
  })}\n\n`)
}

app.options('/:id', cors(corsOptions))
app.get('/:id', eventsHandler);

async function verifyInitiator(req, res, id) {
  console.log(`i have dialer but i don't have answer message`)
  await initiatorRequest(req, res, id)
}

async function verifyDialer(req, res, id) {
  console.log(`i have initiator but i don't have offer message`)
  await dialerRequest(req, res, id)
}

async function initiator(req, res, id, recipient) {
  if(connect.message.answer[`${id}`] === undefined) {
    (connect.broadcast.dialer[`${id}`] === undefined)
      ? (await terminateInitiator(req), await initiatorRequest(req, res, id))
      : (await terminateInitiator(req), await verifyInitiator(req, res, id))
  } else {
    console.log('ddddddd')
  }
  console.log('initiator',connect)
  return false
}

async function dialer(req, res, id, recipient) {
  if(connect.message.offer[`${recipient}`] === undefined) {
    (connect.broadcast.initiator[`${id}`] === undefined)
      ? (
          await terminateDialer(req),
          await dialerRequest(req, res, id)
        )
      : (
          await terminateDialer(req),
          await verifyDialer(req, res, id)
        )
  } else {
    await terminateDialer(req)
    await dialerSendMessage(req, res, id, connect.message.offer[`${recipient}`].message)
  }
  return false
}

async function dialerRequest(req, res, id) {
  await saveDialer(res, id)
  const data = `data: ${JSON.stringify({
    pathname: req.pathname,
    clientID: "",
    message: 'offer message is undefined',
    _scriptDir: import.meta.url,
    success: true,
    status:'peer save connect'
  })}\n\n`;
  res.write(data);
  return true
}

async function dialerSendMessage(req, res, id, message) {
  await saveDialer(res, id)
  const data = `data: ${JSON.stringify({
    pathname: req.pathname,
    clientID: "",
    message: message,
    _scriptDir: import.meta.url,
    success: true,
    status:'post: incoming message offer'
  })}\n\n`;
  res.write(data);
  return true
}


async function initiatorRequest(req, res, id) {
  await saveInitiator(res, id)
  const data = `data: ${JSON.stringify({
    pathname: req.pathname,
    clientID: "",
    message: 'answer message is undefined',
    _scriptDir: import.meta.url,
    success: true,
    status:'peer save connect'
  })}\n\n`;
  res.write(data);
  return true
}

async function saveDialer(res, id) {
  let newClient = {
    id: id,
    res: res
  };
  connect.broadcast.dialer[`${id}`] = {}
  connect.broadcast.dialer[`${id}`] = newClient
  console.log(`save connect`, connect)
  return true
}

async function saveInitiator(res, id) {
  let newClient = {
    id: id,
    res: res
  };
  connect.broadcast.initiator[`${id}`] = {}
  connect.broadcast.initiator[`${id}`] = newClient
  console.log(`save connect`, connect)
  return true
}

async function terminateDialer(req) {
  req.on('close', () => {
    delete connect.broadcast.dialer[`${req.params.id}`]
    delete connect.message.answer[`${req.params.id}`]
    connect.broadcast.dialer = connect.broadcast.dialer.filter((client) => {
      console.log('~~~ client ~~~', client)
    });
    console.log('terminate dialer',connect.broadcast)
  })
}

async function terminateInitiator(req) {
  req.on('close', () => {
    delete connect.broadcast.initiator[`${req.params.id}`]
    delete connect.message.offer[`${req.params.id}`]
    console.log('terminate initiator',connect.broadcast)
  })
}

async function eventsHandler(req, res, next) {
  let origin = req.get('origin')
  console.log('1 - eventSource connect')
  console.log('origin', origin, req.query.recipient, req.query.initiator)
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': (whitelist.some(item => item === origin )) ? origin : "xxx"
  };
  res.writeHead(200, headers);
  if(connect.mode.init.static) {
    connect.isInitiator = connect.initiator(req.params.id)
    connect.isDialer = connect.dialer(req.params.id)
    console.log(connect.isInitiator, 'i --- d ', connect.isDialer);
    (connect.isInitiator)
        ? await initiator(req, res, req.params.id, req.query.recipient)
        : (connect.isDialer )
            ? await dialer(req, res,req.params.id, req.query.recipient)
            : console.log(`undefined connection`, req.params)
  } else {
    if(!connect.mode.init.public) {
      connect.isRole = (req.query.initiator)
        ? (connect.initiator(req.params.id))
          ? (initiator(req, res, req.params.id, req.query.recipient)
            .then(state => {
              console.log('initiator state', state)
            }), true )
          : false
        : (connect.dialer(req.params.id))
          ? (dialer(req, res,req.params.id, req.query.recipient)
            .then(state => {
              console.log('dialer state', state)
            }), true )
          : false
      console.log('connect.isRole', connect.isRole)
    } else {
      console.log('публиный вариант может быть и тем и другим без списка')
    }
  }
}

app.options('/*', cors(corsOptions))
app.get('/*',function(req, res) {
  res.send({status:"true"})
})

app.options('/initiator', cors(corsOptions))
app.post('/initiator',async function(req, res) {
  console.log('get offer message dialer is', req.body)
  if(connect.broadcast.dialer[`${req.body.recipient}`] === undefined) {
    connect.message.offer[`${req.body.id}`] = req.body
    res.send({
      pathname: "",
      clientID: "",
      message: "",
      _scriptDir: import.meta.url,
      success: true,
      status:'await answer message from recipient'
    })
  } else {
    await sendEventsToDialer(req.body.message, req.body.recipient)
    res.send({
      pathname: "",
      clientID: "",
      message: "",
      _scriptDir: import.meta.url,
      success: true,
      status:'post: send offer message to recipient'
    })
  }
})

app.options('/dialer', cors(corsOptions))
app.post('/dialer',async function(req, res) {
  console.log('get offer message dialer is', req.body)
  if(connect.broadcast.initiator[`${req.body.recipient}`] === undefined) {
    connect.message.answer[`${req.body.id}`] = req.body
    res.send({
      pathname: "",
      clientID: "",
      message: "",
      _scriptDir: import.meta.url,
      success: true,
      status:'post: await initiator'
    })
  } else {
    await sendEventsToInitiator(req.body.message, req.body.recipient)
    res.send({
      pathname: "",
      clientID: "",
      message: "",
      _scriptDir: import.meta.url,
      success: true,
      status:'post: send answer message to recipient'
    })
  }
})

app.options('/terminate', cors(corsOptions))
app.post('/terminate',async function(req, res) {
  (req.body.initiator)
    ?(
        delete connect.broadcast.initiator[`${req.body.id}`],
        delete connect.message.offer[`${req.body.id}`],
        delete connect.broadcast.dialer[`${req.body.recipient}`],
        delete connect.message.answer[`${req.body.recipient}`]
     )
    :(
        delete connect.broadcast.dialer[`${req.body.id}`],
        delete connect.message.answer[`${req.body.id}`],
        delete connect.broadcast.initiator[`${req.body.recipient}`],
        delete connect.message.offer[`${req.body.recipient}`]
     )
    res.send({
      pathname: "",
      clientID: "",
      message:  {
        initiator: req.body.initiator,
        id: req.body.id,
        recipient: req.body.recipient
      },
      _scriptDir: import.meta.url,
      success: true,
      status:'post: terminate connect'
    })
})

app.options('/*', cors(corsOptions))
app.post('/*',async function(req, res) {
  res.send(JSON.stringify({status:"path not found"}))
})

let port = process.env.PORT || 4434
app.listen(port ,() =>{
  console.log('pid: ', process.pid)
  console.log('listening on http://localhost:'+ port);
});



