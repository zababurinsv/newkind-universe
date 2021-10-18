let manual = {
    signal: 'web',
}

let object = {
    url: {
        signal: {
            web: 'https://web3-news.herokuapp.com',
            web2: "https://web3.news",
            web3: "https://web3-star.herokuapp.com",
            local: 'http://localhost:4434',
        }
    },
    role: {
        recipient: "recipient",
        initiator: "initiator"
    },
    test: {
        peer: {
            "0": "QmcrQZ6RJdpYuGvZqD5QEHAv6qX4BrQLJLQPQUrTrzdcgm",
            "1": "Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP"
        }
    }
}

export default  {
    "_": manual.signal,
    signal: object.url.signal[`${manual.signal}`],
    role: object.role,
    test: object.test
}